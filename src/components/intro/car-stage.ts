import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MAX_PARTICLES = 1100;
export const PARTICLE_LIFE = 0.75;
const FLAME_GLOW = 5;

/** A sports car made from code, facing +x. No model files are downloaded. */
function buildCar() {
  const car = new THREE.Group();

  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xc4511c,
    metalness: 0.25,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.3,
  });
  const trim = new THREE.MeshStandardMaterial({ color: 0x14181a, metalness: 0.4, roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0c1a22,
    metalness: 0.9,
    roughness: 0.06,
    clearcoat: 1,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x8d9396, metalness: 0.9, roughness: 0.42 });

  // Body side profile, including the wheel arches, extruded across the car's width.
  const profile = new THREE.Shape();
  profile.moveTo(-2.25, 0.34);
  profile.lineTo(-2.3, 0.72);
  profile.quadraticCurveTo(-2.28, 0.88, -2.0, 0.9);
  profile.lineTo(-1.1, 0.92);
  profile.lineTo(1.0, 0.88);
  profile.quadraticCurveTo(1.85, 0.8, 2.25, 0.58);
  profile.quadraticCurveTo(2.38, 0.46, 2.3, 0.3);
  profile.lineTo(1.8, 0.26);
  profile.absarc(1.35, 0.3, 0.46, 0, Math.PI, false);
  profile.lineTo(-0.9, 0.26);
  profile.absarc(-1.35, 0.3, 0.46, 0, Math.PI, false);
  profile.lineTo(-2.25, 0.34);

  const bodyWidth = 1.62;
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(profile, {
      depth: bodyWidth,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.06,
      bevelSegments: 4,
      curveSegments: 18,
    }),
    paint,
  );
  body.position.z = -bodyWidth / 2;
  car.add(body);

  // Dark underbody, so that the paint doesn't reflect the sky from below.
  const underbody = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.04, bodyWidth + 0.1), trim);
  underbody.position.set(0, 0.235, 0);
  car.add(underbody);

  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.5, 0.86);
  cabinShape.quadraticCurveTo(-1.0, 1.28, -0.35, 1.32);
  cabinShape.quadraticCurveTo(0.2, 1.33, 0.45, 1.22);
  cabinShape.lineTo(1.18, 0.84);
  cabinShape.lineTo(-1.5, 0.86);

  const cabinWidth = 1.32;
  const cabin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(cabinShape, {
      depth: cabinWidth,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 14,
    }),
    glass,
  );
  cabin.position.z = -cabinWidth / 2;
  car.add(cabin);

  // Roof panel, so the top of the cabin reads as painted rather than all glass.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 1.2), paint);
  roof.position.set(-0.32, 1.37, 0);
  car.add(roof);

  // Racing stripes along the hood.
  for (const z of [-0.2, 0.2]) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.012, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.4 }),
    );
    stripe.position.set(1.62, 0.8, z);
    stripe.rotation.z = -0.24;
    car.add(stripe);
  }

  const halfWidth = bodyWidth / 2 + 0.08;

  // Side skirt.
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.04), trim);
    skirt.position.set(0, 0.28, side * halfWidth);
    car.add(skirt);
  }

  // Headlights and the tail light bar.
  const headlight = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff2c8,
    emissiveIntensity: 4,
  });
  const tailLight = new THREE.MeshStandardMaterial({
    color: 0xff2a1a,
    emissive: 0xff1a0a,
    emissiveIntensity: 4,
  });
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.3), headlight);
    lamp.position.set(2.2, 0.57, side * 0.62);
    lamp.rotation.z = -0.5;
    car.add(lamp);
  }
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 1.6), tailLight);
  tailBar.position.set(-2.36, 0.74, 0);
  car.add(tailBar);

  // Rear wing.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 1.8), trim);
  wing.position.set(-2.0, 1.2, 0);
  wing.rotation.z = 0.1;
  car.add(wing);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.05), trim);
    post.position.set(-1.98, 1.04, side * 0.62);
    car.add(post);
  }

  // Wheels.
  const wheels: THREE.Group[] = [];
  const tyreGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 30);
  const hubGeometry = new THREE.CylinderGeometry(0.23, 0.23, 0.3, 20);
  const spokeGeometry = new THREE.BoxGeometry(0.42, 0.31, 0.05);
  for (const x of [1.35, -1.35]) {
    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.3, side * (bodyWidth / 2 - 0.02));
      const tyre = new THREE.Mesh(tyreGeometry, rubber);
      tyre.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(hubGeometry, rim);
      hub.rotation.x = Math.PI / 2;
      wheel.add(tyre, hub);
      for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(spokeGeometry, rim);
        spoke.rotation.x = Math.PI / 2;
        spoke.rotation.y = (i * Math.PI) / 3;
        wheel.add(spoke);
      }
      wheels.push(wheel);
      car.add(wheel);
    }
  }

  // Twin rocket nozzles, and the flames that come out of them.
  const nozzleGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.42, 22, 1, true);
  const nozzleMaterial = new THREE.MeshStandardMaterial({
    color: 0x53595c,
    metalness: 1,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const outerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6a1a,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const innerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd34d,
    transparent: true,
    depthWrite: false,
  });
  const flames: THREE.Mesh[] = [];
  const nozzles: THREE.Vector3[] = [];

  for (const side of [-1, 1]) {
    const position = new THREE.Vector3(-2.4, 0.52, side * 0.42);
    nozzles.push(position);

    const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.copy(position);
    car.add(nozzle);

    // A cone of height 1 with its base at the origin and its tip pointing to -x.
    const flameGeometry = new THREE.ConeGeometry(0.2, 1, 18);
    flameGeometry.translate(0, 0.5, 0);
    flameGeometry.rotateZ(Math.PI / 2);

    const outer = new THREE.Mesh(flameGeometry, outerFlameMaterial);
    outer.position.set(position.x - 0.18, position.y, position.z);
    const inner = new THREE.Mesh(flameGeometry, innerFlameMaterial);
    inner.position.copy(outer.position);
    inner.renderOrder = 1;
    car.add(outer, inner);
    flames.push(outer, inner);
  }

  const glow = new THREE.PointLight(0xff7a2a, 5, 7);
  glow.position.set(-3, 0.6, 0);
  car.add(glow);

  return { car, wheels, flames, nozzles, tailLight, glow };
}

