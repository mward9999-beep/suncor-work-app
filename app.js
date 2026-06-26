import {
  FirebaseService,
  clearFirebaseConfig,
  getStoredFirebaseConfig,
  isFirebaseConfigured,
  saveFirebaseConfig,
} from "./firebase-service.js";
import { localLoginAccounts } from "./firebase-config.js";

const STORAGE_KEY = "maintenance-control-center-v1";
const LOCAL_SESSION_KEY = "maintenance-local-session-v1";
const THEME_KEY = "maintenance-theme-v1";
const APP_VERSION_LABEL = "Version 1.1 - delete button update";
const ROLE_PERMISSIONS = {
  supervisor: new Set([
    "viewDashboard",
    "viewWorkflow",
    "viewEquipment",
    "viewProcedures",
    "manageJobs",
    "manageEquipment",
    "manageProcedures",
    "importWorksheets",
    "resetData",
  ]),
  tech: new Set(["viewDashboard", "viewWorkflow", "viewEquipment", "viewProcedures"]),
};
const STATUSES = [
  "Planned",
  "In Progress",
  "Waiting on Parts",
  "Waiting on Support",
  "Completed",
  "Carryover",
];

const icons = {
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  board: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>`,
  equipment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 15h16v5H4zM7 15V9a5 5 0 0 1 10 0v6M12 4v3M9 8h6"/><circle cx="8" cy="17.5" r=".8" fill="currentColor"/><circle cx="16" cy="17.5" r=".8" fill="currentColor"/></svg>`,
  document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>`,
  import: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5v.5"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 6a5 5 0 0 0-6.5 6.5L3 17l4 4 4.5-4.5A5 5 0 0 0 18 10l-3 3-4-4 3-3Z"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>`,
};

const nowOffset = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const WORKSHEET_SAMPLES = [
  {
    id: "day-shift-crushers",
    title: "Day shift - crushers and conveyors",
    text: `DAY SHIFT MAINTENANCE WORKSHEET

Shift: Day shift 06:00-18:00
Area: Ore prep / crusher floor
Supervisor: Maintenance Supervisor

PLANNED:
- Unit 803 - inspect head pulley bearing temperature trend with Mechanical A before lunch.
- Unit 804 - check belt scraper wear and adjust primary cleaner assigned to Millwright Crew.
- Unit 1403 - grease tail pulley and confirm auto-lube cycle by Lubrication.
- Unit 912 - inspect hydraulic hose rub point on chute gate with Operations.

IN PROGRESS:
- Unit 803 - vibration reading started on drive end bearing by Reliability.
- Unit 1403 - housekeeping and guard inspection underway with Mechanical B.

COMPLETED:
- Unit 804 - replaced damaged return roller and returned conveyor to service.
- Unit 803 - tightened loose inspection cover bolts, no leak after restart.
- Unit 1403 - completed walkdown of emergency pull cords, all tested normal.

WAITING ON PARTS:
- Unit 804 - waiting on parts for secondary scraper blade kit, warehouse ETA 15:30.
- Unit 1403 - belt tracking roller parts required before permanent correction.

WAITING ON SUPPORT:
- Unit 912 - waiting on operations support to isolate chute gate for hose clamp repair.

CARRYOVER:
- Unit 803 - carryover work to replace cracked belt guard next shift.
- Unit 1403 - next shift to finish tail pulley lagging inspection when access clears.

SAFETY:
- Unit 803 requires full LOTO before any guard removal.
- Unit 804 walkway has wet fines on east side; barricade installed until cleanup complete.
- Unit 912 hydraulic line must be depressurized before clamp work.

PRIORITY:
- Critical: Unit 803 bearing temperature is rising and must be checked before rate increase.
- High: Unit 804 scraper blade failure is causing carryback near the walkway.

CREW NOTES:
- Mechanical A available until 14:00, then moving to pump house callout.
- Reliability asked for vibration route readings to be uploaded before shift handoff.
- Operations wants Unit 803 status update before evening production meeting.`
  },
  {
    id: "night-shift-pumps",
    title: "Night shift - pumps and utilities",
    text: `NIGHT SHIFT MAINTENANCE WORKSHEET

Shift: Night shift 18:00-06:00
Area: Pump house / utilities
Weather: Cold, blowing snow at north doors

PLANNED:
- Unit 803 - inspect seal water flow and clean strainer assigned to Utilities Crew.
- Unit 804 - verify pump coupling guard hardware after vibration complaint.
- Unit 1403 - check sump pump float switch operation with Electrical.
- P-2401A - collect follow-up vibration reading by Reliability.

IN PROGRESS:
- Unit 804 - pump alignment check started by Mechanical B, readings not final.
- Unit 1403 - electrician currently working float switch wiring.

COMPLETED:
- Unit 803 - completed suction strainer cleanout, differential pressure returned to normal.
- P-2401A - completed oil top-up and cleaned sight glass.
- Unit 805 - replaced missing drain plug tag and updated operator board.

WAITING ON PARTS:
- Unit 804 - awaiting coupling insert from stores, pump remains available on standby only.
- Unit 1403 - parts needed for float switch junction-box gasket.

WAITING ON SUPPORT:
- Unit 803 - waiting on operations support for final pump swap test.

CARRYOVER:
- Unit 804 - carryover precision alignment verification to day shift if coupling insert arrives late.
- Unit 1403 - next shift to complete gasket replacement and wet test.

SAFETY:
- Unit 803 floor drain area is icy; salt applied and cones placed.
- Unit 804 motor must remain locked out until coupling insert is installed.
- Unit 1403 sump area requires gas test before opening cover.

PRIORITY:
- High: Unit 804 coupling insert is needed before standby pump can be trusted.
- Critical: Unit 1403 float switch failure could cause sump overflow during thaw.

CREW NOTES:
- Night crew short one electrician after 02:00.
- Parts runner will check stores again at 23:00.
- Operations requested simple pass/fail notes for pump swap test.`
  },
  {
    id: "day-shift-excavator-support",
    title: "Day shift - mobile equipment support",
    text: `DAY SHIFT FIELD MAINTENANCE WORKSHEET

Shift: Day shift
Area: Mine support / mobile equipment pad
Crew: Mobile Maintenance A and Weld Truck 2

PLANNED:
- Unit 803 - inspect boom pin grease line and replace damaged clamp assigned to Mobile A.
- Unit 804 - troubleshoot intermittent backup alarm with Electrical Support.
- Unit 1403 - service air dryer and drain tanks before release to operations.
- Unit 1404 - planned tire pressure inspection and wheel-nut torque check.

IN PROGRESS:
- Unit 804 - electrical diagnostic underway, alarm works cold but fails after warmup.
- Unit 1403 - air dryer cartridge removed, waiting for clean sealing surface.

COMPLETED:
- Unit 803 - completed hydraulic fitting re-torque on stick cylinder, no seep found after test.
- Unit 1404 - completed wheel-nut torque check and signed off inspection sheet.
- Unit 806 - replaced broken mirror bracket and returned to ready line.

WAITING ON PARTS:
- Unit 1403 - waiting on parts for air dryer cartridge and purge valve kit.
- Unit 804 - backup alarm connector pigtail on order from vendor.

WAITING ON SUPPORT:
- Unit 803 - waiting on welding support to repair cracked handrail mount.
- Unit 804 - waiting on operations to release machine after haul road cleanup.

CARRYOVER:
- Unit 803 - carryover handrail mount repair if weld truck remains tied up.
- Unit 1403 - next shift to complete air dryer rebuild once parts arrive.

SAFETY:
- Unit 803 boom must be mechanically supported before working near grease line.
- Unit 804 spotter required while moving in pad because backup alarm is unreliable.
- Unit 1403 air system must be drained to zero pressure before service.

PRIORITY:
- Critical: Unit 804 backup alarm fault must be fixed before machine returns to haul road.
- High: Unit 803 handrail crack is a fall hazard for operators.

CREW NOTES:
- Welding support available after lunch if no shovel callout.
- Mobile A wants photos attached to Unit 803 handrail work order.
- Operations asked for Unit 804 update by 16:00.`
  },
  {
    id: "turnaround-conveyor-handoff",
    title: "Turnaround - conveyor handoff",
    text: `TURNAROUND MAINTENANCE HANDOFF

Shift: Turnaround day 3
Area: Transfer tower / conveyor gallery
Permit board reviewed at 06:15

PLANNED:
- Unit 803 - replace worn skirt rubber on loading zone with Millwright Crew.
- Unit 804 - inspect gearbox breather and sample oil by Reliability.
- Unit 1403 - verify belt splice condition after cleanup.
- Unit 1501 - planned inspection of plugged chute door hinges.

IN PROGRESS:
- Unit 803 - skirt rubber removal underway, two bolts seized.
- Unit 1501 - hinge inspection started with Operations standing by.

COMPLETED:
- Unit 804 - completed gearbox oil sample and breather clean, sample sent to lab.
- Unit 1403 - completed belt splice visual check, no cord exposure found.
- Unit 803 - completed lockout verification and try-start with Operations.

WAITING ON PARTS:
- Unit 803 - waiting on parts for stainless skirt clamp hardware.
- Unit 1501 - parts required for lower hinge pin and cotter kit.

WAITING ON SUPPORT:
- Unit 803 - waiting on scaffold support for west-side access.
- Unit 1403 - waiting on cleanup crew to remove fines pile before final walkdown.

CARRYOVER:
- Unit 1501 - carryover hinge pin replacement to night shift if kit arrives after 17:00.
- Unit 803 - next shift to complete skirt clamp install after scaffold is signed off.

SAFETY:
- Unit 803 has open edge at west-side access; barricade and tie-off required.
- Unit 1501 chute door is heavy; use chain fall before pulling hinge pin.
- Unit 1403 cleanup area has trip hazard from wet fines and wash hose.

PRIORITY:
- High: Unit 803 skirt rubber must be complete before turnover to operations.
- Critical: Unit 1501 chute door hinge is binding and could drop if pin is pulled incorrectly.

CREW NOTES:
- Scaffold crew estimated arrival 10:30.
- Reliability will send Unit 804 oil sample number after lunch.
- Turnaround planner wants carryover list by 16:30.`
  },
  {
    id: "weekend-callout",
    title: "Weekend callout - priority problems",
    text: `WEEKEND MAINTENANCE CALLOUT WORKSHEET

Shift: Weekend callout
Area: Plant wide
Call received: 07:40

PLANNED:
- Unit 803 - investigate abnormal noise reported at north bearing with Mechanical A.
- Unit 804 - inspect plugged chute switch and clean target with Operations.
- Unit 1403 - planned reset and test of zero-speed switch with Electrical.
- Unit 1602 - check air leak on actuator supply tubing.

IN PROGRESS:
- Unit 803 - crew currently opening guard after LOTO verification.
- Unit 804 - operations cleaning chute access before maintenance enters.

COMPLETED:
- Unit 1602 - completed tubing fitting replacement and leak test passed.
- Unit 1403 - completed zero-speed switch reset, test run normal.
- Unit 807 - completed housekeeping around MCC access door.

WAITING ON PARTS:
- Unit 803 - waiting on parts for bearing seal kit if inspection confirms damage.
- Unit 804 - replacement plugged chute switch not in crib, parts runner checking warehouse.

WAITING ON SUPPORT:
- Unit 1403 - waiting on control room support for second test run at reduced speed.

CARRYOVER:
- Unit 804 - carryover switch replacement if warehouse cannot locate spare.
- Unit 803 - next shift to plan bearing change if seal kit and bearing are required.

SAFETY:
- Unit 803 noise investigation requires guard removal only after zero energy verification.
- Unit 804 chute access requires confined-space review if buildup is above lower door.
- Unit 1403 electrical test requires radio contact with control room.

PRIORITY:
- Critical: Unit 803 bearing noise could stop feed conveyor if condition worsens.
- High: Unit 804 plugged chute switch is bypass risk and needs proper repair.

CREW NOTES:
- Callout crew includes one millwright, one electrician, and operations lead.
- Keep notes short for Monday planning meeting.
- If Unit 803 bearing is damaged, supervisor wants photos and bearing temperature trend.`
  },
];

