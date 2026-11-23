// Fry cook in the mromidev cartoon-3D style (60 s).
// NEW scene: the fry station from trial #1 ("how it feels to be a fry
// cook"), rebuilt on the mromidev template's engine — 2D billboard
// character in a 3D toon world, ink outlines, DOF, gliding cameras.
// The bridge scene/story is NOT reused; only the engine and style
// language (camera grammar + post chain) carry over.
// Camera grammar helpers (glide / mix / dolly / zoom / pushK / run)
// are adapted from mromidev/claude-animated-shorts templates/bridge
// (MIT) — same symmetric smootherstep glides and push-in grammar.
import * as THREE from "three";

export const FPS = 30;
export const TOTAL = 1800; // 60 s
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// ---------------- layout (metres, human scale; worker is the template's 1.67 m adult) ----------------
export const WORKER_POS: V3 = [-1.42, 0, -2.0]; // feet, behind the counter, facing the fryer (+z)
export const VAT1 = { x: -1.42, z: -1.2, oilY: 1.09 }; // active vat centre
export const COUNTER = { x0: -2.3, x1: 2.3, topY: 0.9, z0: -1.8, z1: -0.6 };
export const FRYER = { x0: -1.8, x1: -0.4, y0: 0.9, y1: 1.12, z0: -1.7, z1: -0.7 }; // low-profile: shoulders + head stay above it
export const basketBottomY = (p: number) => 1.21 - 0.3 * p; // held just above the oil -> down in the oil
export const gripPos = (p: number): V3 => [-1.42, basketBottomY(p) + 0.15, -1.62]; // basket handle grip

export const VAT2_X = -0.775;
export const PRINTER: V3 = [0.25, 1.86, -2.37];
export const SALT_TRAY: V3 = [0.54, 1.14, -1.20];
export const TIMER: V3 = [-0.43, 1.40, -1.47];
export const POTATO: V3 = [1.53, 1.58, 2.20];
export const APRON_HOOK: V3 = [1.87, 1.80, -2.49];
export const IMPACT = 413;
export const APRON_OFF = 1475;
export const APRON_HUNG = 1497;
const VOICE_END = 1638;

// Use the same smootherstep ease for prop moves and camera glides.
export const ramp = (f: number, a: number, b: number) => glide((f - a) / (b - a));
const beat = (f: number, a: number, b: number, c: number, d: number) =>
  ramp(f, a, b) * (1 - ramp(f, c, d));

// ---------------- basket timeline ----------------
// 0-2 s: held above the fryer. 2-5 s: lowered into the oil. 5-10 s: frying (bubbles + steam).
export const basketProgress = (f: number) => {
  if (f < 300) return easeInOut(clamp01((f - 60) / 90));
  const firstDrop = beat(f, 348, 369, 388, 425);
  const practice = 0.46 * beat(f, 690, 704, 708, 721) + 0.50 * beat(f, 720, 735, 741, 755);
  const cycle = beat(f, 790, 811, 864, 897);
  const finish = ramp(f, 1330, 1355);
  return 1 - Math.max(firstDrop, practice, cycle, finish);
};

export const basketPose = (f: number) => {
  const drop = basketProgress(f);
  const shake = Math.sin((f - 816) * 0.77) * beat(f, 812, 821, 834, 843);
  const serve = beat(f, 836, 851, 866, 886);
  const finish = ramp(f, 1348, 1375);
  const x = VAT1.x + 0.04 * serve + 0.31 * finish + 0.055 * shake;
  const lift = f >= 361 && f < 478 ? 0.09 : 0.16;
  const y = basketBottomY(drop) + lift * (1 - drop) + 0.07 * finish + 0.023 * shake - 0.24 * ramp(f, 1392, 1420);
  const z = VAT1.z - 0.07 * serve + 0.22 * finish;
  const roll = 0.08 * (1 - drop) + 0.12 * shake + 0.16 * finish;
  return { x, y, z, roll };
};

