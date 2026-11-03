import * as THREE from "three";
import { createStage, frameStep } from "./car-stage";

const FLIGHT_SECONDS = 2.8;
/** Time left for the exhaust trail to fade once the car has gone. */
const TRAIL_FADE_SECONDS = 0.7;

type FlyByCallbacks = {
  /** How far the car has swept across the screen, from 0 to 1. Never goes backwards. */
  onSweep: (share: number) => void;
  /** The car has left the screen. */
  onDone: () => void;
};

/**
 * Plays the fly-by on the canvas and returns a function that stops it and frees
 * its resources. Throws if the browser cannot create a WebGL context.
 */
export function playFlyBy(canvas: HTMLCanvasElement, { onSweep, onDone }: FlyByCallbacks) {
  const stage = createStage(canvas);
  const { car, camera, wheels } = stage;

  camera.position.set(0, 1.5, 12);
  camera.lookAt(0, 1.1, 0);

  // Swoops in from far away on the left, passes close to the camera, and leaves on the right.
  const flightPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34, 2.8, -18),
    new THREE.Vector3(-13, 1.9, -8),
    new THREE.Vector3(-2, 1.1, 1.5),
    new THREE.Vector3(5, 0.9, 3.6),
    new THREE.Vector3(30, 2.2, 3),
  ]);

  const point = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const onScreen = new THREE.Vector3();

  let frame = 0;
  let previous = performance.now();
  let elapsed = 0;
  let sweep = 0;
  let finished = false;
  let stopped = false;

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    stage.dispose();
  }

  function render(now: number) {
    const delta = frameStep(now, previous);
    previous = now;
    elapsed += delta;

    const progress = Math.min(elapsed / FLIGHT_SECONDS, 1);

    if (progress < 1) {
      // Starts slower and accelerates through the pass.
      const along = progress ** 1.5;
      flightPath.getPointAt(along, point);
      flightPath.getPointAt(Math.min(along + 0.01, 1), ahead);
      car.position.copy(point);
      car.rotation.order = "YXZ";
      car.rotation.y = -Math.atan2(ahead.z - point.z, ahead.x - point.x);
      car.rotation.z =
        0.5 * Math.atan2(ahead.y - point.y, Math.hypot(ahead.x - point.x, ahead.z - point.z));
      // Banks into the pass, with a small shake from the thrust.
      car.rotation.x = Math.sin(progress * Math.PI) * -0.12 + Math.sin(elapsed * 46) * 0.006;

      for (const wheel of wheels) wheel.rotation.z -= delta * 34;
      stage.setThrust(1);

      onScreen.copy(point).project(camera);
      sweep = Math.max(sweep, Math.min(Math.max((onScreen.x + 1) / 2, 0), 1));
      onSweep(sweep);
    } else {
      car.visible = false;
      if (!finished) {
        finished = true;
        onSweep(1);
        onDone();
      }
    }

    stage.updateTrail(delta);
    stage.render();

    if (elapsed < FLIGHT_SECONDS + TRAIL_FADE_SECONDS) {
      frame = requestAnimationFrame(render);
    } else {
      stage.renderer.clear();
      stop();
    }
  }

  frame = requestAnimationFrame(render);
  return stop;
}
