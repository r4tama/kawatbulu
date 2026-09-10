import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * PipeCleanerWire3D
 * ------------------
 * Kawat bulu (chenille stem) prosedural yang dibangun dari TubeGeometry +
 * CatmullRomCurve3, di-drive sepenuhnya oleh `progressRef` (0 -> 1) yang
 * dikirim dari <ScrollArticle> — sama seperti pola <SyncedModel> lama,
 * dibaca tiap frame lewat useFrame, TANPA memicu re-render React.
 *
 * 4 fase mengikuti 4 STEPS di ScrollArticle (masing-masing dapat jatah
 * scroll 0.25 dari progress global):
 *  - Step 1 (0.00–0.25) Bahan Kawat      -> kawat lurus, melayang idle
 *  - Step 2 (0.25–0.50) Pembentukan      -> menekuk & melilit jadi spiral
 *  - Step 3 (0.50–0.75) Detail/Aksesoris -> ring gantungan kunci "klik" masuk
 *  - Step 4 (0.75–1.00) Hasil Jadi       -> muter 360° penuh
 */

// Palet warna chenille brand — dipakai sebagai vertex color gradient di
// sepanjang tube, jadi kawatnya kelihatan "dipilin" dari beberapa warna,
// bukan solid satu warna flat.
const CHENILLE_PALETTE = ["#FF3B6E", "#F6C453", "#7CE0C6", "#7C7CE0"];

const WIRE_LENGTH = 3.2;
const CURVE_SAMPLES = 48;
const TUBULAR_SEGMENTS = 64;
const RADIAL_SEGMENTS = 10;
const TUBE_RADIUS = 0.085;
const SPIRAL_TURNS = 2.4;
const SPIRAL_RADIUS = 0.62;

const STEP_COUNT = 4;
const GEOMETRY_REBUILD_THRESHOLD = 0.004; // hemat GC: rebuild cuma kalau bend berubah cukup jauh

// Helper reusable (module-level) biar tidak alokasi objek baru tiap frame
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const tmpQuat = new THREE.Quaternion();
const tmpTangent = new THREE.Vector3();

/** Progress lokal (0-1) di dalam satu step tertentu, dari progress global 0-1 */
function localStepProgress(globalProgress, stepIndex) {
  const segment = 1 / STEP_COUNT;
  const local = (globalProgress - stepIndex * segment) / segment;
  return THREE.MathUtils.clamp(local, 0, 1);
}

/** Noise kecil per-titik (seeded & konstan) biar kawat nggak kelihatan
 *  terlalu "sempurna" secara geometris — meniru kelenturan chenille asli. */
function seededJitter(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Bangun titik-titik kawat untuk suatu `bend` (0 = lurus penuh,
 * 1 = melingkar/spiral penuh). Titik u=0 sengaja "diredam" pergerakannya
 * (anchorEase) supaya jadi titik jangkar yang cukup stabil buat ring
 * gantungan kunci nempel di step 3.
 */
function buildWirePoints(bend) {
  const points = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const u = i / CURVE_SAMPLES;

    // --- Target "lurus" (Step 1) ---
    const straightX = 0;
    const straightY = (0.5 - u) * WIRE_LENGTH;
    const straightZ = 0;

    // --- Target "melingkar / spiral" (Step 2+) ---
    const angle = u * Math.PI * 2 * SPIRAL_TURNS;
    const taper = 1 - u * 0.35;
    const anchorEase = Math.min(1, u * 6);
    const radius = SPIRAL_RADIUS * taper * anchorEase;
    const spiralX = Math.cos(angle) * radius;
    const spiralY = 0.9 - u * 1.7;
    const spiralZ = Math.sin(angle) * radius * 0.55; // sedikit dipipihkan biar charm-like

    // Jitter halus khas serat chenille
    const jitter = (seededJitter(i) - 0.5) * 0.035;

    const x = THREE.MathUtils.lerp(straightX, spiralX, bend) + jitter;
    const y = THREE.MathUtils.lerp(straightY, spiralY, bend);
    const z = THREE.MathUtils.lerp(straightZ, spiralZ, bend) + jitter * 0.6;

    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

/** Gradient vertex-color sepanjang tube mengikuti CHENILLE_PALETTE, supaya
 *  materialnya vibrant multi-warna seperti batang chenille asli. */
function applyChenilleVertexColors(geometry) {
  const colorObjs = CHENILLE_PALETTE.map((hex) => new THREE.Color(hex));
  const posAttr = geometry.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  // TubeGeometry menyusun vertex per "ring" sepanjang tubularSegments+1,
  // masing-masing ring punya radialSegments+1 vertex.
  const ringCount = TUBULAR_SEGMENTS + 1;
  const vertsPerRing = posAttr.count / ringCount;

  for (let ring = 0; ring < ringCount; ring++) {
    const u = ring / (ringCount - 1);
    const scaled = u * (colorObjs.length - 1);
    const idx = Math.min(colorObjs.length - 2, Math.floor(scaled));
    const t = scaled - idx;
    const c = colorObjs[idx].clone().lerp(colorObjs[idx + 1], t);

    for (let v = 0; v < vertsPerRing; v++) {
      const vertexIndex = ring * vertsPerRing + v;
      colors[vertexIndex * 3] = c.r;
      colors[vertexIndex * 3 + 1] = c.g;
      colors[vertexIndex * 3 + 2] = c.b;
    }
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function buildTubeGeometry(bend) {
  const points = buildWirePoints(bend);
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const geometry = new THREE.TubeGeometry(
    curve,
    TUBULAR_SEGMENTS,
    TUBE_RADIUS,
    RADIAL_SEGMENTS,
    false
  );
  applyChenilleVertexColors(geometry);
  return { geometry, curve };
}

/** Canvas noise -> dipakai sebagai bump map supaya permukaan tube kelihatan
 *  "berbulu"/fuzzy (khas chenille), bukan plastik mengkilap. */
function useFuzzyBumpTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = 150 + Math.random() * 105;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 4);
    return texture;
  }, []);
}