export const fryIntensity = (f: number) => {
  const submerged = clamp01((basketProgress(f) - 0.25) / 0.5);
  if (f < 300) return submerged;
  return clamp01(submerged * (1 - ramp(f, 1326, 1398)) + 0.33 * beat(f, 410, 416, 431, 460));
};
export const steamIntensity = (f: number) =>
  f < 300 ? 0.45 + 0.55 * fryIntensity(f) : 0.21 + 0.79 * fryIntensity(f);

export const saltAt = (f: number) => {
  const first = f < 580;
  const a = first ? 478 : 843;
  const showing = first ? f >= 478 : f >= 843 && f <= 876;
  const spilling = first ? beat(f, 483, 496, 546, 567) : beat(f, 845, 850, 867, 874);
  const tick = Math.sin((f - a) * 0.57);
  const [x, y, z] = first ? SALT_TRAY : [-1.36, 1.63, -1.26];
  return {
    showing, spilling, x: x - (first ? 0.19 : 0.10) + tick * 0.03,
    y: y + (first ? 0.30 : 0.36) + tick * 0.035, z: z - 0.06, tilt: -2.36 + tick * 0.12,
  };
};

export const wipeAt = (f: number): V3 => [
  0.76 + 0.20 * Math.sin((f - 1406) * 0.24) * (1 - ramp(f, 1442, 1462)),
  0.985, -1.46 + 0.034 * Math.sin((f - 1406) * 0.39),
];
export const apronAt = (f: number): V3 => {
  const start: V3 = [1.64, 1.45, -2.13];
  const end: V3 = [APRON_HOOK[0], APRON_HOOK[1], APRON_HOOK[2] + 0.06];
  const lift = ramp(f, APRON_OFF, APRON_HUNG);
  return [
    start[0] + (end[0] - start[0]) * lift,
    start[1] + (end[1] - start[1]) * lift,
    start[2] + (end[2] - start[2]) * lift,
  ];
};

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 100 }, // wide establishing: whole station, worker behind the counter
  { id: 2, a: 100, b: 200 }, // medium profile: worker lowers the basket into the fryer
  { id: 3, a: 200, b: 300 }, // close on the fryer: basket in the oil, bubbles + steam
  { id: 4, a: 300, b: 361 },   // tickets
  { id: 5, a: 361, b: 478 },   // first basket and oil impact
  { id: 6, a: 478, b: 580 },   // salt and steam
  { id: 7, a: 580, b: 686 },   // second vat
  { id: 8, a: 686, b: 762 },   // repetitive hand motion
  { id: 9, a: 762, b: 915 },   // timer, lift, shake, salt, repeat
  { id: 10, a: 915, b: 1055 }, // question
  { id: 11, a: 1055, b: 1137 }, // oil insert
  { id: 12, a: 1137, b: 1305 }, // potato cutaway
  { id: 13, a: 1305, b: 1406 }, // from oil to finished fries
  { id: 14, a: 1406, b: 1523 }, // wipe and hang the apron
  { id: 15, a: 1523, b: TOTAL }, // cook exits; hold through the silent tail
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** hard cuts only (each reframe is far bigger than half a frame width); one visible layer */
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- camera ----------------
// Grammar (mromidev template): symmetric smootherstep glides; holds push
// in 0.15-0.35 %/f; a reframe bigger than ~half a frame width is a hard
// cut on its key frame. No hand-held float, no impact kicks in this clip.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: the subject grows ~rate per frame */
const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const S1 = (f: number) => dolly([2.2, 2.0, 8.0], [-0.2, 0.9, -1.4], pushK(f, 0, 0.002), { fov: 40 });
const S2 = (f: number) => dolly([-4.2, 2.4, 0.4], [-1.3, 1.2, -1.6], pushK(f, 100, 0.002), { fov: 46 });
const S3 = (f: number) => dolly([-0.1, 2.0, 1.6], [-1.42, 1.1, -1.2], pushK(f, 200, 0.0025), { fov: 40 });

