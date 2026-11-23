// The fry cook as a mromidev-style billboard character: flat 2D cartoon
// drawn with the template's Pen API (toon.ts), posed per frame by the
// shot. Teal apron + cap, round head — the trial #1 worker, redrawn in
// the template's drawing style. The medium shot uses bodySide's "push"
// mode so the arms reach for the basket handle; the hand target is the
// basket grip projected onto the card plane, clamped to arm's reach.
// Placement / pool-tier / light-angle helpers are adapted from
// mromidev/claude-animated-shorts templates/bridge/cast.ts (MIT).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxContact, Outfit, Expr, FrontOpts, SideOpts } from "../bridge/toon";
import { Stage, CamInfo, SU } from "../bridge/cast";
import {
  APRON_HUNG, APRON_OFF, VAT2_X, WORKER_POS, apronAt, basketPose,
  basketProgress, gripPos, ramp, saltAt, wipeAt, V3,
} from "./fryStory";

/** trial #1 colours: teal apron #2f7d6e, teal cap, dark trousers. The
 *  template draws the torso in the jacket colour, so the jacket IS the
 *  apron here; the white shirt underneath is not drawn (apron covers it). */
export const FRYCOOK: Outfit = {
  jacket: "#2f7d6e", pants: "#3b3f52", boots: "#4a3426",
  hat: "cap", cap: "#2f7d6e", skin: "#e8b98a",
};

const q = (v: number, n = 120) => Math.round(v * n) / n;
/** drawing resolution by distance (template tiering, sized for 1440x2560) */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

/** sun direction TOWARD the sun (fixed for this interior: front-right-top) */
const SUN = new THREE.Vector3(0.45, 0.75, 0.55).normalize();
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
/** deterministic blink: 4-frame blink every ~3.2 s */
const blinkAt = (f: number, seed: number) => {
  const c = (f + seed * 13) % 97;
  return c < 4 ? [0.5, 1, 1, 0.5][c] : 0;
};

/** shoulder point in bodySide's design space (matches toon.ts geometry) */
const SHOULDER: [number, number] = [309, 453];
/** basket grip -> hand target in the card's design units, clamped to arm's reach (200 units) */
const handTarget = (cam: CamInfo, grip: V3, feet = WORKER_POS, mirror = false, reach = 200): [number, number] => {
  const [fx, , fz] = feet;
  const yaw = Math.atan2(cam.pos.x - fx, cam.pos.z - fz);
  const lx = (grip[0] - fx) * Math.cos(yaw) - (grip[2] - fz) * Math.sin(yaw);
  let tx = 300 + (mirror ? -lx : lx) / SU, ty = 975 - (grip[1] - feet[1]) / SU;
  const dx = tx - SHOULDER[0], dy = ty - SHOULDER[1], len = Math.hypot(dx, dy);
  if (len > reach) { tx = SHOULDER[0] + (dx / len) * reach; ty = SHOULDER[1] + (dy / len) * reach; }
  return [Math.round(tx), Math.round(ty)];
};

/** the worker's placement for shot `id` at frame f (t in seconds) */
export const fryStage = (id: number, f: number, t: number, cam: CamInfo): Stage => {
  if (id >= 4) return rushStage(id, f, cam);
  const out: Stage = { places: [], fx: [] };
  const p = basketProgress(f);
  const [wx, wy, wz] = WORKER_POS;
  const blink = blinkAt(f, 3);
  const expr: Expr = p > 0.9 ? "grin" : "smile";
  const light = light2D(cam, false);
  const d = cam.pos.distanceTo(new THREE.Vector3(wx, wy + 1.2, wz));
  const [w, h, k] = tier(d);

  if (id === 2) {
    // profile, facing screen-right (the fryer), arms reaching for the grip
    const hand = handTarget(cam, gripPos(p));
    const so: SideOpts = { mode: "push", pose: q(p, 30), expr, blink, hand, light, seed: 3 };
    const key = `fry|side|${expr}|${q(p, 30)}|${blink}|${hand[0]},${hand[1]}|${q(light, 30)}`;
    out.places.push({
      key, x: wx, y: wy, z: wz, size: [w, h, k],
      draw: (pen: Pen) => bodySide(pen, FRYCOOK, so),
    });
  } else {
    // front view (shots 1 + 3): standing at the fryer, slight lean-in as the basket drops
    const fo: FrontOpts = { mode: "stand", expr, blink, tilt: 3 * p, light, seed: 3 };
    const key = `fry|front|${expr}|${q(p, 30)}|${blink}|${q(light, 30)}`;
    out.places.push({
      key, x: wx, y: wy, z: wz, size: [w, h, k],
      draw: (pen: Pen) => bodyFront(pen, FRYCOOK, fo),
    });
  }
  // soft contact blob under the worker's feet (multiply, floor-flat)
  out.fx.push({
    key: "blob|contact|fry", cw: 128, ch: 128, draw: (pen: Pen) => fxContact(pen, "#5a5a72"),
    x: wx, y: 0.02, z: wz, w: 0.55, h: 0.45, flat: true, rot: 0.6,
  });
  return out;
};

