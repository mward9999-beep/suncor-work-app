import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { localLoginAccounts } from "../firebase-config.js";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const distDir = join(rootDir, "dist");

const filesToCopy = [
  "index.html",
  "app.js",
  "styles.css",
  "firebase-config.js",
  "firebase-service.js",
];

async function loadLocalEnvFile() {
  try {
    const contents = await readFile(join(rootDir, ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // .env.local is optional. Vercel can provide the same values as Environment Variables.
  }
}

function envValue(...names) {
  return names.map((name) => process.env[name]).find(Boolean) || "";
}

function firebaseConfigFromEnv() {
  const config = {
    apiKey: envValue("VITE_FIREBASE_API_KEY", "FIREBASE_API_KEY"),
    authDomain: envValue("VITE_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN"),
    projectId: envValue("VITE_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"),
    storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: envValue("VITE_FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_MESSAGING_SENDER_ID"),
    appId: envValue("VITE_FIREBASE_APP_ID", "FIREBASE_APP_ID"),
  };

  return config.apiKey && config.authDomain && config.projectId && config.appId ? config : null;
}

async function writeFirebaseConfigIfEnvProvided() {
  const firebaseConfig = firebaseConfigFromEnv();
  if (!firebaseConfig) {
    console.log("No complete Firebase environment config found. The app setup screen can still accept Firebase config after deployment.");
    return;
  }

  const output = `export const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};\n\nexport const localLoginAccounts = ${JSON.stringify(localLoginAccounts, null, 2)};\n`;
  await writeFile(join(distDir, "firebase-config.js"), output);
  console.log("Firebase web config loaded from environment variables.");
}

await loadLocalEnvFile();
await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await Promise.all(
  filesToCopy.map((fileName) => copyFile(join(rootDir, fileName), join(distDir, fileName))),
);

await writeFirebaseConfigIfEnvProvided();

console.log(`Build complete: ${distDir}`);