function createSampleData() {
  return {
    equipment: [
      { id: "eq-1", unit: "P-2401A", type: "Centrifugal Pump", area: "Process Unit 2", status: "Attention", notes: "Primary product transfer pump. Increased vibration noted on the drive-end bearing during the last operator round.", procedureIds: ["proc-1", "proc-4"] },
      { id: "eq-2", unit: "C-3102", type: "Reciprocating Compressor", area: "Compression", status: "Running", notes: "Second-stage compressor. Recent valve inspection complete; monitor discharge temperature trend.", procedureIds: ["proc-2"] },
      { id: "eq-3", unit: "E-1180", type: "Shell & Tube Exchanger", area: "Utilities", status: "Available", notes: "Cooling-water exchanger. Fouling rate is within normal operating range.", procedureIds: ["proc-3"] },
      { id: "eq-4", unit: "V-2205", type: "Separator Vessel", area: "Process Unit 2", status: "Running", notes: "Three-phase separator. Level transmitter intermittently drifts during high-rate operation.", procedureIds: ["proc-5"] },
      { id: "eq-5", unit: "FV-4407", type: "Control Valve", area: "Tank Farm", status: "Offline", notes: "Feed control valve isolated and tagged. Actuator response is slow and positioner requires calibration.", procedureIds: ["proc-6"] },
      { id: "eq-6", unit: "M-5201", type: "Fin Fan Motor", area: "Cooling Area", status: "Running", notes: "75 kW induction motor. Grease route due this week.", procedureIds: ["proc-4"] },
      { id: "eq-7", unit: "TK-102", type: "Storage Tank", area: "Tank Farm", status: "Available", notes: "Diesel storage tank. Roof seal visual inspection completed this month.", procedureIds: ["proc-7"] },
    ],
    procedures: [
      { id: "proc-1", code: "MEC-PMP-014", title: "Centrifugal Pump Bearing Inspection", estimatedTime: "2.5 hours", tools: ["Vibration meter", "Dial indicator", "Torque wrench", "Feeler gauges"], safety: "Apply full electrical and process isolation. Verify zero energy and drain residual product before opening guards.", equipmentIds: ["eq-1"], steps: ["Review operating history and current vibration trend.", "Confirm work permit and complete lockout/tagout.", "Remove coupling guard and inspect for visible damage.", "Measure shaft alignment and bearing clearances.", "Inspect lubrication condition and replenish if required.", "Reinstall guard, remove isolation, and perform a monitored test run."] },
      { id: "proc-2", code: "MEC-CMP-008", title: "Compressor Valve Inspection", estimatedTime: "4 hours", tools: ["Socket set", "Borescope", "Valve puller", "New gaskets"], safety: "Depressurize all stages, lock out driver, and verify no trapped pressure before removing valve covers.", equipmentIds: ["eq-2"], steps: ["Confirm compressor is fully isolated and depressurized.", "Remove valve covers in the specified sequence.", "Extract suction and discharge valves.", "Inspect plates, springs, seats, and guards.", "Replace damaged components and all disturbed gaskets.", "Torque covers, leak test, and document findings."] },
      { id: "proc-3", code: "OPS-HEX-021", title: "Heat Exchanger Performance Check", estimatedTime: "1 hour", tools: ["IR thermometer", "Pressure gauge", "Operations trend display"], safety: "Use designated access platforms and heat-resistant gloves around exposed hot surfaces.", equipmentIds: ["eq-3"], steps: ["Record inlet and outlet temperatures on both sides.", "Record differential pressure.", "Compare readings with baseline performance.", "Inspect for external leakage or abnormal vibration.", "Calculate approach temperature and flag significant degradation."] },
      { id: "proc-4", code: "LUB-ROT-003", title: "Rotating Equipment Lubrication", estimatedTime: "45 minutes", tools: ["Specified grease", "Grease gun", "Cleaning cloths"], safety: "Keep clear of rotating components. Do not remove guards while equipment is running.", equipmentIds: ["eq-1", "eq-6"], steps: ["Confirm lubricant type and quantity from equipment record.", "Clean grease fitting and surrounding area.", "Apply measured quantity slowly.", "Inspect purge condition and clean excess lubricant.", "Record completion and any abnormal observations."] },
      { id: "proc-5", code: "INS-LVL-011", title: "Level Transmitter Validation", estimatedTime: "1.5 hours", tools: ["HART communicator", "Multimeter", "Pressure source"], safety: "Confirm process connection isolation before disconnecting impulse lines. Wear splash protection.", equipmentIds: ["eq-4"], steps: ["Review transmitter range and alarm setpoints.", "Place control loop in manual with operations approval.", "Isolate and equalize the transmitter.", "Apply test points at 0, 25, 50, 75, and 100 percent.", "Adjust zero/span if outside tolerance.", "Return to service and confirm control-room indication."] },
      { id: "proc-6", code: "INS-CV-019", title: "Control Valve Positioner Calibration", estimatedTime: "2 hours", tools: ["HART communicator", "Air regulator", "Multimeter"], safety: "Isolate the valve from the process and verify actuator travel cannot create a process hazard.", equipmentIds: ["eq-5"], steps: ["Confirm valve isolation and bypass status.", "Inspect linkage, air supply, and tubing.", "Run positioner auto-calibration.", "Stroke valve through 0, 25, 50, 75, and 100 percent.", "Verify feedback and fail position.", "Return loop to service and document as-left values."] },
      { id: "proc-7", code: "INS-TNK-006", title: "Tank External Visual Inspection", estimatedTime: "1 hour", tools: ["Camera", "Flashlight", "Inspection checklist"], safety: "Maintain safe distance from vents and use fall protection where required by the access plan.", equipmentIds: ["eq-7"], steps: ["Inspect shell for corrosion, dents, and coating damage.", "Check nozzles, flanges, and valves for leakage.", "Inspect stairs, platforms, and handrails.", "Review roof and seal condition from approved access points.", "Photograph findings and update inspection record."] },
    ],
    jobs: [
      { id: "job-1", equipmentId: "eq-1", description: "Investigate elevated drive-end vibration", priority: "Critical", assignee: "Mechanical A", procedureId: "proc-1", notes: "Vibration increased from 4.2 to 8.7 mm/s overnight. Confirm bearing condition before next rate increase.", status: "In Progress", createdAt: nowOffset(-7), plannedAt: nowOffset(-2), completedAt: null },
      { id: "job-2", equipmentId: "eq-5", description: "Calibrate valve positioner and verify stroke", priority: "High", assignee: "Instrument A", procedureId: "proc-6", notes: "Valve isolated. Operations requires return by 14:00.", status: "Planned", createdAt: nowOffset(-4), plannedAt: nowOffset(3), completedAt: null },
      { id: "job-3", equipmentId: "eq-2", description: "Replace second-stage suction valve gaskets", priority: "High", assignee: "Mechanical B", procedureId: "proc-2", notes: "Gasket kit requested from warehouse.", status: "Waiting on Parts", createdAt: nowOffset(-19), plannedAt: nowOffset(-5), completedAt: null },
      { id: "job-4", equipmentId: "eq-4", description: "Validate level transmitter LT-2205", priority: "Medium", assignee: "Instrument B", procedureId: "proc-5", notes: "Coordinate loop handover with console operator.", status: "Waiting on Support", createdAt: nowOffset(-11), plannedAt: nowOffset(5), completedAt: null },
      { id: "job-5", equipmentId: "eq-6", description: "Complete scheduled motor lubrication route", priority: "Low", assignee: "Lubrication", procedureId: "proc-4", notes: "Include vibration spot reading during route.", status: "Planned", createdAt: nowOffset(-5), plannedAt: nowOffset(7), completedAt: null },
      { id: "job-6", equipmentId: "eq-3", description: "Check exchanger thermal performance", priority: "Medium", assignee: "Operations", procedureId: "proc-3", notes: "Capture readings at stable unit rate.", status: "Planned", createdAt: nowOffset(-2), plannedAt: nowOffset(19), completedAt: null },
      { id: "job-7", equipmentId: "eq-7", description: "Repair loose north platform toe board", priority: "Medium", assignee: "Facilities", procedureId: null, notes: "Barricade remains in place. Requires mobile scaffold.", status: "Carryover", createdAt: nowOffset(-30), plannedAt: nowOffset(-20), completedAt: null },
      { id: "job-8", equipmentId: "eq-2", description: "Inspect compressor valve temperatures", priority: "Medium", assignee: "Operations", procedureId: "proc-2", notes: "All temperatures within expected range.", status: "Completed", createdAt: nowOffset(-15), plannedAt: nowOffset(-10), completedAt: nowOffset(-3) },
      { id: "job-9", equipmentId: "eq-3", description: "Tighten cooling-water flange fasteners", priority: "High", assignee: "Mechanical A", procedureId: null, notes: "Minor seep stopped. Rechecked after warm-up.", status: "Completed", createdAt: nowOffset(-26), plannedAt: nowOffset(-24), completedAt: nowOffset(-18) },
      { id: "job-10", equipmentId: "eq-1", description: "Collect post-start vibration baseline", priority: "Medium", assignee: "Reliability", procedureId: "proc-1", notes: "Baseline stored in condition monitoring system.", status: "Completed", createdAt: nowOffset(-40), plannedAt: nowOffset(-38), completedAt: nowOffset(-32) },
      { id: "job-11", equipmentId: "eq-4", description: "Inspect separator sight glass", priority: "Low", assignee: "Operations", procedureId: null, notes: "Glass clean and valves operable.", status: "Completed", createdAt: nowOffset(-9), plannedAt: nowOffset(-8), completedAt: nowOffset(-6) },
    ],
    activities: [
      { id: "act-1", text: "Separator sight glass inspection completed", meta: "V-2205 · Operations", time: nowOffset(-6), type: "complete" },
      { id: "act-2", text: "P-2401A moved to In Progress", meta: "Mechanical A", time: nowOffset(-2), type: "move" },
      { id: "act-3", text: "New priority work created for FV-4407", meta: "Instrument A", time: nowOffset(-4), type: "create" },
      { id: "act-4", text: "Compressor work waiting on gasket kit", meta: "C-3102 · Mechanical B", time: nowOffset(-8), type: "move" },
    ],
    worksheetImports: [],
  };
}

const firebaseService = new FirebaseService();
let firebaseReady = false;
let currentUser = loadLocalSession();
let state = loadLegacyState();
let currentView = "dashboard";
let selectedEquipmentId = state.equipment[0]?.id || null;
let selectedProcedureId = state.procedures[0]?.id || null;
let selectedWorksheetId = state.worksheetImports[0]?.id || null;
let selectedSampleWorksheetId = WORKSHEET_SAMPLES[0]?.id || "";
let draggedJobId = null;

function can(permission) {
  return Boolean(currentUser && ROLE_PERMISSIONS[currentUser.role]?.has(permission));
}

function requirePermission(permission) {
  if (can(permission)) return true;
  showToast("Read-only access", "This action requires a Supervisor login.");
  return false;
}

function supervisorOnly(markup) {
  return currentUser?.role === "supervisor" ? markup : "";
}

function applyAuthState() {
  const loggedIn = Boolean(currentUser);
  const loginScreen = document.querySelector("#login-screen");
  const appShell = document.querySelector(".app-shell");
  document.body.classList.toggle("logged-in", loggedIn);
  document.body.classList.toggle("logged-out", !loggedIn);
  document.body.classList.toggle("role-supervisor", currentUser?.role === "supervisor");
  document.body.classList.toggle("role-tech", currentUser?.role === "tech");
  loginScreen.setAttribute("aria-hidden", String(loggedIn));
  loginScreen.inert = loggedIn;
  appShell.setAttribute("aria-hidden", String(!loggedIn));
  appShell.inert = !loggedIn;
  if (!loggedIn) return;

  const roleLabel = currentUser.role === "supervisor" ? "Supervisor" : "Tech · Read only";
  document.querySelector("#role-pill").textContent = roleLabel;
  document.querySelector("#sidebar-user-avatar").textContent = currentUser.role === "supervisor" ? "S" : "T";
  document.querySelector("#sidebar-user-name").textContent = currentUser.name;
  document.querySelector("#sidebar-user-role").textContent = currentUser.role === "supervisor" ? "Full control" : "Read-only access";
  document.querySelector('[data-view="import"]').hidden = !can("importWorksheets");
  document.querySelector("#reset-data-button").hidden = !can("resetData");
  document.querySelectorAll("[data-permission]").forEach((element) => {
    element.hidden = !can(element.dataset.permission);
  });
}