// Find the point on the billboard that projects onto the world-space prop.
const posedHand = (cam: CamInfo, grip: V3, feet: V3, mirror: boolean): [number, number] => {
  const card = new THREE.Vector3(...feet);
  const normal = cam.pos.clone().sub(card).setY(0).normalize();
  const ray = new THREE.Vector3(...grip).sub(cam.pos);
  const denominator = normal.dot(ray);
  if (Math.abs(denominator) < 0.001) return handTarget(cam, grip, feet, mirror, 240);
  const planeDepth = normal.dot(card.sub(cam.pos));
  const at = ray.multiplyScalar(planeDepth / denominator).add(cam.pos);
  return handTarget(cam, [at.x, at.y, at.z], feet, mirror, 240);
};

const OFF_DUTY: Outfit = { ...FRYCOOK, jacket: "#e8d5ad" };
const EXIT = 1616;
const PREP_FEET: V3 = [0.75, 0, -1.92];

const rushStage = (id: number, f: number, cam: CamInfo): Stage => {
  const stage: Stage = { places: [], fx: [] };
  if (id === 4 || id === 11 || id === 12 || id === 13 || (id === 15 && f >= EXIT)) return stage;

  let feet: V3 = [...WORKER_POS];
  let expr: Expr = "stern";
  let front = false;
  let walking = false;
  let mirror = false;
  let hand: V3 | undefined;
  const basket = basketPose(f);
  const grip: V3 = [basket.x - 0.15 * Math.sin(basket.roll), basket.y + 0.15 * Math.cos(basket.roll), basket.z - 0.42];

  switch (id) {
    case 5:
      feet[0] -= 0.22;
      feet[2] -= 0.13;
      hand = grip;
      break;
    case 8:
      hand = grip;
      break;
    case 6: {
      const s = saltAt(f);
      feet = PREP_FEET;
      hand = [s.x, s.y + 0.025, s.z];
      mirror = true;
      break;
    }
    case 7:
      feet[0] += 0.42 * ramp(f, 587, 615) - 0.39 * ramp(f, 649, 684);
      hand = [VAT2_X, 1.37 - 0.18 * ramp(f, 614, 638), -1.63];
      expr = f < 613 ? "shock" : "stern";
      break;
    case 9: {
      feet[0] += 0.47 + 0.16 * ramp(f, 808, 829) * (1 - ramp(f, 867, 888));
      const s = saltAt(f);
      hand = s.showing ? [s.x, s.y, s.z] : grip;
      mirror = true;
      break;
    }
    case 10:
      front = true;
      expr = f < 941 ? "nervous" : "shock";
      break;
    case 14: {
      feet = [0.62 + 0.77 * ramp(f, 1440, 1472), 0, -1.97 + 0.15 * (1 - ramp(f, 1442, 1461))];
      if (f < 1454) {
        const [x, y, z] = wipeAt(f);
        hand = [x, y + 0.08, z];
      } else if (f < APRON_OFF) hand = [1.56, 1.39, -1.99];
      else if (f <= APRON_HUNG + 5) {
        const [x, y, z] = apronAt(f);
        hand = [x - 0.03, y - 0.12, z + 0.04];
      }
      expr = "relief";
      break;
    }
    case 15:
      feet = [1.39 + 2.95 * ramp(f, 1523, EXIT), 0, -1.97];
      walking = true;
      expr = "neutral";
      break;
  }

  const [x, y, z] = feet;
  const blink = blinkAt(f, 3);
  const light = light2D(cam, mirror);
  const outfit = f >= APRON_OFF ? OFF_DUTY : FRYCOOK;
  const size = tier(cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)));
  const common = [expr, blink, light, outfit.jacket, mirror].join("|");

  if (front) {
    const look = q(0.56 - 0.56 * ramp(f, 928, 950), 30);
    const headTilt = q(-7 * ramp(f, 936, 967), 12);
    const fo: FrontOpts = { mode: "stand", expr, blink, light, look, headTilt, seed: 3 };
    stage.places.push({ x, y, z, size, key: `rush|front|${common}|${look}|${headTilt}`,
      draw: (pen) => bodyFront(pen, outfit, fo) });
  } else {
    const target = hand ? posedHand(cam, hand, feet, mirror) : undefined;
    const mode = target ? "push" : walking ? "march" : "stand";
    const phase = walking ? q((x - 1.39) / 0.765, 60) : 0;
    const pose = target ? 1 : 0;
    const so: SideOpts = { mode, phase, expr, blink, pose, stride: 0.48, hand: target, light, seed: 3 };
    stage.places.push({ x, y, z, size, key: `rush|side|${common}|${mode}|${phase}|${target?.join(",") ?? ""}`,
      draw: (pen) => {
        pen.g.save();
        if (mirror) {
          pen.g.translate(600, 0);
          pen.g.scale(-1, 1);
        }
        bodySide(pen, outfit, so);
        pen.g.restore();
      } });
  }

  stage.fx.push({
    key: "blob|contact|fry", cw: 128, ch: 128, draw: (pen) => fxContact(pen, "#5a5a72"),
    x, y: 0.02, z, w: 0.55, h: 0.45, flat: true, rot: 0.6,
  });
  return stage;
};