/** Ring gantungan kunci metal — nempel & mengikuti ujung atas kawat (u=0),
 *  muncul dengan efek "pop-in" begitu masuk Step 3. */
function KeyringMesh({ curveRef, ringProgressRef }) {
  const ringGroupRef = useRef();

  useFrame(() => {
    const curve = curveRef.current;
    const group = ringGroupRef.current;
    if (!curve || !group) return;

    const p = ringProgressRef.current;
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic, berasa "klik" masuk
    group.scale.setScalar(eased);
    group.visible = p > 0.001;

    const anchor = curve.getPoint(0);
    tmpTangent.copy(curve.getTangent(0)).normalize();
    group.position.copy(anchor).addScaledVector(tmpTangent, 0.14);

    tmpQuat.setFromUnitVectors(UP_AXIS, tmpTangent);
    group.quaternion.slerp(tmpQuat, 0.25);
  });

  return (
    <group ref={ringGroupRef} scale={0}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.16, 0.028, 12, 32]} />
        <meshStandardMaterial color="#D8D2E8" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function PipeCleanerWire3D({ progressRef }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const curveRef = useRef(null);
  const ringProgressRef = useRef(0);
  const lastBendRef = useRef(-1);
  const bumpMap = useFuzzyBumpTexture();

  // Geometry awal (lurus, bend=0) biar frame pertama tidak "pop" kosong
  const initial = useMemo(() => buildTubeGeometry(0), []);
  curveRef.current = initial.curve;

  useFrame((state) => {
    const p = progressRef.current ?? 0;
    const t = state.clock.getElapsedTime();

    const bend = localStepProgress(p, 1); // menekuk selama Step 2
    ringProgressRef.current = localStepProgress(p, 2); // ring muncul di Step 3
    const spin = localStepProgress(p, 3); // rotasi penuh di Step 4

    // Rebuild geometry TubeGeometry cuma kalau bend berubah cukup jauh —
    // recompute penuh tiap frame walau scroll diam itu sia-sia.
    if (
      Math.abs(bend - lastBendRef.current) > GEOMETRY_REBUILD_THRESHOLD &&
      meshRef.current
    ) {
      lastBendRef.current = bend;
      const { geometry, curve } = buildTubeGeometry(bend);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geometry;
      curveRef.current = curve;
    }

    if (groupRef.current) {
      // Idle float halus biar kawat tetap "hidup" walau scroll diam
      // (makin ditekuk, makin diredam biar tidak "goyang" pas jadi bentuk final)
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.06 * (1 - bend * 0.5);
      groupRef.current.position.x = Math.cos(t * 0.4) * 0.03;

      // Rotasi 360° penuh di Step 4 + sedikit ambient sway sebelum itu
      const ambientSway = (1 - spin) * Math.sin(t * 0.3) * 0.15;
      groupRef.current.rotation.y = spin * Math.PI * 2 + ambientSway;
      groupRef.current.rotation.x = bend * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={initial.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          metalness={0.05}
          bumpMap={bumpMap}
          bumpScale={0.045}
        />
      </mesh>
      <KeyringMesh curveRef={curveRef} ringProgressRef={ringProgressRef} />
    </group>
  );
}
