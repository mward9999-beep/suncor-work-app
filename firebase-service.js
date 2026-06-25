import { firebaseConfig as fileConfig } from "./firebase-config.js";

const FIREBASE_CONFIG_KEY = "maintenance-firebase-config-v1";
const SDK_VERSION = "12.15.0";
const DATA_COLLECTIONS = {
  equipment: "equipment",
  procedures: "procedures",
  jobs: "workflowCards",
  worksheetImports: "worksheetImports",
  activities: "activities",
};

function cleanValue(value) {
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, cleanValue(item)]),
    );
  }
  return value;
}

export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // The setup screen will report invalid configuration when the user saves it.
  }
  return fileConfig;
}

export function isFirebaseConfigured(config = getStoredFirebaseConfig()) {
  return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

export function saveFirebaseConfig(config) {
  if (!isFirebaseConfigured(config)) {
    throw new Error("The Firebase configuration must include apiKey, authDomain, projectId, and appId.");
  }
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
}

export class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.modules = null;
    this.persistedIds = Object.fromEntries(Object.keys(DATA_COLLECTIONS).map((key) => [key, new Set()]));
  }

  async initialize(config = getStoredFirebaseConfig()) {
    if (!isFirebaseConfigured(config)) throw new Error("Firebase setup is incomplete.");

    const [appModule, firestoreModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),
    ]);

    this.modules = { ...appModule, ...firestoreModule };
    this.app = appModule.initializeApp(config);
    this.db = firestoreModule.getFirestore(this.app);
    return this;
  }

  async loadAppState() {
    const entries = await Promise.all(
      Object.entries(DATA_COLLECTIONS).map(async ([stateKey, collectionName]) => {
        const snapshot = await this.modules.getDocs(this.modules.collection(this.db, collectionName));
        const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
        this.persistedIds[stateKey] = new Set(items.map((item) => item.id));
        return [stateKey, items];
      }),
    );
    const state = Object.fromEntries(entries);
    const hasCloudData = Object.values(state).some((items) => items.length);
    return hasCloudData ? state : null;
  }

  async saveAppState(state, role) {
    if (role !== "supervisor") throw new Error("Only Supervisors can save Firestore data.");
    const batch = this.modules.writeBatch(this.db);
    const nextPersistedIds = {};

    for (const [stateKey, collectionName] of Object.entries(DATA_COLLECTIONS)) {
      const items = state[stateKey] || [];
      const currentIds = new Set(items.map((item) => item.id));
      for (const item of items) {
        batch.set(
          this.modules.doc(this.db, collectionName, item.id),
          cleanValue(item),
        );
      }
      for (const staleId of this.persistedIds[stateKey]) {
        if (!currentIds.has(staleId)) {
          batch.delete(this.modules.doc(this.db, collectionName, staleId));
        }
      }
      nextPersistedIds[stateKey] = currentIds;
    }

    await batch.commit();
    this.persistedIds = nextPersistedIds;
  }
}
