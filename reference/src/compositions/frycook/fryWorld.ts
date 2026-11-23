// The fry station as one three.js scene in the mromidev engine: two-tone
// lam() materials, painted canvas textures (paint.ts), the template's
// ink pass + DOF + grade (wired in FryCook.tsx), one billboard worker
// (fryCast.ts) posed per frame. All geometry is procedural — no Kenney
// GLBs, no downloaded models. Colours/layout follow trial #1
// (HowItFeelsTrial.tsx), rescaled to the template's 1.67 m adult.
// beamBetween is adapted from mromidev templates/bridge/world.ts (MIT).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { ctex, beam } from "../bridge/paint";
import { Pen, fxPuff } from "../bridge/toon";
import { LIGHTS, LOOK } from "../bridge/lights";
import { TONE, CHAR, twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import {
  APRON_HOOK, APRON_HUNG, APRON_OFF, COUNTER, FPS, FRYER, IMPACT, POTATO, PRINTER, SALT_TRAY,
  TIMER, VAT1, VAT2_X, apronAt, basketBottomY, basketPose, basketProgress,
  camAt, focusAt, fryIntensity, ramp, saltAt, steamIntensity, wipeAt, V3,
} from "./fryStory";
import { fryStage } from "./fryCast";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const q = (v: number, n = 24) => Math.round(v * n) / n;
/** deterministic pseudo-random in [0,1) */
const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** box beam between two points (world.ts helper) */
const beamBetween = (a: THREE.Vector3, b: THREE.Vector3, th: number) => {
  const g = new THREE.BoxGeometry(th, a.distanceTo(b), th);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};

/** kitchen checker tile (4x4 checks per metre, warm cream) */
const tileTex = () => ctex("fryTile", 512, 512, (g, r) => {
  const n = 4, s = 512 / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    g.fillStyle = (i + j) % 2 ? "#d3b98a" : "#e3cda3";
    g.fillRect(i * s, j * s, s, s);
  }
  g.strokeStyle = "#c9b183"; g.lineWidth = 5;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke();
  }
  for (let k = 0; k < 260; k++) {
    g.fillStyle = `rgba(120,100,70,${0.05 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3);
  }
});
/** menu board: dark board, three generic coloured rows, no text, no brand */
const menuTex = () => ctex("fryMenu", 512, 300, (g) => {
  g.fillStyle = "#3a3f45"; g.fillRect(0, 0, 512, 300);
  g.fillStyle = "#2b2e33"; g.fillRect(0, 0, 512, 44);
  g.fillStyle = "#f2b63c"; g.fillRect(24, 18, 120, 10);
  const rows: [number, string][] = [[76, "#f2b63c"], [148, "#7fb069"], [220, "#e07856"]];
  for (const [y, c] of rows) {
    g.fillStyle = c; g.fillRect(24, y, 190, 16);
    g.fillStyle = "#e8e2d2";
    for (let i = 0; i < 3; i++) g.fillRect(280 + i * 62, y - 2, 44, 20);
  }
});

const SUN_DIR = new THREE.Vector3(0.45, 0.75, 0.55).normalize();

const drawWipingHand = (pen: Pen) => {
  pen.ol = 4;
  pen.line([[77, 19], [79, 45], [89, 70]], "#2f655a", 22);
  pen.ell(95, 76, 17, 12, "#e8b98a", 4, 0, 360, 10);
};

/** Frame-driven props added after the approved opening. */
const buildRush = (parent: THREE.Group, steel: THREE.Material, basket: THREE.Group) => {
  const root = new THREE.Group();
  root.visible = false;
  parent.add(root);

  const dark = lam("fry_rushDark", () => ({ color: "#414750" }));
  const silver = lam("fry_rushSteel", () => ({ color: "#9da4ac" }));
  const wood = lam("fry_rushShelf", () => ({ color: "#765035" }));
  const teal = lam("fry_rushTeal", () => ({ color: "#2f7d6e" }));
  const cream = lam("fry_rushCream", () => ({ color: "#f2e2bc" }));
  const yellow = lam("fry_rushGold", () => ({ color: "#f2b63c" }));
  const toast = lam("fry_rushToast", () => ({ color: "#c17a26" }));
  const mesh = (holder: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    holder.add(m);
    return m;
  };
  const box = (holder: THREE.Group, material: THREE.Material, size: V3, pos: V3) =>
    mesh(holder, new THREE.BoxGeometry(...size), material, ...pos);
  const group = (pos: V3) => {
    const value = new THREE.Group();
    value.position.set(...pos);
    root.add(value);
    return value;
  };

  // Retain the exterior and rim, with an open well over each oil plane.
  const wells = new Batch();
  for (const [x0, x1] of [[FRYER.x0, -1.70], [-1.15, -1.05], [-0.50, FRYER.x1]]) {
    wells.add(boxGeo(V(x0, FRYER.y0, FRYER.z0), V(x1, FRYER.y1, FRYER.z1)), steel);
  }
  for (const [z0, z1] of [[FRYER.z0, -1.60], [-0.80, FRYER.z1]]) {
    wells.add(boxGeo(V(-1.70, FRYER.y0, z0), V(-0.50, FRYER.y1, z1)), steel);
  }
  wells.build(root);

  // Wall brackets support the lamp from above and leave the cook's work area open.
  for (const x of [-1.79, -1.01]) {
    box(root, dark, [0.05, 0.20, 0.08], [x, 2.21, -2.55]);
    mesh(root, beamBetween(V(x, 2.25, -2.55), V(x, 2.23, -1.64), 0.045), dark);
  }

  const active = basket.clone();
  for (const child of [...active.children]) {
    if (child.name === "solid basket side" || child.name === "opening fries") active.remove(child);
  }
  for (const x of [-0.235, 0.235]) {
    for (const y of [0.080, 0.16, 0.24]) box(active, dark, [0.023, 0.020, 0.65], [x, y, 0]);
    for (const z of [-0.31, -0.16, 0, 0.16, 0.31]) box(active, silver, [0.019, 0.23, 0.016], [x, 0.136, z]);
  }
  for (const z of [-0.31, 0.31]) {
    for (const x of [-0.16, 0, 0.16]) box(active, silver, [0.016, 0.23, 0.019], [x, 0.136, z]);
  }
  const basketFries = mulberry32(44);
  for (let i = 0; i < 28; i++) {
    const fry = box(active, i % 4 ? yellow : toast, [0.033, 0.17 + 0.13 * basketFries(), 0.033],
      [(basketFries() - 0.5) * 0.31, 0.14 + 0.065 * basketFries(), (basketFries() - 0.5) * 0.47]);
    fry.rotation.set(-0.65 + 1.3 * basketFries(), 6.28 * basketFries(), -0.8 + 1.6 * basketFries());
  }
  root.add(active);
  const second = active.clone();
  second.scale.set(0.94, 0.90, 0.93);
  root.add(second);

  const printer = group(PRINTER);
  box(printer, wood, [0.72, 0.07, 0.43], [0, -0.28, -0.02]);
  box(printer, dark, [0.53, 0.24, 0.34], [0, -0.06, 0]);
  box(printer, silver, [0.53, 0.047, 0.34], [0, 0.077, 0]);
  box(printer, dark, [0.34, 0.046, 0.015], [0, 0.025, 0.181]);
  box(printer, teal, [0.042, 0.028, 0.022], [0.198, 0.025, 0.18]);
  const ticketMap = ctex("fry_rushTicket", 192, 256, (g) => {
    g.fillStyle = "#f5e7c4";
    g.fillRect(0, 0, 192, 256);
    for (let i = 0; i < 3; i++) {
      const y = 17 + i * 79;
      g.fillStyle = "#6b5444";
      g.fillRect(24, y, 94 + 10 * (i % 2), 8);
      g.fillRect(139, y, 25, 8);
      g.fillStyle = "#a4977d";
      g.fillRect(24, y + 17, 76, 6);
      g.fillRect(24, y + 29, 106 - 13 * i, 6);
      for (let x = 18; x < 175; x += 12) g.fillRect(x, y + 51, 6, 3);
    }
  });
  const paper = new THREE.MeshBasicMaterial({ map: ticketMap, side: THREE.DoubleSide });
  const ticketGeometry = new THREE.PlaneGeometry(0.29, 0.36, 1, 14);
  const liveTicket = mesh(printer, ticketGeometry, paper);
  const pins = [-0.42, 0.45].map((x, i) => {
    const pin = mesh(printer, new THREE.PlaneGeometry(0.27, 0.34), paper, x, -0.18 + i * 0.07, -0.14);
    pin.rotation.z = i ? -0.17 : 0.14;
    return pin;
  });

  const timer = group(TIMER);
  box(timer, dark, [0.27, 0.20, 0.15], [0, 0, 0]);
  box(timer, silver, [0.24, 0.142, 0.025], [0, 0, 0.084]);
  const timerMat = new THREE.MeshBasicMaterial({ color: "#7e4036" });
  for (const x of [-0.055, 0, 0.055]) mesh(timer, new THREE.SphereGeometry(0.020, 10, 8), timerMat, x, 0.006, 0.104);

  const tray = group(SALT_TRAY);
  box(tray, silver, [0.39, 0.035, 0.44], [0, -0.088, 0]);
  const prepFries = mulberry32(80);
  for (let i = 0; i < 18; i++) {
    const fry = box(tray, i % 4 ? yellow : toast, [0.043, 0.042, 0.16 + 0.10 * prepFries()],
      [(prepFries() - 0.5) * 0.29, -0.055 + 0.036 * prepFries(), (prepFries() - 0.5) * 0.23]);
    fry.rotation.set(0.30 * prepFries(), prepFries() * 6.28, 0.25 * prepFries());
  }

  const shaker = group([0, 0, 0]);
  mesh(shaker, new THREE.CylinderGeometry(0.068, 0.065, 0.17, 20), cream);
  mesh(shaker, new THREE.CylinderGeometry(0.071, 0.071, 0.052, 20), silver, 0, 0.09);
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 6;
    const radius = i === 6 ? 0 : 0.038;
    mesh(shaker, new THREE.SphereGeometry(0.007, 6, 5), dark, Math.cos(angle) * radius, 0.116, Math.sin(angle) * radius);
  }

  const cloth = group([0, 0, 0]);
  const towel = box(cloth, teal, [0.24, 0.032, 0.16], [0, 0.007, 0]);
  towel.rotation.y = -0.22;
  box(cloth, cream, [0.022, 0.003, 0.12], [0.061, 0.026, 0]);

  const hook = group(APRON_HOOK);
  box(hook, wood, [0.19, 0.22, 0.047], [0, 0.02, -0.023]);
  mesh(hook, new THREE.SphereGeometry(0.039, 12, 8), silver, 0, 0, 0.062);
  const apron = group(APRON_HOOK);
  const apronFabric = ctex("fry_rushApron", 256, 352, (g) => {
    const fabric = g.createLinearGradient(26, 0, 224, 334);
    fabric.addColorStop(0, "#54a08a");
    fabric.addColorStop(0.52, "#2f7d6e");
    fabric.addColorStop(1, "#225748");
    g.lineJoin = "round";
    g.lineWidth = 10;
    g.strokeStyle = "#223b36";
    g.beginPath();
    g.moveTo(96, 98);
    g.bezierCurveTo(86, -14, 168, -14, 162, 98);
    g.stroke();
    g.strokeStyle = "#419480";
    g.lineWidth = 6;
    g.stroke();
    g.beginPath();
    g.moveTo(91, 72);
    g.quadraticCurveTo(128, 81, 165, 72);
    g.quadraticCurveTo(169, 140, 213, 175);
    g.lineTo(233, 319);
    g.quadraticCurveTo(130, 344, 23, 319);
    g.lineTo(41, 175);
    g.quadraticCurveTo(87, 139, 91, 72);
    g.closePath();
    g.fillStyle = fabric;
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#203c38";
    g.stroke();
    g.fillStyle = "#245f51";
    g.fillRect(87, 219, 81, 57);
    g.strokeStyle = "#82bbaa";
    g.lineWidth = 3;
    g.strokeRect(91, 224, 73, 46);
  });
  const apronPanel = mesh(apron, new THREE.PlaneGeometry(0.57, 0.79),
    new THREE.MeshBasicMaterial({ map: apronFabric, alphaTest: 0.5, side: THREE.DoubleSide }), 0, -0.36, 0);
  apronPanel.rotation.y = -0.10;

  const macro = group(POTATO);
  const backdropMap = ctex("fry_rushCutaway", 512, 512, (g) => {
    const gradient = g.createRadialGradient(250, 210, 20, 258, 252, 315);
    gradient.addColorStop(0, "#b77039");
    gradient.addColorStop(0.58, "#6c4538");
    gradient.addColorStop(1, "#363035");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 512, 512);
  });
  mesh(macro, new THREE.PlaneGeometry(4.2, 4.9),
    new THREE.MeshBasicMaterial({ map: backdropMap }), 0, 0, -0.62);
  const slice = new THREE.Group();
  slice.rotation.z = 0.42;
  slice.scale.setScalar(0.88);
  macro.add(slice);
  // The golden sleeve is extruded. A separate pale face shrinks inward as moisture leaves.
  const outline = new THREE.Shape();
  outline.moveTo(-0.29, -0.42);
  outline.bezierCurveTo(-0.39, -0.24, -0.32, 0.20, -0.25, 0.43);
  outline.bezierCurveTo(-0.17, 0.65, 0.11, 0.64, 0.24, 0.45);
  outline.bezierCurveTo(0.39, 0.22, 0.33, -0.31, 0.21, -0.48);
  outline.bezierCurveTo(0.08, -0.62, -0.21, -0.59, -0.29, -0.42);
  outline.closePath();
  const shellMaterial = new THREE.MeshLambertMaterial({ color: "#dba568" });
  mesh(slice, new THREE.ExtrudeGeometry(outline, { depth: 0.24, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 4 }),
    shellMaterial, 0, 0, -0.18);
  const flesh = mesh(slice, new THREE.ShapeGeometry(outline), cream, 0, 0, 0.145);
  const kernelSeeds = mulberry32(204);
  const kernels = Array.from({ length: 19 }, (_, i) => {
    const y = -0.39 + 0.78 * kernelSeeds();
    const x = (kernelSeeds() - 0.5) * 0.38;
    const m = mesh(slice, new THREE.SphereGeometry(0.015 + kernelSeeds() * 0.013, 8, 6),
      i % 2 ? cream : yellow, x, y, 0.147);
    m.scale.set(1.2, 0.83, 0.26);
    return m;
  });

  const ringGeo = new THREE.TorusGeometry(1, 0.035, 6, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const rings = Array.from({ length: 5 }, () => mesh(root, ringGeo,
    new THREE.MeshBasicMaterial({ color: "#ffd67b", transparent: true, depthWrite: false })));
  const particles = (count: number, radius: number, color: string, holder = root) => {
    const random = mulberry32(count * 17);
    const g = new THREE.IcosahedronGeometry(radius);
    const mat = new THREE.MeshBasicMaterial({ color });
    return Array.from({ length: count }, () => {
      const m = mesh(holder, g, mat);
      return { m, a: random(), b: random(), c: random() };
    });
  };
  const splash = particles(22, 0.013, "#ffc34f");
  const salt = particles(32, 0.0062, "#fff2ce");
  const moisture = particles(26, 0.024, "#83d9e3", slice);
  const vapor = particles(23, 0.030, "#ffe9c8", macro);
  const crisp = particles(12, 0.012, "#ffce64");

  return { root, active, second, timerMat, tray, shaker, cloth, apron, macro, flesh, shellMaterial, kernels,
    liveTicket, ticketGeometry, pins, rings, splash, salt, moisture, vapor, crisp };
};

type RushProps = ReturnType<typeof buildRush>;
const RUSHLIGHT = new THREE.Color(2.4, 0.48, 0.12);
const TIMER_DIM = new THREE.Color("#8d3c35");
const PALE_SHELL = new THREE.Color("#dba568");
const CRISP_SHELL = new THREE.Color("#e09728");

const updateRush = (p: RushProps, id: number, f: number, oil: number) => {
  // Tickets feed in three overlapping bursts. The paper bends forward as it leaves the slot.
  const feed = 0.11 + 0.08 * ramp(f, 300, 309) + 0.09 * ramp(f, 316, 325) + 0.08 * ramp(f, 333, 343);
  const ticket = p.ticketGeometry.attributes.position;
  for (let i = 0; i < ticket.count; i++) {
    const u = Math.floor(i / 2) / 14;
    ticket.setY(i, 0.028 - feed * u);
    ticket.setZ(i, 0.192 + u * u * 0.12);
  }
  ticket.needsUpdate = true;
  p.ticketGeometry.computeBoundingSphere();
  p.liveTicket.visible = f >= 300;
  p.pins[0].visible = f >= 300;
  p.pins[1].visible = f >= 322;

  const pose = basketPose(f);
  p.active.visible = id !== 12;
  p.active.position.set(pose.x, pose.y, pose.z);
  p.active.rotation.z = pose.roll;
  p.second.visible = f >= 580;
  const load = ramp(f, 586, 616);
  const lower = ramp(f, 615, 642);
  const idle = ramp(f, 1350, 1396);
  p.second.position.set(VAT2_X + 0.43 * (1 - load), 1.40 - 0.47 * lower + 0.14 * idle, VAT1.z - 0.04 * (1 - load));
  p.second.rotation.z = -0.09 * (1 - lower);

  const signal = Math.max(0, Math.cos((f - 766) * 0.6)) * ramp(f, 763, 768) * (1 - ramp(f, 782, 796));
  p.timerMat.color.copy(TIMER_DIM).lerp(RUSHLIGHT, signal);

  const pour = saltAt(f);
  p.tray.visible = f >= 478 && f < 1406;
  p.shaker.visible = pour.showing;
  p.shaker.position.set(pour.x, pour.y, pour.z);
  p.shaker.rotation.z = pour.tilt;
  for (const { m, a, b, c } of p.salt) {
    const life = ((f * 0.072 + a) % 1);
    m.visible = pour.spilling > b * 0.7;
    m.position.set(pour.x + 0.084 + life * (0.04 + c * 0.06) + (b - 0.5) * 0.11,
      pour.y - 0.095 - 0.44 * life * life, pour.z + (c - 0.5) * (0.11 + life * 0.12));
    m.scale.setScalar((0.75 + 0.6 * c) * (1 - 0.38 * life));
  }

  p.cloth.visible = f >= 1406;
  p.cloth.position.set(...wipeAt(Math.min(f, 1450)));
  p.apron.visible = f >= APRON_OFF;
  p.apron.position.set(...apronAt(f));
  const settle = Math.max(0, f - APRON_HUNG);
  p.apron.rotation.z = 0.26 * (1 - ramp(f, APRON_OFF, APRON_HUNG)) +
    Math.sin(settle * 0.27) * 0.10 * Math.exp(-0.071 * settle);

  const oilFocus = id === 5 || id === 11 || id === 13;
  p.rings.forEach((m, i) => {
    const life = (f * 0.029 + i / p.rings.length) % 1;
    const size = 0.025 + 0.21 * life;
    m.visible = oilFocus && oil > 0.03;
    m.position.set(VAT1.x, VAT1.oilY + 0.005 + 0.002 * i, VAT1.z);
    m.scale.set(size, size, size * 1.42);
    m.material.opacity = Math.sin(Math.PI * life) * oil * (id === 11 ? 0.67 : 0.44);
  });

  for (const { m, a, b, c } of p.splash) {
    const life = (f - IMPACT - a * 7) / (15 + 6 * c);
    const r = 0.07 + life * (0.10 + 0.08 * c);
    const angle = b * Math.PI * 2;
    m.visible = id === 5 && life > 0 && life < 1;
    m.position.set(VAT1.x + 0.045 + r * Math.cos(angle), VAT1.oilY + 0.08 + (0.18 + 0.31 * c) * 4 * life * (1 - life),
      VAT1.z + r * 1.55 * Math.sin(angle));
    m.scale.setScalar(0.72 + c * 0.82);
  }

  p.macro.visible = id === 12;
  if (p.macro.visible) {
    const cooking = ramp(f, 1160, 1272);
    p.shellMaterial.color.copy(PALE_SHELL).lerp(CRISP_SHELL, cooking);
    p.flesh.scale.set(0.94 - 0.17 * cooking, 0.94 - 0.13 * cooking, 1);
    p.kernels.forEach((m, i) => { m.visible = i / p.kernels.length > cooking * 0.65; });
    for (const { m, a, b, c } of p.moisture) {
      const life = (f * 0.027 + a) % 1;
      m.position.set((b - 0.5) * (0.32 + 0.28 * life), -0.43 + c * 0.52 + 0.52 * life, 0.156 + 0.07 * life);
      m.scale.setScalar(Math.sin(Math.PI * life) * (0.50 + c * 0.74));
      m.visible = a > cooking * 0.8;
    }
    for (const { m, a, b, c } of p.vapor) {
      const life = (f * 0.021 + a) % 1;
      m.position.set(-0.18 + (b - 0.5) * (0.35 + 0.43 * life) - 0.09 * life,
        0.34 + 0.58 * life, 0.05 + 0.1 * c);
      m.scale.setScalar(Math.sin(Math.PI * life) * (0.55 + 1.25 * c));
      m.visible = b > 0.39 - cooking * 0.28;
    }
  }

  const finish = basketPose(f);
  for (const { m, a, b, c } of p.crisp) {
    const life = (f - 1351 - a * 13) / (23 + c * 10);
    m.visible = id === 13 && life >= 0 && life <= 1;
    m.position.set(finish.x + (b - 0.5) * (0.46 + 0.41 * life),
      finish.y + 0.42 + life * (0.22 + 0.23 * c) - 0.45 * life * life,
      finish.z + (c - 0.5) * 0.45);
    m.scale.setScalar((1.24 - life * 0.68) * (0.50 + c));
  }
};

export class FryWorld {
  root = new THREE.Group();
  private pool = new Pool();
  private actor: Actor;
  private blob: Fx;
  private steams: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fog = new THREE.Fog("#e8d9b0", 25, 300);
  private basket = new THREE.Group();
  private originalFryer: THREE.Object3D;
  private rush?: RushProps;
  private wipingHand?: Fx;
  private steel: THREE.Material;
  private openingLampPosts = new THREE.Group();
  private counterBaskets: THREE.Mesh[];
  private bubbles: { m: THREE.Mesh; x: number; z: number; s: number; size: number }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- lights (template day preset; fixed sun, front-right-top) ----
    const L = LIGHTS.day, K = LOOK.day;
    this.hemi = new THREE.HemisphereLight(L.sky, L.ground, L.hemiI);
    this.sun = new THREE.DirectionalLight(L.sunCol, L.sunI);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);

    // ---- materials (lam() is cached by key: fry_* keys are unique to this scene) ----
    const M = {
      floor: lam("fry_floor", () => ({ map: tileTex() })),
      wall: lam("fry_wall", () => ({ color: "#eed9ae" })),
      wallSide: lam("fry_wallSide", () => ({ color: "#e9d8b4" })),
      counter: lam("fry_counter", () => ({ color: "#c98f5f" })),
      counterDark: lam("fry_counterDark", () => ({ color: "#a97648" })),
      counterTop: twoTone(new THREE.MeshPhongMaterial({ color: "#b9bec6", specular: "#d8dce0", shininess: 40 }), 0.15),
      steel: twoTone(new THREE.MeshPhongMaterial({ color: "#9aa0a8", specular: "#b0b0b0", shininess: 45 }), 0.15),
      steelDark: twoTone(new THREE.MeshPhongMaterial({ color: "#6e747c", specular: "#8a8a8a", shininess: 40 }), 0.15),
      basketSteel: twoTone(new THREE.MeshPhongMaterial({ color: "#55585f", specular: "#7a7a7a", shininess: 35 }), 0.15),
      basketLight: twoTone(new THREE.MeshPhongMaterial({ color: "#7d838c", specular: "#9a9a9a", shininess: 35 }), 0.15),
      wood: lam("fry_wood", () => ({ map: beam() })),
      fry: lam("fry_fry", () => ({ color: "#f2b63c" })),
      fryDark: lam("fry_fryDark", () => ({ color: "#dd9a1e" })),
    };

    // ---- static room + station (one merged mesh per material) ----
    const b = new Batch();
    // floor (tile texture, 1 m per tile)
    b.add(boxGeo(V(-8, -0.05, -2.7), V(8, 0, 12), 1), M.floor);
    // back wall (7 m tall: the wide shot's top ray reaches 6.3 m at the wall) + side walls
    b.add(boxGeo(V(-8, 0, -2.7), V(8, 7, -2.6)), M.wall);
    b.add(boxGeo(V(-4.6, 0, -2.7), V(-4.5, 7, 12)), M.wallSide);
    b.add(boxGeo(V(4.5, 0, -2.7), V(4.6, 7, 12)), M.wallSide);
    // counter: body, top slab, front panel inset, kick plate
    b.add(boxGeo(V(COUNTER.x0, 0, COUNTER.z0), V(COUNTER.x1, COUNTER.topY, COUNTER.z1)), M.counter);
    b.add(boxGeo(V(COUNTER.x0 - 0.05, COUNTER.topY, COUNTER.z0 - 0.05), V(COUNTER.x1 + 0.05, COUNTER.topY + 0.07, COUNTER.z1 + 0.05)), M.counterTop);
    b.add(boxGeo(V(-2.15, 0.2, COUNTER.z1 - 0.02), V(2.15, 0.8, COUNTER.z1 + 0.02)), M.counterDark);
    b.add(boxGeo(V(COUNTER.x0, 0, COUNTER.z1), V(COUNTER.x1, 0.12, COUNTER.z1 + 0.04)), M.steelDark);
    // fryer body + rim strips + control panel
    b.add(boxGeo(V(FRYER.x0, FRYER.y0, FRYER.z0), V(FRYER.x1, FRYER.y1, FRYER.z1)), M.steel);
    for (const z of [FRYER.z0 + 0.03, FRYER.z1 - 0.03])
      b.add(boxGeo(V(FRYER.x0 - 0.02, FRYER.y1, z - 0.04), V(FRYER.x1 + 0.02, FRYER.y1 + 0.08, z + 0.04)), M.steelDark);
    for (const x of [FRYER.x0 + 0.03, FRYER.x1 - 0.03])
      b.add(boxGeo(V(x - 0.04, FRYER.y1, FRYER.z0), V(x + 0.04, FRYER.y1 + 0.08, FRYER.z1)), M.steelDark);
    b.add(boxGeo(V(FRYER.x0 + 0.05, 0.95, FRYER.z1 - 0.02), V(FRYER.x1 - 0.05, 1.08, FRYER.z1 + 0.02)), M.steelDark);
    // The original posts stay in the opening. New shots use the same lamp bar on wall brackets.
    const posts = new Batch();
    for (const x of [-1.85, -0.95])
      posts.add(boxGeo(V(x - 0.03, COUNTER.topY + 0.07, -1.65), V(x + 0.03, 2.15, -1.59)), M.steelDark);
    posts.build(this.openingLampPosts);
    b.add(boxGeo(V(-1.9, 2.15, -1.65), V(-0.9, 2.25, -1.15)), M.steelDark);
    // menu board frame + shelf + containers
    b.add(boxGeo(V(0.4, 2.45, -2.58), V(2.2, 3.55, -2.5)), M.wood);
    b.add(boxGeo(V(0.4, 2.28, -2.6), V(2.2, 2.34, -2.2)), M.wood);
    b.add(boxGeo(V(-1.77, 3.1, -2.58), V(-1.07, 3.5, -2.5)), M.steelDark); // timer box
    // lined baskets on the counter (right of the fryer) + tray stack + cup
    for (const [bx, withFries] of [[-0.05, true], [0.55, false], [1.15, false]] as const) {
      const y0 = COUNTER.topY + 0.07;
      b.add(boxGeo(V(bx - 0.225, y0, -1.5), V(bx + 0.225, y0 + 0.04, -0.9)), M.basketLight);
      for (const dx of [-0.21, 0.21])
        b.add(boxGeo(V(bx + dx - 0.015, y0 + 0.04, -1.5), V(bx + dx + 0.015, y0 + 0.26, -0.9)), M.basketLight);
      for (const dz of [-1.485, -0.915]) for (const yy of [0.1, 0.17, 0.24])
        b.add(boxGeo(V(bx - 0.225, y0 + yy, dz - 0.015), V(bx + 0.225, y0 + yy + 0.03, dz + 0.015)), M.basketLight);
      for (const dz of [-1.35, -1.2, -1.05])
        b.add(boxGeo(V(bx - 0.225, y0 + 0.13, dz - 0.01), V(bx + 0.225, y0 + 0.15, dz + 0.01)), M.basketLight);
      if (withFries) {
        const r = mulberry32(11);
        for (let i = 0; i < 14; i++) {
          const fx = bx + (r() - 0.5) * 0.32, fz = -1.2 + (r() - 0.5) * 0.44;
          // boxGeo already bakes world coords: no extra matrix (a translate here double-applies and floats the fries onto the wall)
          b.add(boxGeo(V(fx - 0.03, y0 + 0.1, fz - 0.03), V(fx + 0.03, y0 + 0.48, fz + 0.03)), i % 2 ? M.fryDark : M.fry);
        }
      }
    }
    b.add(boxGeo(V(1.7, COUNTER.topY + 0.07, -1.0), V(2.2, COUNTER.topY + 0.12, -0.65)), lam("fry_trayRed", () => ({ color: "#ff4a3d" })));
    b.add(boxGeo(V(1.7, COUNTER.topY + 0.12, -1.0), V(2.2, COUNTER.topY + 0.17, -0.65)), lam("fry_tray", () => ({ color: "#e8e2d2" })));
    b.build(R);
    // The solid shell is part of the approved opening. Open wells replace it at frame 300.
    this.originalFryer = R.children.find((child) => (child as THREE.Mesh).material === M.steel)!;
    this.steel = M.steel;
    this.counterBaskets = R.children.filter((child): child is THREE.Mesh =>
      child instanceof THREE.Mesh && [M.basketLight, M.fry, M.fryDark].some((material) => material === child.material));
    R.add(this.openingLampPosts);

    // ---- oil surfaces (emissive amber; plain Lambert so the emissive survives the two-tone world) ----
    const oilMat = (color: string, emissive: string, ei: number) =>
      new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: ei });
    for (const [cx, mat] of [[-1.425, oilMat("#dd9218", "#a86a08", 0.35)], [-0.775, oilMat("#c07f14", "#6e4a05", 0.3)]] as const) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.8), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(cx, VAT1.oilY, VAT1.z); m.receiveShadow = true;
      R.add(m);
    }
    // ---- menu board face (unlit canvas texture) + timer lamp + heat-lamp glow strip ----
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0),
      new THREE.MeshBasicMaterial({ map: menuTex() }));
    board.position.set(1.3, 3.0, -2.49); R.add(board);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: "#ff4a3d" }));
    lamp.position.set(-1.42, 3.3, -2.46); R.add(lamp);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.4),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.3, 0.45) }));
    glow.position.set(-1.4, 2.14, -1.4); R.add(glow);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12),
      new THREE.MeshBasicMaterial({ color: "#ff4a3d" }));
    knob.rotation.x = Math.PI / 2; knob.position.set(-1.42, 1.0, FRYER.z1 + 0.03); R.add(knob);

    // ---- shelf containers (3 coloured jars) ----
    const jarCols = ["#7fb069", "#e8e2d2", "#5b8a9e"];
    jarCols.forEach((c, i) => {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12), lam(`fry_jar${i}`, () => ({ color: c })));
      jar.position.set(0.75 + i * 0.6, 2.49, -2.4); jar.castShadow = true; R.add(jar);
    });

    // ---- active basket (dynamic group; origin = basket bottom centre) ----
    const bs = M.basketSteel, fr = M.fry, fd = M.fryDark;
    const bag = new THREE.Group();
    const addBox = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; bag.add(m); return m;
    };
    addBox(boxGeo(V(-0.25, 0, -0.325), V(0.25, 0.03, 0.325)), bs); // bottom
    for (const dx of [-0.235, 0.235])
      addBox(boxGeo(V(dx - 0.015, 0.03, -0.325), V(dx + 0.015, 0.28, 0.325)), bs).name = "solid basket side";
    for (const dz of [-0.31, 0.31]) for (const yy of [0.08, 0.16, 0.24])
      addBox(boxGeo(V(-0.25, yy, dz - 0.015), V(0.25, yy + 0.03, dz + 0.015)), bs); // front/back slats
    for (const dz of [-0.16, 0, 0.16])
      addBox(boxGeo(V(-0.25, 0.13, dz - 0.01), V(0.25, 0.15, dz + 0.01)), bs); // long slats
    // handle: two rods from the back-top edge down-out to the grip bar (toward the worker)
    for (const dx of [-0.18, 0.18])
      addBox(beamBetween(V(dx, 0.25, -0.325), V(dx, 0.15, -0.42), 0.04), bs);
    addBox(boxGeo(V(-0.22, 0.125, -0.445), V(0.22, 0.175, -0.395)), bs); // grip bar
    // fries poking above the rim
    const r = mulberry32(7);
    for (let i = 0; i < 18; i++) {
      const fx = (r() - 0.5) * 0.36, fz = (r() - 0.5) * 0.52;
      addBox(boxGeo(V(fx - 0.03, 0.12, fz - 0.03), V(fx + 0.03, 0.52, fz + 0.03)), i % 2 ? fd : fr).name = "opening fries";
    }
    bag.position.set(VAT1.x, basketBottomY(0), VAT1.z);
    this.basket = bag; R.add(bag);

    // ---- oil bubbles (small bright spheres in the active vat) ----
    const br = mulberry32(55);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: "#ffe9a8", transparent: true, opacity: 0, depthWrite: false });
    for (let i = 0; i < 20; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.02 + br() * 0.03, 8, 8), bubbleMat.clone());
      m.position.set(-1.68 + br() * 0.52, VAT1.oilY, -1.56 + br() * 0.72);
      m.visible = false; R.add(m);
      this.bubbles.push({ m, x: m.position.x, z: m.position.z, s: br(), size: 0.02 + br() * 0.03 });
    }

    // ---- billboard worker + contact blob + steam cards ----
    this.actor = new Actor(R);
    this.blob = new Fx(R);
    for (let i = 0; i < 6; i++) this.steams.push(new Fx(R));
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, p = basketProgress(f);
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig: fixed sun, shadow fit around the focus ----
    const L = LIGHTS.day;
    this.sun.position.copy(focus).addScaledVector(SUN_DIR, 220);
    this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera, Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    scene.fog = this.fog; scene.background = null;
    // ---- basket lowers into the oil ----
    const isRush = id >= 4;
    this.originalFryer.visible = !isRush;
    this.openingLampPosts.visible = !isRush;
    for (const basket of this.counterBaskets) basket.visible = id < 14;
    if (isRush) this.rush ??= buildRush(this.root, this.steel, this.basket);
    this.basket.visible = !isRush;
    this.basket.position.y = basketBottomY(p);
    this.basket.rotation.z = 0.08 * (1 - p);
    // ---- bubbles ramp with the fry ----
    const fi = fryIntensity(f);
    if (this.rush) {
      this.rush.root.visible = isRush;
      if (isRush) updateRush(this.rush, id, f, fi);
    }
    for (const b of this.bubbles) {
      const life = ((f * 0.03 + b.s) % 1);
      b.m.visible = fi > 0.02;
      if (!b.m.visible) continue;
      b.m.position.set(b.x, VAT1.oilY + life * 0.06, b.z);
      const sc2 = 0.5 + fi;
      b.m.scale.setScalar(sc2);
      (b.m.material as THREE.MeshBasicMaterial).opacity = 0.55 * fi * (1 - life * 0.5);
    }
    // ---- cast: worker + contact blob + steam ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const camInfo = { pos: cam.position, right };
    const st = fryStage(id, f, t, camInfo);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const pl = st.places[0];
    const bp = st.fx[0];
    this.actor.mesh.visible = !!pl;
    this.blob.mesh.visible = !!bp;
    if (pl) {
      const [w, h, k] = pl.size ?? [480, 800, 0.8];
      this.actor.r = this.pool.req(pl.key, w, h, k, pl.draw);
      this.actor.mesh.position.set(pl.x, pl.y, pl.z);
      this.actor.mesh.rotation.set(0, Math.atan2(cam.position.x - pl.x, cam.position.z - pl.z), 0);
      this.actor.mesh.castShadow = false;
    }
    if (bp) {
      this.blob.r = this.pool.req(bp.key, bp.cw, bp.ch, 1, bp.draw);
      this.blob.use(false);
      this.blob.mesh.position.set(bp.x, bp.y, bp.z);
      this.blob.mesh.rotation.set(-Math.PI / 2, 0, bp.rot ?? 0);
      this.blob.mesh.scale.set(bp.w, bp.h, 1);
    }
    // steam puffs above the active vat (soft cards, billboarded)
    const si = steamIntensity(f);
    const sr = mulberry32(99);
    const steamSeeds = Array.from({ length: 6 }, () => ({ s: sr(), s2: sr(), w: sr() * 6.28 }));
    let n = 0;
    for (let i = 0; i < 6; i++) {
      const sd = steamSeeds[i];
      const age = ((t * 0.45 + sd.s) % 1);
      if (id === 12) continue;
      const prepSteam = id === 6 && i < 3;
      const steamRise = id === 6 ? 0.36 : id <= 10 ? 0.30 : 0.77;
      const y = (prepSteam ? 1.15 : 1.20) + age * (isRush ? steamRise : 1.1);
      const drift = id === 10 ? -0.27 : isRush ? age * 0.22 : 0;
      const x = (prepSteam ? SALT_TRAY[0] - 0.11 : VAT1.x) +
        Math.sin(age * 5 + sd.w) * 0.12 * age + (sd.s2 - 0.5) * 0.3 - age * 0.12 + drift;
      const z = VAT1.z + (sd.s - 0.5) * 0.3 + (isRush ? 0.14 : 0);
      const sz = (0.3 + 0.35 * age) * (0.5 + 0.5 * si);
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), Math.max(sz, 0.5)))) continue;
      const e = this.steams[n++];
      const paintAge = isRush ? q(age) : age;
      e.r = this.pool.req(`${isRush ? "rushSteam" : "steam"}${q(age)}`, 300, 300, 1, (pen: Pen) => fxPuff(pen, paintAge));
      e.use(true);
      e.soft.opacity = isRush ? si * (id === 10 ? 0.45 : 0.82) : 1;
      e.mesh.visible = true;
      e.mesh.position.set(x, y, z);
      e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(sz, sz, 1);
    }
    for (let i = n; i < this.steams.length; i++) this.steams[i].mesh.visible = false;
    const wiping = id === 14 && f < 1454;
    if (wiping) {
      const hand = this.wipingHand ??= new Fx(this.root);
      const [x, y, z] = wipeAt(f);
      hand.r = this.pool.req("fry|wipe-hand", 180, 128, 1, drawWipingHand);
      hand.use(false);
      hand.mesh.position.set(x, y + 0.067, z + 0.016);
      hand.mesh.quaternion.copy(cam.quaternion);
      hand.mesh.scale.set(0.30, 0.22, 1);
    }
    if (this.wipingHand) this.wipingHand.mesh.visible = wiping;
    this.pool.flush();
    if (pl) this.actor.bind();
    if (bp) this.blob.bind();
    if (wiping) this.wipingHand?.bind();
    for (let i = 0; i < n; i++) this.steams[i].bind();
    return V(...focusAt(id, f));
  }
}