function showLoading(title, detail) {
  document.querySelector("#loading-title").textContent = title;
  document.querySelector("#loading-detail").textContent = detail;
  document.querySelector("#loading-overlay").classList.add("show");
  document.querySelector("#loading-overlay").setAttribute("aria-hidden", "false");
}

function hideLoading() {
  document.querySelector("#loading-overlay").classList.remove("show");
  document.querySelector("#loading-overlay").setAttribute("aria-hidden", "true");
}

function showFirebaseSetup(error = "") {
  const screen = document.querySelector("#firebase-setup-screen");
  screen.classList.add("show");
  screen.setAttribute("aria-hidden", "false");
  document.querySelector("#firebase-setup-error").textContent = error;
  document.querySelector("#login-screen").setAttribute("aria-hidden", "true");
  document.querySelector(".app-shell").setAttribute("aria-hidden", "true");
  document.querySelector("#login-screen").inert = true;
  document.querySelector(".app-shell").inert = true;
}

function hideFirebaseSetup() {
  const screen = document.querySelector("#firebase-setup-screen");
  screen.classList.remove("show");
  screen.setAttribute("aria-hidden", "true");
  document.querySelector("#login-screen").setAttribute("aria-hidden", String(Boolean(currentUser)));
  document.querySelector(".app-shell").setAttribute("aria-hidden", String(!currentUser));
  document.querySelector("#login-screen").inert = Boolean(currentUser);
  document.querySelector(".app-shell").inert = !currentUser;
}

function setCloudStatus(status, label) {
  const indicator = document.querySelector("#cloud-status");
  indicator.classList.toggle("saving", status === "saving");
  indicator.classList.toggle("error", status === "error");
  indicator.querySelector("strong").textContent = label;
}

function friendlyFirebaseError(error) {
  const code = error?.code || "";
  if (
    code.includes("invalid-login")
    || code.includes("invalid-email")
    || code.includes("invalid-credential")
    || code.includes("wrong-password")
    || code.includes("user-not-found")
  ) {
    return "Incorrect username or password.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }
  if (code.includes("not-initialized")) {
    return "Firebase is still connecting. Try again in a moment.";
  }
  if (code.includes("api-key-not-valid") || code.includes("invalid-api-key")) {
    return "Firebase connection settings are invalid. Open Firebase connection settings and paste the Web app config again.";
  }
  if (code.includes("permission-denied")) {
    return "Firestore blocked this action. Publish the temporary local-login Firestore rules and try again.";
  }
  if (code.includes("network-request-failed") || code.includes("unavailable")) {
    return "Firebase is currently unreachable. Check the internet connection and try again.";
  }
  if (code.includes("unauthorized-domain")) {
    return "This local address is not authorized in Firebase Authentication settings.";
  }
  if (error?.message?.includes("Firestore is empty")) {
    return error.message;
  }
  if (error?.message?.includes("not assigned to an app role")) {
    return "This Firebase account is not assigned to this app.";
  }
  if (error?.message?.includes("saved Firebase role")) {
    return "This account role needs Supervisor review before login.";
  }
  if (error?.message?.includes("Firebase setup is incomplete")) {
    return "Firebase setup is incomplete.";
  }
  return "Firebase could not complete the request. Check the console for details.";
}

function showStorageError(error, fallback) {
  const banner = document.querySelector("#storage-error-banner");
  document.querySelector("#storage-error-message").textContent = friendlyFirebaseError(error) || fallback;
  banner.hidden = false;
}

function clearStorageError() {
  document.querySelector("#storage-error-banner").hidden = true;
  document.querySelector("#storage-error-message").textContent = "";
}

function normalizeState(value) {
  const fallback = createSampleData();
  return {
    equipment: value?.equipment || fallback.equipment,
    procedures: value?.procedures || fallback.procedures,
    jobs: value?.jobs || fallback.jobs,
    worksheetImports: value?.worksheetImports || [],
    activities: value?.activities || [],
  };
}

function updateSelections() {
  selectedEquipmentId = state.equipment.some((item) => item.id === selectedEquipmentId)
    ? selectedEquipmentId
    : state.equipment[0]?.id || null;
  selectedProcedureId = state.procedures.some((item) => item.id === selectedProcedureId)
    ? selectedProcedureId
    : state.procedures[0]?.id || null;
  selectedWorksheetId = state.worksheetImports.some((item) => item.id === selectedWorksheetId)
    ? selectedWorksheetId
    : state.worksheetImports[0]?.id || null;
}

const viewMeta = {
  dashboard: ["Dashboard", "Operations overview"],
  workflow: ["Workflow Board", "Live work execution"],
  equipment: ["Equipment", "Asset registry"],
  procedures: ["Procedures", "Controlled work instructions"],
  import: ["Worksheet Import", "Turn field notes into action"],
};

function normalizeLoginValue(value) {
  return String(value || "").trim().toLowerCase();
}

function accountForLogin(usernameOrEmail) {
  const loginValue = normalizeLoginValue(usernameOrEmail);
  const match = Object.entries(localLoginAccounts).find(([username, account]) => (
    loginValue === normalizeLoginValue(username) || loginValue === normalizeLoginValue(account.email)
  ));

  if (!match) return null;
  const [username, account] = match;
  return { username, ...account };
}

function publicSessionForAccount(account) {
  return {
    username: account.username,
    email: account.email,
    name: account.name,
    role: account.role,
    provider: "local",
    signedInAt: new Date().toISOString(),
  };
}

function saveLocalSession(user) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("Could not save local login session.", error);
  }
}

function loadLocalSession() {
  try {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const account = parsed?.username ? accountForLogin(parsed.username) : accountForLogin(parsed?.email);
    if (!account || account.role !== parsed.role) return null;
    return {
      username: account.username,
      email: account.email,
      name: account.name,
      role: account.role,
      provider: "local",
      signedInAt: parsed.signedInAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Could not read local login session.", error);
    return null;
  }
}

function clearLocalSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn("Could not save theme preference.", error);
  }
}

function applyTheme(theme = loadTheme()) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = normalizedTheme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = normalizedTheme === "dark" ? "light" : "dark";
    const nextLabel = nextTheme === "dark" ? "Dark" : "Light";
    button.setAttribute("aria-label", `Switch to ${nextLabel} Mode`);
    if (button.classList.contains("theme-toggle-button")) {
      button.querySelector(".theme-toggle-icon").textContent = normalizedTheme === "dark" ? "☾" : "☀";
      button.querySelector(".theme-toggle-label").textContent = normalizedTheme === "dark" ? "Dark" : "Light";
    } else {
      button.textContent = `Switch to ${nextLabel} Mode`;
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  saveTheme(nextTheme);
  applyTheme(nextTheme);
}

function renderAppVersionLabel() {
  const footer = document.querySelector(".sidebar-footer");
  if (!footer) return;

  let versionLabel = document.querySelector("#app-version-label");
  if (!versionLabel) {
    versionLabel = document.createElement("div");
    versionLabel.id = "app-version-label";
    versionLabel.style.marginTop = "10px";
    versionLabel.style.padding = "9px 10px";
    versionLabel.style.border = "1px solid var(--border)";
    versionLabel.style.borderRadius = "12px";
    versionLabel.style.color = "var(--muted)";
    versionLabel.style.fontFamily = '"IBM Plex Mono", monospace';
    versionLabel.style.fontSize = "11px";
    versionLabel.style.letterSpacing = "0.02em";
    versionLabel.style.textAlign = "center";
    footer.appendChild(versionLabel);
  }

  versionLabel.textContent = APP_VERSION_LABEL;
}

function signInWithLocalAccount(usernameOrEmail, password) {
  // Firebase Auth can be re-enabled later by replacing this local session helper with Firebase Auth sign-in.
  const account = accountForLogin(usernameOrEmail);
  if (!account || String(password || "") !== account.password) {
    const error = new Error("Incorrect username or password.");
    error.code = "local/invalid-login";
    throw error;
  }
  const session = publicSessionForAccount(account);
  saveLocalSession(session);
  return session;
}

function loadLegacyState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.worksheetImports ||= [];
      return parsed;
    }
  } catch (error) {
    console.warn("Could not read saved app state.", error);
  }
  return createSampleData();
}

function saveLocalStateSnapshot() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Could not save local app backup.", error);
  }
}

