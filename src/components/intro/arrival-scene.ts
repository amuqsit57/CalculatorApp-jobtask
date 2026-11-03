import * as THREE from "three";
import { createStage, frameStep, PARTICLE_LIFE } from "./car-stage";

const FLIP_SECONDS = 1.9;
const OFF_SCREEN_SECONDS = 0.35;
const RETURN_SECONDS = 1.8;
const SETTLE_SECONDS = 0.45;

const CAMERA_DISTANCE = 12;
const HALF_HEIGHT = CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(18));
/** The car's length in scene units, with a little room at each end. */
const CAR_LENGTH = 4.9;
/** The distance from the rig's pivot down to the bottom of the wheels, at full size. */
const WHEEL_DROP = 0.7;
/** Parked facing left, turned slightly towards the viewer so that it reads as 3D. */
const PARKED_YAW = Math.PI + 0.35;
const PARKED_ROLL = -0.2;

const TAIL_LIGHT_NORMAL = 4;
const TAIL_LIGHT_BRAKING = 16;

function smooth(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

type ArrivalOptions = {
  /** The element the car parks on: its bottom edge is the road. */
  getSlot: () => HTMLElement | null;
  /** False parks the car straight away, with no stunt. */
  animate: boolean;
};

/**
 * Flies the car in from the bottom left with a backflip and out at the top right,
 * brings it back along the line under the header, and parks it there as the logo.
 * Returns a function that frees its resources. Throws if WebGL is unavailable.
 */
export function playArrival(canvas: HTMLCanvasElement, { getSlot, animate }: ArrivalOptions) {
  let parked = false;

  const stage = createStage(canvas, () => {
    if (parked) drawParked();
  });
  const { car, camera, wheels, tailLight } = stage;

  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  // Everything moves and turns the rig. Lifting the car inside it puts the pivot at its
  // centre, so the flip turns the car around its middle and not its wheels.
  const rig = new THREE.Group();
  rig.rotation.order = "YXZ";
  stage.scene.add(rig);
  rig.add(car);
  car.position.y = -WHEEL_DROP;

  const halfWidth = () => HALF_HEIGHT * camera.aspect;

  /** Where the parked car goes, worked out from the slot's place on the page. */
  function parkedPose() {
    const slot = getSlot()?.getBoundingClientRect();
    const bounds = canvas.getBoundingClientRect();
    if (!slot || slot.width === 0 || bounds.width === 0) return null;

    const unitsPerPixel = (2 * halfWidth()) / bounds.width;
    const scale = (slot.width * unitsPerPixel) / CAR_LENGTH;
    return {
      scale,
      x: (slot.left + slot.width / 2 - bounds.left) * unitsPerPixel - halfWidth(),
      y: HALF_HEIGHT - (slot.bottom - bounds.top) * unitsPerPixel + WHEEL_DROP * scale,
    };
  }

  function applyParkedAttitude() {
    rig.position.z = 0;
    rig.rotation.y = PARKED_YAW;
    rig.rotation.x = PARKED_ROLL;
  }

  function drawParked() {
    const pose = parkedPose();
    if (!pose) return;
    rig.visible = true;
    rig.scale.setScalar(pose.scale);
    rig.position.x = pose.x;
    rig.position.y = pose.y;
    rig.rotation.z = 0;
    applyParkedAttitude();
    stage.setThrust(0);
    tailLight.emissiveIntensity = TAIL_LIGHT_NORMAL;
    stage.updateTrail(PARTICLE_LIFE);
    stage.render();
  }

  // The header is still sliding in, and the fonts may still be loading, when the car first
  // parks, so check its place again once they have finished.
  function parkNow() {
    parked = true;
    canvas.dataset.stage = "parked";
    drawParked();
  }

  const laterChecks = [
    setTimeout(() => parked && drawParked(), 750),
    setTimeout(() => parked && drawParked(), 1500),
  ];
  void document.fonts?.ready.then(() => {
    if (parked && !stopped) drawParked();
  });

  // The header changes height as text wraps, which moves the slot without resizing the canvas.
  const slotWatcher = new ResizeObserver(() => {
    if (parked) drawParked();
  });
  const slotParent = getSlot()?.parentElement;
  if (slotParent) slotWatcher.observe(slotParent);

  let frame = 0;
  let previous = performance.now();
  let elapsed = 0;
  let stopped = false;

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    laterChecks.forEach(clearTimeout);
    slotWatcher.disconnect();
    stage.dispose();
  }

  function flip(progress: number) {
    canvas.dataset.stage = "flip";
    const reach = halfWidth();
    const size = Math.min(1.1, (2 * reach * 0.6) / CAR_LENGTH);

    // A curve from just off the bottom-left corner to just off the top-right corner.
    const fromX = -reach - 3.2;
    const fromY = -HALF_HEIGHT - 2.2;
    const viaX = -reach * 0.05;
    const viaY = -HALF_HEIGHT * 0.45;
    const toX = reach + 3.6;
    const toY = HALF_HEIGHT + 3.2;
    const t = progress;
    const rest = 1 - t;

    rig.visible = true;
    rig.scale.setScalar(size);
    rig.position.x = rest * rest * fromX + 2 * rest * t * viaX + t * t * toX;
    rig.position.y = rest * rest * fromY + 2 * rest * t * viaY + t * t * toY;
    rig.position.z = Math.sin(t * Math.PI) * 1.4;

    const climb = Math.atan2(
      2 * rest * (viaY - fromY) + 2 * t * (toY - viaY),
      2 * rest * (viaX - fromX) + 2 * t * (toX - viaX),
    );
    // A full turn, nose up and over backwards, in the middle of the climb.
    const turn = smooth((t - 0.2) / 0.55) * Math.PI * 2;
    rig.rotation.y = -0.3;
    rig.rotation.x = 0;
    rig.rotation.z = climb + turn;

    for (const wheel of wheels) wheel.rotation.z -= 0.6;
    stage.setThrust(1);
    stage.trailMaterial.size = 0.8 * size;
  }

  function comeBack(progress: number, delta: number) {
    canvas.dataset.stage = "return";
    const pose = parkedPose();
    if (!pose) return;

    const slowing = 1 - progress;
    const fromX = halfWidth() + CAR_LENGTH * pose.scale;

    rig.visible = true;
    rig.scale.setScalar(pose.scale);
    rig.position.x = pose.x + (fromX - pose.x) * slowing ** 3;
    rig.position.y = pose.y;
    applyParkedAttitude();

    // The rockets cut out as the brakes come on, and the nose dips under braking.
    const throttle = 1 - smooth((progress - 0.4) / 0.28);
    stage.setThrust(throttle);
    stage.trailMaterial.size = 0.8 * Math.max(pose.scale, 0.3);
    tailLight.emissiveIntensity = progress > 0.4 ? TAIL_LIGHT_BRAKING : TAIL_LIGHT_NORMAL;
    rig.rotation.z = -0.1 * Math.sin(smooth((progress - 0.5) / 0.5) * Math.PI);

    for (const wheel of wheels) wheel.rotation.z -= delta * 40 * slowing ** 2;
  }

  function settle(progress: number) {
    const pose = parkedPose();
    if (!pose) return;
    rig.scale.setScalar(pose.scale);
    rig.position.x = pose.x;
    rig.position.y = pose.y;
    applyParkedAttitude();
    stage.setThrust(0);
    // The car rocks back on its springs after stopping.
    rig.rotation.z = 0.035 * Math.sin(progress * Math.PI) * (1 - progress);
    tailLight.emissiveIntensity = progress > 0.6 ? TAIL_LIGHT_NORMAL : TAIL_LIGHT_BRAKING;
  }

  function render(now: number) {
    const delta = frameStep(now, previous);
    previous = now;
    elapsed += delta;

    const returnStart = FLIP_SECONDS + OFF_SCREEN_SECONDS;
    const settleStart = returnStart + RETURN_SECONDS;
    const end = settleStart + SETTLE_SECONDS;

    if (elapsed < FLIP_SECONDS) {
      flip(elapsed / FLIP_SECONDS);
    } else if (elapsed < returnStart) {
      rig.visible = false;
      stage.setThrust(0);
    } else if (elapsed < settleStart) {
      comeBack((elapsed - returnStart) / RETURN_SECONDS, delta);
    } else {
      settle(Math.min((elapsed - settleStart) / SETTLE_SECONDS, 1));
    }

    stage.updateTrail(delta);
    stage.render();

    // Keep drawing until the last of the exhaust has faded, then leave the car on screen.
    if (elapsed < end + PARTICLE_LIFE) {
      frame = requestAnimationFrame(render);
    } else {
      parkNow();
    }
  }

  if (animate) {
    rig.visible = false;
    frame = requestAnimationFrame(render);
  } else {
    parkNow();
  }

  return stop;
}