const hold = (f0: number, pos: V3, look: V3, fov: number, rate = 0.0017, roll = 0) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate), { fov, roll });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }],
  2: [{ f: 100, s: S2 }],
  3: [{ f: 200, s: S3 }],
  4: [{ f: 300, s: hold(300, [0.62, 1.96, -0.99], [0.25, 1.72, -2.25], 36) }],
  5: [
    { f: 361, s: hold(361, [-3.36, 2.37, -0.06], [-1.58, 1.34, -1.56], 50) },
    { f: 400, dur: 30, s: hold(400, [-3.17, 2.39, 0.08], [-1.48, 1.30, -1.54], 48, 0.00155, -0.07) },
  ],
  6: [{ f: 478, s: hold(478, [1.15, 1.96, 0.33], [0.63, 1.32, -1.26], 40) }],
  7: [{ f: 580, s: hold(580, [-0.52, 2.61, 1.27], [-1.12, 1.30, -1.55], 51, 0.0015) }],
  8: [{ f: 686, s: hold(686, [-2.96, 2.08, -0.64], [-1.56, 1.37, -1.58], 43) }],
  9: [
    { f: 762, s: hold(762, [-0.43, 2.34, 0.74], [-0.94, 1.40, -1.43], 58) },
    { f: 788, dur: 32, s: hold(788, [0.03, 2.49, 0.88], [-0.97, 1.42, -1.41], 54, 0.0015) },
  ],
  10: [
    { f: 915, s: hold(915, [-0.96, 1.66, 0.44], [-1.42, 1.55, -1.96], 38) },
    { f: 950, dur: 30, s: hold(950, [-1.00, 1.54, 0.35], [-1.42, 1.56, -1.96], 37, 0.0018, 0.07) },
  ],
  11: [{ f: 1055, s: hold(1055, [-0.92, 2.17, -0.49], [-1.42, 1.11, -1.20], 38) }],
  12: [
    { f: 1137, s: hold(1137, [1.90, 1.74, 4.45], POTATO, 43, 0.0015, -0.07) },
    { f: 1200, dur: 40, s: hold(1200, [1.24, 1.82, 4.28], POTATO, 45, 0.0015) },
  ],
  13: [
    { f: 1305, s: hold(1305, [-1.87, 2.43, 0.08], [-1.40, 1.23, -1.25], 42) },
    { f: 1333, dur: 35, s: hold(1333, [-1.61, 2.21, 0.29], [-1.14, 1.62, -1.06], 44, 0.0016) },
  ],
  14: [
    { f: 1406, s: hold(1406, [-0.31, 1.91, 0.79], [0.76, 1.21, -1.86], 41) },
    { f: 1441, dur: 40, s: hold(1441, [0.62, 1.91, 0.90], [1.49, 1.43, -1.99], 45, 0.0015) },
  ],
  15: [
    { f: 1523, s: hold(1523, [2.10, 2.27, 5.77], [0.38, 1.39, -1.80], 54, 0.0015) },
    { f: VOICE_END, dur: 38, s: hold(VOICE_END, [1.52, 2.05, 5.18], [0.38, 1.39, -1.80], 54, 0.00045) },
  ],
};
// These hard cuts need no inter-shot fades or camera impact kicks.
export const XFADE: Record<number, number> = {};
export const KICKS: [number, number][] = [];
// All close foreground framing comes from the station's procedural geometry.
export const FOREGROUND: { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number }[] = [];

export const camAt = (id: number, f: number): Cam => run(CAMS[id], f);

// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // wide establishing: everything sharp
  { f: 100, cInf: 10, focus: () => [-1.42, 1.3, -2.0] }, // medium: worker + basket sharp, wall soft
  { f: 200, cInf: 14, focus: () => [-1.42, 1.1, -1.2] }, // close: oil + basket sharp, worker soft behind
  { f: 300, cInf: 8, focus: () => [0.25, 1.75, -2.19] },
  { f: 361, cInf: 0 },
  { f: 478, cInf: 9, focus: () => [0.52, 1.28, -1.20] },
  { f: 580, cInf: 0 },
  { f: 915, cInf: 9, focus: () => [-1.42, 1.53, -1.89] },
  { f: 1055, cInf: 0 },
  { f: 1137, cInf: 9, focus: () => POTATO },
  { f: 1305, cInf: 6, focus: (f) => {
    const b = basketPose(f);
    return [b.x, b.y + 0.28, b.z];
  } },
  { f: 1406, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

// ---------------- three helpers ----------------
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