async function saveState() {
  if (!currentUser) {
    showStorageError(new Error("You are not signed in."), "You are not signed in.");
    return false;
  }
  saveLocalStateSnapshot();
  if (!firebaseReady) {
    setCloudStatus("error", "Local");
    showStorageError(new Error("Firestore is not connected."), "Firestore is not connected. Changes are saved locally on this browser.");
    return true;
  }
  setCloudStatus("saving", "Saving");
  try {
    await firebaseService.saveAppState(state, currentUser.role);
    setCloudStatus("connected", "Saved");
    clearStorageError();
    return true;
  } catch (error) {
    setCloudStatus("error", "Error");
    showStorageError(error, "Data could not be saved to Firestore.");
    return false;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function equipmentById(id) {
  return state.equipment.find((item) => item.id === id);
}

function procedureById(id) {
  return state.procedures.find((item) => item.id === id);
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function priorityBadge(priority) {
  return `<span class="priority-badge ${priorityClass(priority)}">${escapeHtml(priority)}</span>`;
}

function statusBadge(status) {
  const statusClass = status === "Completed" ? "completed" : status.startsWith("Waiting") || status === "Carryover" ? "blocked" : "";
  return `<span class="status-badge ${statusClass}">${escapeHtml(status)}</span>`;
}

function formatTime(dateString, options = {}) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (options.relative) {
    const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  }
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date);
}

function isWithinHours(dateString, startHours, endHours) {
  if (!dateString) return false;
  const hours = (new Date(dateString).getTime() - Date.now()) / 3600000;
  return hours >= startHours && hours <= endHours;
}

function initials(name = "Unassigned") {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function addActivity(text, meta, type = "move") {
  state.activities.unshift({
    id: `act-${Date.now()}`,
    text,
    meta,
    type,
    time: new Date().toISOString(),
  });
  state.activities = state.activities.slice(0, 12);
}

function showToast(title, detail) {
  const region = document.querySelector("#toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<div class="toast-icon">${icons.check}</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>`;
  region.append(toast);
  setTimeout(() => toast.remove(), 3500);
}

function injectIcons() {
  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || "";
  });
}

function updateClock() {
  const now = new Date();
  document.querySelector("#current-time").textContent = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  document.querySelector("#current-date").textContent = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

function renderAll() {
  renderDashboard();
  renderWorkflow();
  renderEquipment();
  renderProcedures();
  renderImport();
  document.querySelector("#nav-open-count").textContent = state.jobs.filter((job) => job.status !== "Completed").length;
  applyAuthState();
}

function renderDashboard() {
  const plannedToday = state.jobs.filter((job) => job.status !== "Completed" && isWithinHours(job.plannedAt, -12, 12));
  const completedLast24 = state.jobs.filter((job) => job.completedAt && isWithinHours(job.completedAt, -24, 0));
  const upcoming = state.jobs.filter((job) => job.status !== "Completed" && isWithinHours(job.plannedAt, 12, 36));
  const priorityIssues = state.jobs
    .filter((job) => job.status !== "Completed" && ["Critical", "High"].includes(job.priority))
    .sort((a, b) => (a.priority === "Critical" ? -1 : 1));
  const blocked = state.jobs.filter((job) => job.status.startsWith("Waiting") || job.status === "Carryover" || (job.status !== "Completed" && new Date(job.plannedAt) < new Date()));
  const visibleToday = [...new Map([...plannedToday, ...state.jobs.filter((job) => job.status === "In Progress")].map((job) => [job.id, job])).values()].slice(0, 6);

  document.querySelector("#dashboard-view").innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Live shift picture</p>
        <h2>Maintenance at a glance</h2>
        <p>Current work, constraints, and priority equipment requiring supervisor attention.</p>
      </div>
      <div class="heading-actions">
        <button class="secondary-button" data-go-view="workflow">Open workflow board</button>
      </div>
    </div>

    <div class="summary-grid">
      ${summaryCard("Planned today", plannedToday.length, "Scheduled within this shift", "blue", icons.calendar)}
      ${summaryCard("Completed · 24h", completedLast24.length, `${state.jobs.filter((job) => job.status === "Completed").length} total in history`, "green", icons.check)}
      ${summaryCard("Upcoming · 24h", upcoming.length, "Next shift planning window", "orange", icons.clock)}
      ${summaryCard("Blocked / overdue", blocked.length, blocked.length ? "Supervisor action required" : "No current constraints", "red", icons.alert)}
    </div>

    <div class="dashboard-grid">
      <div class="stack">
        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon">${icons.wrench}</div>
              <div><h3>Work Planned for Today</h3><span>${visibleToday.length} active work orders in this view</span></div>
            </div>
            <button class="ghost-button" data-go-view="workflow">View board</button>
          </div>
          <div class="panel-body">
            ${visibleToday.length ? visibleToday.map(jobListRow).join("") : emptyState("No work is currently planned for this shift.")}
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon">${icons.clock}</div>
              <div><h3>Work Needed in Upcoming 24 Hours</h3><span>Forward look for crew coordination</span></div>
            </div>
          </div>
          <div class="panel-body">
            ${upcoming.length ? upcoming.slice(0, 5).map(jobListRow).join("") : emptyState("No work is scheduled in the upcoming 24-hour window.")}
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon">${icons.check}</div>
              <div><h3>Work Completed in Last 24 Hours</h3><span>Recently closed work orders</span></div>
            </div>
          </div>
          <div class="panel-body">
            ${completedLast24.length ? completedLast24.slice(0, 5).map(jobListRow).join("") : emptyState("No work orders have been completed in the last 24 hours.")}
          </div>
        </article>
      </div>

      <div class="stack">
        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon red">${icons.alert}</div>
              <div><h3>Priority Equipment Issues</h3><span>High-consequence open work</span></div>
            </div>
          </div>
          <div class="panel-body">
            ${priorityIssues.length ? priorityIssues.slice(0, 5).map(issueCard).join("") : emptyState("No critical or high-priority equipment issues.")}
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon orange">${icons.alert}</div>
              <div><h3>Blocked & Overdue</h3><span>Items requiring intervention</span></div>
            </div>
          </div>
          <div class="panel-body">
            ${blocked.length ? blocked.slice(0, 5).map(issueCard).join("") : emptyState("Nothing is blocked or overdue.")}
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <div class="panel-title-icon">${icons.spark}</div>
              <div><h3>Live Activity</h3><span>Most recent workflow updates</span></div>
            </div>
          </div>
          <div class="activity-list">
            ${state.activities.slice(0, 6).map(activityItem).join("")}
          </div>
        </article>
      </div>
    </div>
  `;
}

function summaryCard(label, value, note, color, icon) {
  return `<article class="summary-card ${color}">
    <div class="summary-top"><span class="summary-label">${label}</span><span class="summary-icon">${icon}</span></div>
    <strong class="summary-value">${value}</strong>
    <span class="summary-note"><span class="pulse-dot"></span>${note}</span>
  </article>`;
}

function jobListRow(job) {
  const equipment = equipmentById(job.equipmentId);
  return `<div class="job-list-row" data-edit-job="${job.id}">
    <span class="unit-code">${escapeHtml(equipment?.unit || "UNASSIGNED")}</span>
    <div class="job-description"><strong>${escapeHtml(job.description)}</strong><span>${escapeHtml(job.assignee || "Unassigned")} · ${formatTime(job.plannedAt)}</span></div>
    ${priorityBadge(job.priority)}
    ${statusBadge(job.status)}
    <span class="row-chevron">›</span>
  </div>`;
}

function issueCard(job) {
  const equipment = equipmentById(job.equipmentId);
  const isCritical = job.priority === "Critical";
  return `<div class="issue-card" data-edit-job="${job.id}">
    <span class="issue-indicator ${isCritical ? "" : "high"}"></span>
    <div class="issue-content">
      <div class="issue-meta"><span class="unit-code">${escapeHtml(equipment?.unit || "UNASSIGNED")}</span><span class="issue-time">${formatTime(job.createdAt, { relative: true })}</span></div>
      <strong>${escapeHtml(job.description)}</strong>
      <p>${escapeHtml(job.status)} · ${escapeHtml(job.assignee || "Unassigned")}</p>
    </div>
  </div>`;
}

function activityItem(activity) {
  return `<div class="activity-item">
    <span class="activity-dot">${activity.type === "complete" ? "✓" : activity.type === "create" ? "+" : "→"}</span>
    <div><strong>${escapeHtml(activity.text)}</strong><p>${escapeHtml(activity.meta)} · ${formatTime(activity.time, { relative: true })}</p></div>
  </div>`;
}

function renderWorkflow() {
  document.querySelector("#workflow-view").innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Execution board</p>
        <h2>Daily maintenance workflow</h2>
        <p>${can("manageJobs") ? "Drag work orders between columns. Every move immediately updates the dashboard and local work history." : "Review planned, active, constrained, completed, and carryover work across the full maintenance workflow."}</p>
      </div>
    </div>
    <div class="workflow-toolbar">
      <div class="filter-group">
        <div class="search-box">${icons.search}<input id="board-search" placeholder="Search work orders…" /></div>
        <select class="toolbar-select" id="board-priority-filter">
          <option value="">All priorities</option>
          <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
      </div>
      ${supervisorOnly(`<button class="primary-button" data-new-job><span>+</span> Add work order</button>`)}
    </div>
    ${can("manageJobs") ? "" : `<div class="read-only-banner"><span>View only</span> Tech access can review all work but cannot edit or move workflow cards.</div>`}
    <div class="workflow-board-wrap">
      <div class="workflow-board" id="workflow-board">
        ${STATUSES.map((status) => boardColumn(status, state.jobs.filter((job) => job.status === status))).join("")}
      </div>
    </div>
  `;
  attachBoardDnD();
}

function boardColumn(status, jobs) {
  return `<section class="board-column" data-status="${status}">
    <header class="column-header"><h3>${status}</h3><span class="column-count">${jobs.length}</span></header>
    <div class="column-jobs">
      ${jobs.length ? jobs.map(jobCard).join("") : `<div class="board-empty">Drop work here</div>`}
    </div>
  </section>`;
}

function jobCard(job) {
  const equipment = equipmentById(job.equipmentId);
  return `<article class="job-card ${can("manageJobs") ? "" : "read-only"}" draggable="${can("manageJobs")}" data-job-id="${job.id}" data-edit-job="${job.id}" data-search="${escapeHtml(`${equipment?.unit || ""} ${job.description} ${job.assignee}`.toLowerCase())}" data-priority="${job.priority}">
    <div class="job-card-top">
      <span class="unit-code">${escapeHtml(equipment?.unit || "UNASSIGNED")}</span>
      <span class="job-card-actions">
        ${priorityBadge(job.priority)}
        ${supervisorOnly(`<button type="button" class="job-delete-button" data-delete-job="${job.id}" aria-label="Delete job" title="Delete job">🗑</button>`)}
      </span>
    </div>
    <h3>${escapeHtml(job.description)}</h3>
    <p>${escapeHtml(job.notes || "No additional notes.")}</p>
    <div class="job-card-footer">
      <span class="assignee"><span class="avatar">${initials(job.assignee)}</span><span>${escapeHtml(job.assignee || "Unassigned")}</span></span>
      <span class="planned-time">${job.status === "Completed" ? formatTime(job.completedAt) : formatTime(job.plannedAt)}</span>
    </div>
  </article>`;
}

function attachBoardDnD() {
  if (!can("manageJobs")) return;
  document.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggedJobId = card.dataset.jobId;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedJobId);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      document.querySelectorAll(".board-column").forEach((column) => column.classList.remove("drag-over"));
    });
  });
  document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("drag-over");
    });
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const jobId = event.dataTransfer.getData("text/plain") || draggedJobId;
      moveJob(jobId, column.dataset.status);
    });
  });
}

async function moveJob(jobId, newStatus) {
  if (!requirePermission("manageJobs")) return;
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job || job.status === newStatus) return;
  const oldStatus = job.status;
  job.status = newStatus;
  job.completedAt = newStatus === "Completed" ? new Date().toISOString() : null;
  const equipment = equipmentById(job.equipmentId);
  addActivity(`${equipment?.unit || "Work order"} moved to ${newStatus}`, `${oldStatus} → ${newStatus} · ${job.assignee || "Unassigned"}`, newStatus === "Completed" ? "complete" : "move");
  if (!(await saveState())) return;
  renderAll();
  applyBoardFilters();
  showToast(newStatus === "Completed" ? "Work completed" : "Workflow updated", `${equipment?.unit || "Work order"} moved to ${newStatus}`);
}

function renderEquipment(filter = "") {
  const filtered = state.equipment.filter((equipment) =>
    `${equipment.unit} ${equipment.type} ${equipment.area}`.toLowerCase().includes(filter.toLowerCase()),
  );
  if (!filtered.some((item) => item.id === selectedEquipmentId)) selectedEquipmentId = filtered[0]?.id || state.equipment[0]?.id;
  const selected = equipmentById(selectedEquipmentId);
  document.querySelector("#equipment-view").innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Asset registry</p>
        <h2>Equipment</h2>
        <p>Browse asset condition, linked work, history, procedures, and operating notes.</p>
      </div>
      ${supervisorOnly(`<button class="primary-button" id="add-equipment-button"><span>+</span> Add equipment</button>`)}
    </div>
    <div class="master-detail">
      <aside class="master-list">
        <div class="master-list-header"><div class="search-box">${icons.search}<input id="equipment-search" value="${escapeHtml(filter)}" placeholder="Search equipment…" /></div></div>
        <div class="list-scroll">
          ${filtered.length ? filtered.map(equipmentListItem).join("") : emptyState("No equipment matches your search.")}
        </div>
      </aside>
      ${selected ? equipmentDetail(selected) : `<div class="detail-panel">${emptyState("Select an equipment unit to view its details.")}</div>`}
    </div>
  `;
}

function equipmentListItem(equipment) {
  const statusClass = equipment.status.toLowerCase();
  return `<button class="asset-list-item ${equipment.id === selectedEquipmentId ? "active" : ""}" data-equipment-id="${equipment.id}">
    <span class="asset-icon">${icons.equipment}</span>
    <div><strong>${escapeHtml(equipment.unit)}</strong><span>${escapeHtml(equipment.type)} · ${escapeHtml(equipment.area)}</span></div>
    <span class="asset-status-dot ${statusClass}"></span>
  </button>`;
}

function equipmentDetail(equipment) {
  const jobs = state.jobs.filter((job) => job.equipmentId === equipment.id);
  const open = jobs.filter((job) => job.status !== "Completed");
  const complete = jobs.filter((job) => job.status === "Completed").sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const procedures = state.procedures.filter((procedure) => procedure.equipmentIds.includes(equipment.id));
  return `<article class="detail-panel">
    <header class="detail-hero">
      <div>
        <p class="unit-large">${escapeHtml(equipment.unit)}</p>
        <h2>${escapeHtml(equipment.type)}</h2>
        <p>${escapeHtml(equipment.area)} · Asset record</p>
      </div>
      <div class="detail-hero-actions">
        ${statusBadge(equipment.status)}
        ${supervisorOnly(`
          <button class="secondary-button" data-edit-equipment="${equipment.id}">Edit</button>
          <button class="danger-button" data-delete-equipment="${equipment.id}">Delete</button>
        `)}
      </div>
    </header>
    <div class="detail-body">
      <div class="detail-stat-grid">
        <div class="detail-stat"><span>Open work</span><strong>${open.length}</strong></div>
        <div class="detail-stat"><span>Completed</span><strong>${complete.length}</strong></div>
        <div class="detail-stat"><span>Procedures</span><strong>${procedures.length}</strong></div>
        <div class="detail-stat"><span>Priority</span><strong>${open.some((job) => job.priority === "Critical") ? "P1" : open.some((job) => job.priority === "High") ? "P2" : "—"}</strong></div>
      </div>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Current notes</h3></div>
        <div class="notes-box">${escapeHtml(equipment.notes)}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Open work</h3>${supervisorOnly(`<button class="ghost-button" data-new-job-equipment="${equipment.id}">+ Add work</button>`)}</div>
        <div class="compact-job-list">${open.length ? open.map(compactJob).join("") : emptyState("No open work for this equipment.")}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Linked procedures</h3></div>
        <div class="tag-list">${procedures.length ? procedures.map((procedure) => `<button class="tiny-badge" data-open-procedure="${procedure.id}">${escapeHtml(procedure.code)} · ${escapeHtml(procedure.title)}</button>`).join("") : `<span class="tiny-badge">No linked procedures</span>`}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Completed work history</h3></div>
        <div class="compact-job-list">${complete.length ? complete.map(compactJob).join("") : emptyState("No completed work history for this equipment.")}</div>
      </section>
    </div>
  </article>`;
}

function compactJob(job) {
  return `<div class="compact-job" data-edit-job="${job.id}"><div><strong>${escapeHtml(job.description)}</strong><span>${escapeHtml(job.assignee || "Unassigned")} · ${job.status === "Completed" ? `Completed ${formatTime(job.completedAt)}` : job.status}</span></div>${priorityBadge(job.priority)}</div>`;
}

function renderProcedures(filter = "") {
  const filtered = state.procedures.filter((procedure) =>
    `${procedure.code} ${procedure.title} ${procedure.tools.join(" ")} ${procedure.steps.join(" ")}`.toLowerCase().includes(filter.toLowerCase()),
  );
  if (!filtered.some((item) => item.id === selectedProcedureId)) selectedProcedureId = filtered[0]?.id || state.procedures[0]?.id;
  const selected = procedureById(selectedProcedureId);
  document.querySelector("#procedures-view").innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Work instructions</p>
        <h2>Procedures</h2>
        <p>Search controlled procedures by title, code, equipment, tool, or step content.</p>
      </div>
      ${supervisorOnly(`<button class="primary-button" id="add-procedure-button"><span>+</span> Add procedure</button>`)}
    </div>
    <div class="master-detail">
      <aside class="master-list">
        <div class="master-list-header"><div class="search-box">${icons.search}<input id="procedure-search" value="${escapeHtml(filter)}" placeholder="Search procedures…" /></div></div>
        <div class="list-scroll">
          ${filtered.length ? filtered.map(procedureListItem).join("") : emptyState("No procedures match your search.")}
        </div>
      </aside>
      ${selected ? procedureDetail(selected) : `<div class="detail-panel">${emptyState("Select a procedure to view its details.")}</div>`}
    </div>
  `;
}