function makeSoftDot() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Everything the car's animations share: the renderer, lights, the car, its flames
 * and its exhaust trail. Throws if the browser cannot create a WebGL context.
 */
export function createStage(canvas: HTMLCanvasElement, onResize?: () => void) {
  // The buffer is kept so that a finished scene stays on screen without redrawing.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const environment = new THREE.PMREMGenerator(renderer);
  const environmentMap = environment.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = 0.5;

  scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x20261f, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(4, 8, 7);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const parts = buildCar();
  scene.add(parts.car);

  const positions = new Float32Array(MAX_PARTICLES * 3);
  const colors = new Float32Array(MAX_PARTICLES * 4);
  const ages = new Float32Array(MAX_PARTICLES).fill(PARTICLE_LIFE);
  const drift = new Float32Array(MAX_PARTICLES * 3);
  let nextParticle = 0;

  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  const dot = makeSoftDot();
  const trailMaterial = new THREE.PointsMaterial({
    size: 0.8,
    map: dot,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const trail = new THREE.Points(trailGeometry, trailMaterial);
  trail.frustumCulled = false;
  scene.add(trail);

  const worldNozzle = new THREE.Vector3();
  const puffAt = new THREE.Vector3();
  // Where each nozzle was last frame. A fast car moves a long way between frames, so the
  // exhaust is spread along that gap to make one continuous trail.
  const lastNozzles = parts.nozzles.map(() => new THREE.Vector3());
  let hasLastNozzles = false;

  /** Sets the flames and the exhaust for this frame. A throttle of 0 shuts them off. */
  function setThrust(throttle: number) {
    parts.glow.intensity = FLAME_GLOW * throttle;

    for (let i = 0; i < parts.flames.length; i++) {
      const flame = parts.flames[i];
      flame.visible = throttle > 0;
      if (throttle === 0) continue;
      const isInner = i % 2 === 1;
      const flicker = 0.78 + Math.random() * 0.45;
      const length = (isInner ? 1.0 : 1.9) * flicker * throttle;
      const girth = (isInner ? 0.5 : 1) * (0.9 + Math.random() * 0.2);
      flame.scale.set(length, girth, girth);
    }

    if (throttle === 0) {
      hasLastNozzles = false;
      return;
    }
    scene.updateMatrixWorld();
    const puffs = Math.ceil(10 * throttle);
    for (let n = 0; n < parts.nozzles.length; n++) {
      const nozzle = parts.nozzles[n];
      worldNozzle.set(nozzle.x - 0.5, nozzle.y, nozzle.z);
      parts.car.localToWorld(worldNozzle);
      if (!hasLastNozzles) lastNozzles[n].copy(worldNozzle);

      for (let i = 0; i < puffs; i++) {
        puffAt.lerpVectors(lastNozzles[n], worldNozzle, Math.random());
        const index = nextParticle;
        nextParticle = (nextParticle + 1) % MAX_PARTICLES;
        positions.set([puffAt.x, puffAt.y, puffAt.z], index * 3);
        drift.set(
          [(Math.random() - 0.5) * 1.1, (Math.random() - 0.3) * 1.1, (Math.random() - 0.5) * 1.1],
          index * 3,
        );
        ages[index] = 0;
      }
      lastNozzles[n].copy(worldNozzle);
    }
    hasLastNozzles = true;
  }

  function updateTrail(delta: number) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (ages[i] >= PARTICLE_LIFE) {
        colors[i * 4 + 3] = 0;
        continue;
      }
      ages[i] += delta;
      const life = Math.min(ages[i] / PARTICLE_LIFE, 1);
      positions[i * 3] += drift[i * 3] * delta;
      positions[i * 3 + 1] += drift[i * 3 + 1] * delta;
      positions[i * 3 + 2] += drift[i * 3 + 2] * delta;
      // White-hot, then orange, then fading smoke.
      const smoke = Math.max(0, (life - 0.4) / 0.6);
      colors[i * 4] = 0.98 - smoke * 0.58;
      colors[i * 4 + 1] = (life < 0.2 ? 0.62 : 0.34) * (1 - smoke) + 0.4 * smoke;
      colors[i * 4 + 2] = 0.05 * (1 - smoke) + 0.38 * smoke;
      colors[i * 4 + 3] = (1 - life) ** 1.1;
    }
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
  }

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    onResize?.();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    dot.dispose();
    environmentMap.dispose();
    environment.dispose();
    renderer.dispose();
  }

  return {
    ...parts,
    renderer,
    scene,
    camera,
    trailMaterial,
    setThrust,
    updateTrail,
    render: () => renderer.render(scene, camera),
    dispose,
  };
}

/** A frame's time step, in seconds. See the note in each animation loop. */
export function frameStep(now: number, previous: number) {
  // A frame's timestamp can be slightly earlier than the moment the scene was set up,
  // so never step backwards. The upper limit stops a slow frame or a hidden tab
  // from making the car jump.
  return Math.min(Math.max((now - previous) / 1000, 0), 0.1);
}