function procedureListItem(procedure) {
  return `<button class="procedure-list-item ${procedure.id === selectedProcedureId ? "active" : ""}" data-procedure-id="${procedure.id}">
    <span class="asset-icon">${icons.document}</span>
    <div><strong>${escapeHtml(procedure.title)}</strong><span>${escapeHtml(procedure.code)} · ${escapeHtml(procedure.estimatedTime)}</span></div>
    <span class="row-chevron">›</span>
  </button>`;
}

function procedureDetail(procedure) {
  const equipment = state.equipment.filter((item) => procedure.equipmentIds.includes(item.id));
  const linkedJobs = state.jobs.filter((job) => job.procedureId === procedure.id && job.status !== "Completed");
  return `<article class="detail-panel">
    <header class="detail-hero">
      <div>
        <p class="unit-large">${escapeHtml(procedure.code)}</p>
        <h2>${escapeHtml(procedure.title)}</h2>
        <p>Controlled maintenance procedure · ${procedure.steps.length} steps</p>
      </div>
      <div class="detail-hero-actions">
        ${supervisorOnly(`
          <button class="primary-button" data-new-job-procedure="${procedure.id}">Create linked work</button>
          <button class="secondary-button" data-edit-procedure="${procedure.id}">Edit</button>
          <button class="danger-button" data-delete-procedure="${procedure.id}">Delete</button>
        `)}
      </div>
    </header>
    <div class="detail-body procedure-content">
      <div class="procedure-meta-grid">
        <div class="detail-stat"><span>Estimated time</span><strong>${escapeHtml(procedure.estimatedTime)}</strong></div>
        <div class="detail-stat"><span>Related equipment</span><strong>${equipment.length}</strong></div>
        <div class="detail-stat"><span>Open linked work</span><strong>${linkedJobs.length}</strong></div>
      </div>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Safety notes</h3></div>
        <div class="safety-box">${escapeHtml(procedure.safety)}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Tools needed</h3></div>
        <div class="tag-list">${procedure.tools.map((tool) => `<span class="tiny-badge">${escapeHtml(tool)}</span>`).join("")}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Procedure steps</h3></div>
        <ol class="procedure-step-list">${procedure.steps.map((step) => `<li class="procedure-step">${escapeHtml(step)}</li>`).join("")}</ol>
      </section>
      <section class="detail-section">
        <div class="detail-section-title"><h3>Related equipment</h3></div>
        <div class="tag-list">${equipment.map((item) => `<button class="tiny-badge" data-open-equipment="${item.id}">${escapeHtml(item.unit)} · ${escapeHtml(item.type)}</button>`).join("")}</div>
      </section>
    </div>
  </article>`;
}

function renderImport() {
  const selectedWorksheet = state.worksheetImports.find((item) => item.id === selectedWorksheetId) || null;
  const savedWorksheets = state.worksheetImports.slice(0, 8);

  document.querySelector("#import-view").innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Worksheet assistant</p>
        <h2>OneNote worksheet to live workflow</h2>
        <p>Paste the daily worksheet once. Analysis saves the original text and summary, then creates editable cards directly in the correct workflow columns.</p>
      </div>
      <button class="secondary-button" id="new-worksheet-button">+ New worksheet</button>
    </div>
    ${savedWorksheets.length ? `
      <section class="saved-worksheet-strip">
        <div class="saved-worksheet-label"><span class="panel-title-icon">${icons.document}</span><div><strong>Saved worksheets</strong><span>${state.worksheetImports.length} saved locally</span></div></div>
        <div class="saved-worksheet-list">
          ${savedWorksheets.map(savedWorksheetButton).join("")}
        </div>
      </section>` : ""}
    <div class="import-layout">
      <section class="import-panel">
        <div class="panel-header">
          <div class="panel-title"><div class="panel-title-icon">${icons.import}</div><div><h3>Daily OneNote worksheet</h3><span>${selectedWorksheet ? `Saved ${formatTime(selectedWorksheet.createdAt)}` : "Paste text or upload .txt / .md"}</span></div></div>
        </div>
        <div class="import-panel-body">
          <label class="upload-zone" id="upload-zone">
            <input type="file" id="worksheet-file" accept=".txt,.md,text/plain" />
            <div><strong>Drop a worksheet here or choose a file</strong><span>Text stays on this device in the prototype</span></div>
          </label>
          <div class="sample-worksheet-simulator">
            <label class="field sample-worksheet-select">
              <span>Worksheet simulator</span>
              <select id="sample-worksheet-select">
                ${WORKSHEET_SAMPLES.map((sample) => `<option value="${escapeHtml(sample.id)}" ${sample.id === selectedSampleWorksheetId ? "selected" : ""}>${escapeHtml(sample.title)}</option>`).join("")}
              </select>
            </label>
            <button class="secondary-button" id="load-sample-worksheet">Load Sample Shift Worksheet</button>
          </div>
          <textarea class="worksheet-textarea" id="worksheet-text" placeholder="Paste your complete daily OneNote worksheet here…">${selectedWorksheet ? escapeHtml(selectedWorksheet.source) : ""}</textarea>
          <div class="import-actions">
            <button class="primary-button" id="analyze-worksheet">${icons.spark} Analyze Worksheet</button>
          </div>
          <p class="import-helper">Analysis automatically saves the source, creates cards, and places completed, carryover, parts, support, and active work in their matching columns.</p>
        </div>
      </section>
      <section class="import-panel">
        <div class="panel-header">
          <div class="panel-title"><div class="panel-title-icon">${icons.spark}</div><div><h3>Saved summary & workflow</h3><span>${selectedWorksheet ? `${selectedWorksheet.jobIds.length} generated cards` : "Structured action list"}</span></div></div>
        </div>
        <div class="import-panel-body" id="analysis-output">
          ${selectedWorksheet ? analysisResults(selectedWorksheet) : `
            <div class="analysis-placeholder">
              <div><span class="placeholder-icon">${icons.spark}</span><strong>Ready to build the shift workflow</strong><p>Paste the worksheet on the left. One click will summarize it, extract equipment and work, save the source, and populate the workflow board.</p></div>
            </div>`}
        </div>
      </section>
    </div>
  `;
  document.querySelector("#sample-worksheet-select").addEventListener("change", (event) => {
    selectedSampleWorksheetId = event.target.value;
  });
  document.querySelector("#load-sample-worksheet").addEventListener("click", () => {
    if (!requirePermission("importWorksheets")) return;
    const sample = WORKSHEET_SAMPLES.find((item) => item.id === selectedSampleWorksheetId) || WORKSHEET_SAMPLES[0];
    selectedSampleWorksheetId = sample.id;
    selectedWorksheetId = null;
    renderImport();
    document.querySelector("#sample-worksheet-select").value = sample.id;
    document.querySelector("#worksheet-text").value = sample.text.trim();
    document.querySelector("#worksheet-text").focus();
    showToast("Sample shift worksheet loaded", sample.title);
  });
  attachFileUpload();
}

function savedWorksheetButton(worksheet) {
  const active = worksheet.id === selectedWorksheetId ? "active" : "";
  return `<button class="saved-worksheet-button ${active}" data-select-worksheet="${worksheet.id}">
    <strong>${escapeHtml(worksheet.title)}</strong>
    <span>${formatTime(worksheet.createdAt)} · ${worksheet.jobIds.length} cards</span>
  </button>`;
}

function analyzeWorksheet(text) {
  const rawLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const lines = rawLines.map((line) => line.replace(/^[-*•☐☑✓]\s*/, "").trim());
  const sections = {
    planned: [],
    inProgress: [],
    waitingParts: [],
    waitingSupport: [],
    completed: [],
    carryover: [],
    priority: [],
    safety: [],
    crewNotes: [],
  };
  let current = "planned";
  const headerPatterns = [
    ["waitingParts", /^(waiting|awaiting)\s+(on\s+)?parts|parts\s+(required|needed|on order)$/i],
    ["waitingSupport", /^(waiting|awaiting)\s+(on\s+)?support|support\s+(required|needed)$/i],
    ["inProgress", /^in[\s-]?progress|^active work|^work underway|^started$/i],
    ["carryover", /^carry[\s-]?over|^next shift|^carried forward|^outstanding from/i],
    ["completed", /^completed|^work completed|^done|^finished$/i],
    ["priority", /^priority|^priority problems?|^critical issues?|^urgent items?/i],
    ["safety", /^safety|^hazards?|^permits?|^isolations?|^loto/i],
    ["crewNotes", /^crew notes?|^handoff notes?|^shift notes?|^operator notes?/i],
    ["planned", /^planned|^plan for today|^today'?s work|^scheduled|^work required|^remaining work|^follow[\s-]?up/i],
  ];

  for (const line of lines) {
    const [headingText, inlineText = ""] = line.split(/:(.+)/).map((part) => part?.trim() || "");
    const heading = headerPatterns.find(([, pattern]) => pattern.test(headingText) && headingText.length < 42);
    if (heading) {
      current = heading[0];
      if (inlineText) sections[current].push(inlineText);
      continue;
    }
    if (/^[A-Z][A-Z\s/&-]{7,}$/.test(line) && !/\d/.test(line)) continue;
    sections[current].push(line);
  }

  const equipment = extractEquipmentCodes(text);
  const cards = buildWorksheetCards(sections);
  const sentenceCount = Object.values(sections).reduce((total, entries) => total + entries.length, 0);
  const openCards = cards.filter((card) => card.status !== "Completed").length;
  const constrainedCards = cards.filter((card) => card.status.startsWith("Waiting") || card.status === "Carryover").length;
  const summary = `This worksheet contains ${sentenceCount} classified notes across ${equipment.length || "no clearly coded"} equipment units. It generated ${cards.length} workflow cards: ${openCards} open and ${cards.length - openCards} completed. ${constrainedCards ? `${constrainedCards} card${constrainedCards === 1 ? " is" : "s are"} constrained or carrying over.` : "No constrained or carryover work was identified."} ${sections.priority.length ? `${sections.priority.length} priority problem${sections.priority.length === 1 ? " requires" : "s require"} supervisor attention.` : "No explicit priority problems were identified."}`;
  const titleLine = rawLines.find((line) => /^[A-Z][A-Z\s/&-]{7,}$/.test(line) && !/\d/.test(line));
  const title = titleLine ? titleLine.replace(/\s+/g, " ").slice(0, 64) : `Daily Worksheet · ${new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(new Date())}`;

  return { source: text, title, ...sections, equipment, cards, summary };
}

function extractEquipmentCodes(text) {
  const equipmentPattern = /\b[A-Z]{1,4}[- ]?\d{2,5}[A-Z]?\b/g;
  const codedMatches = (text.toUpperCase().match(equipmentPattern) || [])
    .map((code) => code.replace(/\s+/g, "-"))
    .filter((code) => !/^(UNIT|EQ)-\d/.test(code));
  const numericMatches = [...text.matchAll(/\b(?:units?|equip(?:ment)?|eq|assets?)\s*#?\s*(\d{2,5}[A-Z]?)\b/gi)]
    .map((match) => match[1].toUpperCase());
  return [...new Set([...codedMatches, ...numericMatches])];
}

function statusFromLine(line, fallbackStatus) {
  if (/\b(waiting|awaiting|on order|backorder).{0,18}\bpart|parts? (needed|required|on order|unavailable)\b/i.test(line)) return "Waiting on Parts";
  if (/\b(waiting|awaiting).{0,18}\b(support|vendor|operations|engineering)|\b(support|vendor|operations|engineering) (needed|required)\b/i.test(line)) return "Waiting on Support";
  if (/\b(carry[\s-]?over|next shift|carried forward)\b/i.test(line)) return "Carryover";
  if (/\b(in[\s-]?progress|underway|started|currently working)\b/i.test(line)) return "In Progress";
  if (/\b(completed|finished|returned to service|work complete|is complete|was complete|done)\b/i.test(line)) return "Completed";
  return fallbackStatus;
}

function priorityFromLine(line, fallback = "Medium") {
  if (/\b(critical|emergency|p1|immediate)\b/i.test(line)) return "Critical";
  if (/\b(high|urgent|p2|before rate|before startup|before 14:00)\b/i.test(line)) return "High";
  if (/\b(low|routine|p4)\b/i.test(line)) return "Low";
  return fallback;
}

function assigneeFromLine(line) {
  const match = line.match(/\b(?:with|assigned to|by)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z0-9]*){0,2})(?:[.,;]|$)/);
  return match?.[1] || "Unassigned";
}

function cleanImportedDescription(line) {
  const cleaned = line
    .replace(/^(critical|high|medium|low|urgent|p[1-4])\s*:\s*/i, "")
    .replace(/^(?:units?|equip(?:ment)?|eq|assets?)\s*#?\s*\d{2,5}[A-Z]?\s*[-:–]?\s*/i, "")
    .replace(/^[A-Z]{1,4}[- ]?\d{2,5}[A-Z]?\s*[-:–]?\s*/i, "")
    .replace(/\s+\b(?:with|assigned to|by)\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z0-9]*){0,2}[.]?$/i, "")
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "Review imported worksheet item";
}

function comparisonTokens(text) {
  const stopWords = new Set(["the", "and", "for", "with", "before", "after", "from", "this", "that", "work", "unit", "must", "needs", "need", "required", "complete", "completed"]);
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !stopWords.has(word) && !/\d/.test(word)));
}

function isMatchingPriorityCard(card, priorityLine) {
  const priorityCodes = extractEquipmentCodes(priorityLine);
  const sameEquipment = priorityCodes.length && priorityCodes.some((code) => card.equipmentCodes.includes(code));
  if (!sameEquipment) return false;
  const cardTokens = comparisonTokens(card.description);
  const priorityTokens = comparisonTokens(priorityLine);
  return [...cardTokens].some((token) => priorityTokens.has(token));
}

function buildWorksheetCards(sections) {
  const statusGroups = [
    ["planned", "Planned"],
    ["inProgress", "In Progress"],
    ["waitingParts", "Waiting on Parts"],
    ["waitingSupport", "Waiting on Support"],
    ["completed", "Completed"],
    ["carryover", "Carryover"],
  ];
  const cards = [];

  for (const [section, fallbackStatus] of statusGroups) {
    for (const line of sections[section]) {
      if (line.length < 5) continue;
      cards.push({
        sourceLine: line,
        sourceSection: section,
        description: cleanImportedDescription(line),
        equipmentCodes: extractEquipmentCodes(line),
        status: statusFromLine(line, fallbackStatus),
        priority: priorityFromLine(line, fallbackStatus === "Carryover" ? "Medium" : "Medium"),
        assignee: assigneeFromLine(line),
      });
    }
  }

  for (const priorityLine of sections.priority) {
    const priorityCodes = extractEquipmentCodes(priorityLine);
    const sameEquipmentCards = cards.filter((card) =>
      card.status !== "Completed" && priorityCodes.some((code) => card.equipmentCodes.includes(code)),
    );
    const match = sameEquipmentCards.find((card) => isMatchingPriorityCard(card, priorityLine))
      || (sameEquipmentCards.length === 1 ? sameEquipmentCards[0] : null);
    if (match) {
      match.priority = priorityFromLine(priorityLine, "High");
      match.priorityNote = priorityLine;
    } else {
      cards.push({
        sourceLine: priorityLine,
        sourceSection: "priority",
        description: cleanImportedDescription(priorityLine),
        equipmentCodes: extractEquipmentCodes(priorityLine),
        status: statusFromLine(priorityLine, "Planned"),
        priority: priorityFromLine(priorityLine, "High"),
        assignee: assigneeFromLine(priorityLine),
      });
    }
  }

  return cards.slice(0, 40);
}

function analysisResults(analysis) {
  const groups = [
    ["Planned work", analysis.planned, "blue"],
    ["Completed work", analysis.completed, "green"],
    ["Carryover work", analysis.carryover, "orange"],
    ["Priority items", analysis.priority, "red"],
    ["Waiting on parts", analysis.waitingParts, "orange"],
    ["Waiting on support", analysis.waitingSupport, "purple"],
    ["Safety notes", analysis.safety, "red"],
    ["Crew notes", analysis.crewNotes || [], "blue"],
  ];
  const importedJobs = analysis.jobIds.map((jobId) => state.jobs.find((job) => job.id === jobId)).filter(Boolean);
  const statusCounts = STATUSES.map((status) => [status, importedJobs.filter((job) => job.status === status).length]).filter(([, count]) => count);
  return `<div class="analysis-results">
    <div class="analysis-summary">
      <div class="analysis-summary-top"><div><span class="saved-indicator">✓ Source & summary saved</span><h3>Supervisor summary</h3></div><span class="analysis-date">${formatTime(analysis.createdAt)}</span></div>
      <p>${escapeHtml(analysis.summary)}</p>
    </div>
    <div class="analysis-group"><h3><span></span>Equipment mentioned</h3><div class="tag-list">${analysis.equipment.length ? analysis.equipment.map((item) => `<span class="tiny-badge">${escapeHtml(item)}</span>`).join("") : `<span class="tiny-badge">No unit codes detected</span>`}</div></div>
    <div class="workflow-placement-summary">
      ${statusCounts.map(([status, count]) => `<div class="placement-stat"><strong>${count}</strong><span>${escapeHtml(status)}</span></div>`).join("")}
    </div>
    <div class="analysis-grid">
      ${groups.map(([title, items, color]) => analysisGroup(title, items, color)).join("")}
    </div>
    <section class="generated-work-section">
      <div class="detail-section-title"><h3>Generated workflow cards</h3><button class="ghost-button" data-go-view="workflow">Open board</button></div>
      <p class="generated-work-helper">Select any card to edit its equipment, priority, crew, procedure, notes, or workflow status.</p>
      <div class="imported-card-list">${importedJobs.length ? importedJobs.map(importedWorkCard).join("") : emptyState("No workflow cards were generated.")}</div>
    </section>
    <details class="saved-source">
      <summary>View saved original worksheet</summary>
      <pre>${escapeHtml(analysis.source)}</pre>
    </details>
  </div>`;
}

function importedWorkCard(job) {
  const equipment = equipmentById(job.equipmentId);
  return `<button class="imported-work-card" data-edit-job="${job.id}">
    <span class="imported-card-status">${statusBadge(job.status)}</span>
    <span class="imported-card-main"><strong>${escapeHtml(job.description)}</strong><span>${escapeHtml(equipment?.unit || "SITE-WIDE")} · ${escapeHtml(job.assignee || "Unassigned")}</span></span>
    ${priorityBadge(job.priority)}
    <span class="row-chevron">›</span>
  </button>`;
}

function analysisGroup(title, items, color) {
  return `<section class="analysis-group"><h3><span style="background: var(--${color})"></span>${title}</h3>${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p style="margin:0;color:var(--muted-2);font-size:10px">None identified</p>`}</section>`;
}

function attachFileUpload() {
  const input = document.querySelector("#worksheet-file");
  const zone = document.querySelector("#upload-zone");
  input.addEventListener("change", () => readWorksheetFile(input.files[0]));
  ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  }));
  ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
  }));
  zone.addEventListener("drop", (event) => readWorksheetFile(event.dataTransfer.files[0]));
}

function readWorksheetFile(file) {
  if (!requirePermission("importWorksheets")) return;
  if (!file) return;
  if (!file.type.startsWith("text/") && !/\.(txt|md)$/i.test(file.name)) {
    showToast("Unsupported file", "Please choose a .txt or .md worksheet.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    document.querySelector("#worksheet-text").value = reader.result;
    showToast("Worksheet loaded", file.name);
  };
  reader.readAsText(file);
}

function ensureImportedEquipment(code) {
  const normalized = code?.toUpperCase();
  const existing = normalized && state.equipment.find((equipment) => equipment.unit.toUpperCase() === normalized);
  if (existing) return existing.id;
  if (!normalized) {
    const general = state.equipment.find((equipment) => equipment.id === "eq-site-wide");
    if (general) return general.id;
    state.equipment.push({
      id: "eq-site-wide",
      unit: "SITE-WIDE",
      type: "General Maintenance",
      area: "Site",
      status: "Available",
      notes: "General work imported without a specific equipment number.",
      procedureIds: [],
    });
    return "eq-site-wide";
  }
  const equipment = {
    id: `eq-import-${Date.now()}-${state.equipment.length}`,
    unit: normalized,
    type: "Imported Equipment",
    area: "Unassigned Area",
    status: "Attention",
    notes: "Automatically added from a saved OneNote worksheet. Update the equipment type and area when confirmed.",
    procedureIds: [],
  };
  state.equipment.push(equipment);
  return equipment.id;
}

function equipmentIdForCard(card) {
  const knownCode = card.equipmentCodes.find((code) => state.equipment.some((equipment) => equipment.unit.toUpperCase() === code));
  return ensureImportedEquipment(knownCode || card.equipmentCodes[0]);
}

async function saveWorksheetAndCreateWorkflow(analysis) {
  if (!requirePermission("importWorksheets")) return null;
  const duplicate = state.worksheetImports.find((item) => item.source.trim() === analysis.source.trim());
  if (duplicate) {
    selectedWorksheetId = duplicate.id;
    renderImport();
    showToast("Worksheet already saved", "Loaded the existing summary without creating duplicate cards.");
    return duplicate;
  }

  const worksheetId = `worksheet-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const jobIds = [];
  analysis.cards.forEach((card, index) => {
    const jobId = `job-import-${Date.now()}-${index}`;
    const safetyNotes = analysis.safety.filter((note) => {
      const codes = extractEquipmentCodes(note);
      return !codes.length || codes.some((code) => card.equipmentCodes.includes(code));
    });
    const notes = [
      "Created automatically from a saved OneNote worksheet.",
      `Original line: ${card.sourceLine}`,
      card.priorityNote ? `Priority note: ${card.priorityNote}` : "",
      safetyNotes.length ? `Safety: ${safetyNotes.join(" ")}` : "",
    ].filter(Boolean).join("\n\n");
    const job = {
      id: jobId,
      equipmentId: equipmentIdForCard(card),
      description: card.description,
      priority: card.priority,
      assignee: card.assignee,
      procedureId: null,
      notes,
      status: card.status,
      createdAt,
      plannedAt: card.status === "Carryover" ? nowOffset(-12) : nowOffset(Math.min(index + 1, 12)),
      completedAt: card.status === "Completed" ? createdAt : null,
      sourceWorksheetId: worksheetId,
    };
    state.jobs.push(job);
    jobIds.push(jobId);
  });
  const savedWorksheet = { ...analysis, id: worksheetId, createdAt, jobIds };
  delete savedWorksheet.cards;
  state.worksheetImports.unshift(savedWorksheet);
  selectedWorksheetId = worksheetId;
  addActivity(`${jobIds.length} workflow cards created from worksheet`, savedWorksheet.title, "create");
  if (!(await saveState())) return null;
  renderAll();
  switchView("import");
  showToast("Worksheet analyzed & saved", `${jobIds.length} cards placed across the workflow board.`);
  return savedWorksheet;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function switchView(view) {
  if (view === "import" && !can("importWorksheets")) {
    view = "dashboard";
    showToast("Read-only access", "Worksheet import is available to Supervisors only.");
  }
  currentView = view;
  document.querySelectorAll(".app-view").forEach((section) => section.classList.toggle("active", section.id === `${view}-view`));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelector("#view-title").textContent = viewMeta[view][0];
  document.querySelector("#view-eyebrow").textContent = viewMeta[view][1];
  document.querySelector(".sidebar").classList.remove("open");
  document.querySelector("#mobile-overlay").classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateJobForm() {
  const equipmentSelect = document.querySelector("#job-equipment");
  equipmentSelect.innerHTML = state.equipment.map((equipment) => `<option value="${equipment.id}">${escapeHtml(equipment.unit)} · ${escapeHtml(equipment.type)}</option>`).join("");
  document.querySelector("#job-procedure").innerHTML = `<option value="">No procedure linked</option>${state.procedures.map((procedure) => `<option value="${procedure.id}">${escapeHtml(procedure.code)} · ${escapeHtml(procedure.title)}</option>`).join("")}`;
  document.querySelector("#job-status").innerHTML = STATUSES.map((status) => `<option>${status}</option>`).join("");
}

function openJobModal(jobId = null, defaults = {}) {
  const readOnly = !can("manageJobs");
  if (!jobId && readOnly) {
    requirePermission("manageJobs");
    return;
  }
  populateJobForm();
  const job = state.jobs.find((item) => item.id === jobId);
  document.querySelector("#modal-title").textContent = readOnly ? "Work order details" : job ? "Edit work order" : "Add new work";
  document.querySelector("#job-id").value = job?.id || "";
  document.querySelector("#job-description").value = job?.description || "";
  document.querySelector("#job-equipment").value = job?.equipmentId || defaults.equipmentId || state.equipment[0]?.id || "";
  document.querySelector("#job-priority").value = job?.priority || "Medium";
  document.querySelector("#job-assignee").value = job?.assignee || "";
  document.querySelector("#job-status").value = job?.status || "Planned";
  document.querySelector("#job-procedure").value = job?.procedureId || defaults.procedureId || "";
  document.querySelector("#job-notes").value = job?.notes || "";
  const date = job?.plannedAt ? new Date(job.plannedAt) : new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  document.querySelector("#job-planned-time").value = date.toISOString().slice(0, 16);
  document.querySelectorAll("#job-form input, #job-form select, #job-form textarea").forEach((field) => {
    field.disabled = readOnly;
  });
  document.querySelector("#job-save-button").hidden = readOnly;
  document.querySelector("#job-form .close-modal").textContent = readOnly ? "Close" : "Cancel";
  document.querySelector("#modal-backdrop").classList.add("open");
  document.querySelector("#modal-backdrop").setAttribute("aria-hidden", "false");
  setTimeout(() => document.querySelector("#job-description").focus(), 50);
}

function closeJobModal() {
  document.querySelector("#modal-backdrop").classList.remove("open");
  document.querySelector("#modal-backdrop").setAttribute("aria-hidden", "true");
}

async function saveJob(event) {
  event.preventDefault();
  if (!requirePermission("manageJobs")) return;
  const id = document.querySelector("#job-id").value;
  const existing = state.jobs.find((job) => job.id === id);
  const newStatus = document.querySelector("#job-status").value;
  const payload = {
    equipmentId: document.querySelector("#job-equipment").value,
    description: document.querySelector("#job-description").value.trim(),
    priority: document.querySelector("#job-priority").value,
    assignee: document.querySelector("#job-assignee").value.trim() || "Unassigned",
    status: newStatus,
    procedureId: document.querySelector("#job-procedure").value || null,
    plannedAt: new Date(document.querySelector("#job-planned-time").value).toISOString(),
    notes: document.querySelector("#job-notes").value.trim(),
  };
  if (existing) {
    const oldStatus = existing.status;
    Object.assign(existing, payload);
    existing.completedAt = newStatus === "Completed" ? existing.completedAt || new Date().toISOString() : null;
    addActivity(`${equipmentById(existing.equipmentId)?.unit || "Work order"} updated`, oldStatus === newStatus ? existing.description : `${oldStatus} → ${newStatus}`, newStatus === "Completed" ? "complete" : "move");
  } else {
    const job = {
      id: `job-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      completedAt: newStatus === "Completed" ? new Date().toISOString() : null,
    };
    state.jobs.push(job);
    addActivity(`New work created for ${equipmentById(job.equipmentId)?.unit || "equipment"}`, job.description, "create");
  }
  if (!(await saveState())) return;
  renderAll();
  closeJobModal();
  showToast(existing ? "Work order updated" : "Work order created", payload.description);
}

async function deleteJob(jobId) {
  if (!requirePermission("manageJobs")) return;
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  if (!window.confirm("Are you sure you want to delete this job?")) return;

  state.jobs = state.jobs.filter((item) => item.id !== jobId);
  state.worksheetImports = state.worksheetImports.map((worksheet) => ({
    ...worksheet,
    jobIds: (worksheet.jobIds || []).filter((id) => id !== jobId),
  }));
  addActivity(`Deleted job for ${equipmentById(job.equipmentId)?.unit || "equipment"}`, job.description, "move");

  const saved = await saveState();
  updateSelections();
  renderAll();
  if (saved) clearStorageError();
  showToast("Job deleted", job.description);
}

function openEquipmentModal(equipmentId = null) {
  if (!requirePermission("manageEquipment")) return;
  document.querySelector("#equipment-form").reset();
  const equipment = equipmentById(equipmentId);
  document.querySelector("#equipment-id").value = equipment?.id || "";
  document.querySelector("#equipment-modal-title").textContent = equipment ? "Edit equipment" : "Add equipment";
  document.querySelector("#equipment-save-button").textContent = equipment ? "Save changes" : "Add equipment";
  document.querySelector("#equipment-unit").value = equipment?.unit || "";
  document.querySelector("#equipment-type").value = equipment?.type || "";
  document.querySelector("#equipment-area").value = equipment?.area || "";
  document.querySelector("#equipment-status").value = equipment?.status || "Running";
  document.querySelector("#equipment-notes").value = equipment?.notes || "";
  document.querySelector("#equipment-modal-backdrop").classList.add("open");
  document.querySelector("#equipment-modal-backdrop").setAttribute("aria-hidden", "false");
  setTimeout(() => document.querySelector("#equipment-unit").focus(), 50);
}

function closeEquipmentModal() {
  document.querySelector("#equipment-modal-backdrop").classList.remove("open");
  document.querySelector("#equipment-modal-backdrop").setAttribute("aria-hidden", "true");
}

async function saveEquipment(event) {
  event.preventDefault();
  if (!requirePermission("manageEquipment")) return;
  const existing = equipmentById(document.querySelector("#equipment-id").value);
  const equipment = {
    id: existing?.id || `eq-${Date.now()}`,
    unit: document.querySelector("#equipment-unit").value.trim().toUpperCase(),
    type: document.querySelector("#equipment-type").value.trim(),
    area: document.querySelector("#equipment-area").value.trim(),
    status: document.querySelector("#equipment-status").value,
    notes: document.querySelector("#equipment-notes").value.trim() || "No equipment notes recorded.",
    procedureIds: existing?.procedureIds || [],
  };
  if (existing) Object.assign(existing, equipment);
  else state.equipment.push(equipment);
  selectedEquipmentId = equipment.id;
  if (!(await saveState())) return;
  renderAll();
  closeEquipmentModal();
  showToast(existing ? "Equipment updated" : "Equipment added", `${equipment.unit} · ${equipment.type}`);
}

async function deleteEquipment(equipmentId) {
  if (!requirePermission("manageEquipment")) return;
  const equipment = equipmentById(equipmentId);
  if (!equipment || !window.confirm(`Delete ${equipment.unit}? Linked jobs will be reassigned to SITE-WIDE.`)) return;
  const fallbackId = ensureImportedEquipment(null);
  state.jobs.forEach((job) => {
    if (job.equipmentId === equipmentId) job.equipmentId = fallbackId;
  });
  state.procedures.forEach((procedure) => {
    procedure.equipmentIds = procedure.equipmentIds.filter((id) => id !== equipmentId);
  });
  state.equipment = state.equipment.filter((item) => item.id !== equipmentId);
  selectedEquipmentId = state.equipment[0]?.id || null;
  if (!(await saveState())) return;
  renderAll();
  showToast("Equipment deleted", `${equipment.unit} was removed; linked jobs were preserved.`);
}

function openProcedureModal(procedureId = null) {
  if (!requirePermission("manageProcedures")) return;
  document.querySelector("#procedure-form").reset();
  const procedure = procedureById(procedureId);
  document.querySelector("#procedure-id").value = procedure?.id || "";
  document.querySelector("#procedure-modal-title").textContent = procedure ? "Edit procedure" : "Add procedure";
  document.querySelector("#procedure-save-button").textContent = procedure ? "Save changes" : "Save procedure";
  document.querySelector("#procedure-code").value = procedure?.code || "";
  document.querySelector("#procedure-title").value = procedure?.title || "";
  document.querySelector("#procedure-time").value = procedure?.estimatedTime || "";
  document.querySelector("#procedure-tools").value = procedure?.tools.join("\n") || "";
  document.querySelector("#procedure-safety").value = procedure?.safety || "";
  document.querySelector("#procedure-steps").value = procedure?.steps.join("\n") || "";
  document.querySelector("#procedure-equipment").innerHTML = state.equipment.map((equipment) =>
    `<option value="${equipment.id}" ${procedure?.equipmentIds.includes(equipment.id) ? "selected" : ""}>${escapeHtml(equipment.unit)} · ${escapeHtml(equipment.type)}</option>`,
  ).join("");
  document.querySelector("#procedure-modal-backdrop").classList.add("open");
  document.querySelector("#procedure-modal-backdrop").setAttribute("aria-hidden", "false");
  setTimeout(() => document.querySelector("#procedure-code").focus(), 50);
}

function closeProcedureModal() {
  document.querySelector("#procedure-modal-backdrop").classList.remove("open");
  document.querySelector("#procedure-modal-backdrop").setAttribute("aria-hidden", "true");
}

async function saveProcedure(event) {
  event.preventDefault();
  if (!requirePermission("manageProcedures")) return;
  const existing = procedureById(document.querySelector("#procedure-id").value);
  const equipmentIds = [...document.querySelector("#procedure-equipment").selectedOptions].map((option) => option.value);
  const procedure = {
    id: existing?.id || `proc-${Date.now()}`,
    code: document.querySelector("#procedure-code").value.trim().toUpperCase(),
    title: document.querySelector("#procedure-title").value.trim(),
    estimatedTime: document.querySelector("#procedure-time").value.trim(),
    tools: document.querySelector("#procedure-tools").value.split("\n").map((item) => item.trim()).filter(Boolean),
    safety: document.querySelector("#procedure-safety").value.trim(),
    steps: document.querySelector("#procedure-steps").value.split("\n").map((item) => item.trim()).filter(Boolean),
    equipmentIds,
  };
  if (existing) Object.assign(existing, procedure);
  else state.procedures.push(procedure);
  state.equipment.forEach((equipment) => {
    equipment.procedureIds = (equipment.procedureIds || []).filter((id) => id !== procedure.id);
    if (equipmentIds.includes(equipment.id)) equipment.procedureIds.push(procedure.id);
  });
  selectedProcedureId = procedure.id;
  if (!(await saveState())) return;
  renderAll();
  closeProcedureModal();
  showToast(existing ? "Procedure updated" : "Procedure added", `${procedure.code} · ${procedure.title}`);
}

async function deleteProcedure(procedureId) {
  if (!requirePermission("manageProcedures")) return;
  const procedure = procedureById(procedureId);
  if (!procedure || !window.confirm(`Delete ${procedure.code} · ${procedure.title}?`)) return;
  state.jobs.forEach((job) => {
    if (job.procedureId === procedureId) job.procedureId = null;
  });
  state.equipment.forEach((equipment) => {
    equipment.procedureIds = (equipment.procedureIds || []).filter((id) => id !== procedureId);
  });
  state.procedures = state.procedures.filter((item) => item.id !== procedureId);
  selectedProcedureId = state.procedures[0]?.id || null;
  if (!(await saveState())) return;
  renderAll();
  showToast("Procedure deleted", `${procedure.code} was removed; linked work was preserved.`);
}

function applyBoardFilters() {
  const search = document.querySelector("#board-search")?.value.toLowerCase() || "";
  const priority = document.querySelector("#board-priority-filter")?.value || "";
  document.querySelectorAll(".job-card").forEach((card) => {
    card.hidden = !(card.dataset.search.includes(search) && (!priority || card.dataset.priority === priority));
  });
}

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-theme-toggle]")) {
    toggleTheme();
    return;
  }

  const navItem = event.target.closest(".nav-item");
  if (navItem) switchView(navItem.dataset.view);

  const goView = event.target.closest("[data-go-view]");
  if (goView) switchView(goView.dataset.goView);

  const deleteJobButton = event.target.closest("[data-delete-job]");
  if (deleteJobButton) {
    event.stopPropagation();
    await deleteJob(deleteJobButton.dataset.deleteJob);
    return;
  }

  const editJob = event.target.closest("[data-edit-job]");
  if (editJob && !event.target.closest("[draggable='true']")?.classList.contains("dragging")) openJobModal(editJob.dataset.editJob);

  if (event.target.closest("[data-new-job]") || event.target.closest("#quick-add-button")) openJobModal();
  const equipmentJob = event.target.closest("[data-new-job-equipment]");
  if (equipmentJob) openJobModal(null, { equipmentId: equipmentJob.dataset.newJobEquipment });
  const procedureJob = event.target.closest("[data-new-job-procedure]");
  if (procedureJob) openJobModal(null, { procedureId: procedureJob.dataset.newJobProcedure });

  const equipmentItem = event.target.closest("[data-equipment-id]");
  if (equipmentItem) {
    selectedEquipmentId = equipmentItem.dataset.equipmentId;
    renderEquipment(document.querySelector("#equipment-search")?.value || "");
  }

  const procedureItem = event.target.closest("[data-procedure-id]");
  if (procedureItem) {
    selectedProcedureId = procedureItem.dataset.procedureId;
    renderProcedures(document.querySelector("#procedure-search")?.value || "");
  }

  const openEquipment = event.target.closest("[data-open-equipment]");
  if (openEquipment) {
    selectedEquipmentId = openEquipment.dataset.openEquipment;
    renderEquipment();
    switchView("equipment");
  }

  const openProcedure = event.target.closest("[data-open-procedure]");
  if (openProcedure) {
    selectedProcedureId = openProcedure.dataset.openProcedure;
    renderProcedures();
    switchView("procedures");
  }

  if (event.target.closest(".close-modal")) closeJobModal();
  if (event.target.closest(".close-equipment-modal")) closeEquipmentModal();
  if (event.target.closest(".close-procedure-modal")) closeProcedureModal();
  if (event.target.closest("#add-equipment-button")) openEquipmentModal();
  if (event.target.closest("#add-procedure-button")) openProcedureModal();

  const editEquipment = event.target.closest("[data-edit-equipment]");
  if (editEquipment) openEquipmentModal(editEquipment.dataset.editEquipment);
  const deleteEquipmentButton = event.target.closest("[data-delete-equipment]");
  if (deleteEquipmentButton) await deleteEquipment(deleteEquipmentButton.dataset.deleteEquipment);

  const editProcedure = event.target.closest("[data-edit-procedure]");
  if (editProcedure) openProcedureModal(editProcedure.dataset.editProcedure);
  const deleteProcedureButton = event.target.closest("[data-delete-procedure]");
  if (deleteProcedureButton) await deleteProcedure(deleteProcedureButton.dataset.deleteProcedure);

  if (event.target.id === "modal-backdrop") closeJobModal();
  if (event.target.id === "equipment-modal-backdrop") closeEquipmentModal();
  if (event.target.id === "procedure-modal-backdrop") closeProcedureModal();

  if (event.target.closest("#analyze-worksheet")) {
    if (!requirePermission("importWorksheets")) return;
    const text = document.querySelector("#worksheet-text").value.trim();
    if (!text) {
      showToast("Worksheet is empty", "Paste or upload some shift notes first.");
    } else {
      const analysis = analyzeWorksheet(text);
      await saveWorksheetAndCreateWorkflow(analysis);
    }
  }

  const savedWorksheet = event.target.closest("[data-select-worksheet]");
  if (savedWorksheet) {
    selectedWorksheetId = savedWorksheet.dataset.selectWorksheet;
    renderImport();
  }

  if (event.target.closest("#new-worksheet-button")) {
    if (!requirePermission("importWorksheets")) return;
    selectedWorksheetId = null;
    renderImport();
    setTimeout(() => document.querySelector("#worksheet-text")?.focus(), 50);
  }

  if (event.target.closest("#menu-button")) {
    document.querySelector(".sidebar").classList.add("open");
    document.querySelector("#mobile-overlay").classList.add("show");
  }
  if (event.target.id === "mobile-overlay") {
    document.querySelector(".sidebar").classList.remove("open");
    document.querySelector("#mobile-overlay").classList.remove("show");
  }

  if (event.target.closest("#reset-data-button")) {
    if (!requirePermission("resetData")) return;
    state = createSampleData();
    selectedEquipmentId = state.equipment[0].id;
    selectedProcedureId = state.procedures[0].id;
    selectedWorksheetId = null;
    if (!(await saveState())) return;
    renderAll();
    switchView("dashboard");
    showToast("Sample data restored", "Firestore now contains the clean sample dataset.");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "equipment-search") renderEquipment(event.target.value);
  if (event.target.id === "procedure-search") renderProcedures(event.target.value);
  if (event.target.id === "board-search") applyBoardFilters();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "board-priority-filter") applyBoardFilters();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeJobModal();
    closeEquipmentModal();
    closeProcedureModal();
  }
});

document.querySelector("#job-form").addEventListener("submit", saveJob);
document.querySelector("#equipment-form").addEventListener("submit", saveEquipment);
document.querySelector("#procedure-form").addEventListener("submit", saveProcedure);
document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.querySelector("#login-username").value;
  const password = document.querySelector("#login-password").value;
  document.querySelector("#login-error").textContent = "";
  showLoading("Signing in", "Opening the local app session…");
  try {
    currentUser = signInWithLocalAccount(username, password);
    document.querySelector("#login-password").value = "";
    applyAuthState();
    await loadCloudState();
    showToast("Signed in", `${currentUser.name} · ${currentUser.role === "supervisor" ? "Full control" : "Read-only access"}`);
  } catch (error) {
    hideLoading();
    document.querySelector("#login-error").textContent = error?.code === "local/invalid-login"
      ? "Incorrect username or password."
      : friendlyFirebaseError(error);
    if (error?.code === "local/invalid-login") {
      currentUser = null;
      clearLocalSession();
      applyAuthState();
    }
  }
});

document.querySelector("#logout-button").addEventListener("click", () => {
  showLoading("Signing out", "Closing the local app session…");
  currentUser = null;
  currentView = "dashboard";
  clearLocalSession();
  closeJobModal();
  closeEquipmentModal();
  closeProcedureModal();
  document.querySelector("#login-form").reset();
  applyAuthState();
  hideLoading();
  setTimeout(() => document.querySelector("#login-username").focus(), 50);
});

document.querySelector("#firebase-setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const config = JSON.parse(document.querySelector("#firebase-config-input").value);
    saveFirebaseConfig(config);
    window.location.reload();
  } catch (error) {
    document.querySelector("#firebase-setup-error").textContent = error instanceof SyntaxError
      ? "The configuration must be valid JSON."
      : error.message;
  }
});

document.querySelector("#firebase-settings-button").addEventListener("click", () => {
  const config = getStoredFirebaseConfig();
  document.querySelector("#firebase-config-input").value = isFirebaseConfigured(config)
    ? JSON.stringify(config, null, 2)
    : "";
  showFirebaseSetup();
});

document.querySelector("#clear-firebase-config-button").addEventListener("click", () => {
  clearFirebaseConfig();
  window.location.reload();
});

document.querySelector("#retry-firebase-button").addEventListener("click", async () => {
  if (!firebaseReady || !currentUser) {
    window.location.reload();
    return;
  }
  await loadCloudState();
});

async function loadCloudState() {
  if (!currentUser) {
    hideLoading();
    return;
  }
  if (!firebaseReady) {
    state = normalizeState(loadLegacyState());
    updateSelections();
    renderAll();
    switchView("dashboard");
    applyAuthState();
    setCloudStatus("error", "Local");
    showStorageError(new Error("Firestore is not connected."), "Firestore is not connected. Showing the local browser copy.");
    hideLoading();
    return;
  }

  showLoading("Loading maintenance data", "Reading equipment, procedures, workflow, and worksheets from Firestore…");
  setCloudStatus("saving", "Loading");
  try {
    const cloudState = await firebaseService.loadAppState();
    if (!cloudState) {
      if (currentUser.role !== "supervisor") {
        throw new Error("Firestore is empty. Sign in as Supervisor once to initialize the maintenance data.");
      }
      state = normalizeState(loadLegacyState());
      await firebaseService.saveAppState(state, "supervisor");
      showToast("Firestore initialized", "Existing browser data was migrated to the cloud.");
    } else {
      state = normalizeState(cloudState);
    }
    updateSelections();
    renderAll();
    switchView("dashboard");
    applyAuthState();
    setCloudStatus("connected", "Cloud");
    clearStorageError();
    hideLoading();
  } catch (error) {
    setCloudStatus("error", "Error");
    state = normalizeState(loadLegacyState());
    updateSelections();
    renderAll();
    switchView("dashboard");
    applyAuthState();
    hideLoading();
    showStorageError(error, "Data could not be loaded from Firestore.");
  }
}

async function bootstrapFirebase() {
  applyTheme();
  renderAppVersionLabel();
  injectIcons();
  updateClock();
  setInterval(updateClock, 30000);
  applyAuthState();

  const config = getStoredFirebaseConfig();
  if (!isFirebaseConfigured(config)) {
    firebaseReady = false;
    hideFirebaseSetup();
    setCloudStatus("error", "Local");
    if (currentUser) {
      await loadCloudState();
    } else {
      hideLoading();
    }
    return;
  }

  showLoading("Connecting to Firestore", "Starting cloud data storage…");
  try {
    await firebaseService.initialize(config);
    firebaseReady = true;
    hideFirebaseSetup();
    setCloudStatus("connected", "Cloud");
    if (currentUser) {
      await loadCloudState();
    } else {
      hideLoading();
    }
  } catch (error) {
    firebaseReady = false;
    hideLoading();
    hideFirebaseSetup();
    setCloudStatus("error", "Local");
    console.error("Firestore could not connect.", error);
    if (currentUser) {
      await loadCloudState();
    }
  }
}

bootstrapFirebase();
