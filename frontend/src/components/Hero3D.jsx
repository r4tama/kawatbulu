import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * KeychainMesh — placeholder 3D object yang merepresentasikan keychain kawat bulu:
 * sebuah "tag" pipih (mirip plat gantungan kunci) + beberapa "lilitan kawat"
 * berbentuk torus kecil yang melingkar di sekitarnya untuk mengisyaratkan
 * tekstur chenille/pipe cleaner tanpa perlu model 3D custom (GLTF) di awal.
 *
 * Nanti file ini gampang di-upgrade: tinggal ganti isi <group> dengan
 * <primitive object={gltf.scene} /> hasil useGLTF() kalau sudah ada
 * model .glb keychain beneran.
 */
function KeychainMesh({ mouse }) {
  const groupRef = useRef();
  const ringRef = useRef();

  // Warna-warna chenille yang cerah, konsisten dengan palet brand
  const colors = useMemo(
    () => ["#FF3B6E", "#F6C453", "#7CE0C6", "#7C7CE0"],
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating idle animation (naik-turun halus)
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.15;

    // Parallax mengikuti posisi mouse — di-lerp supaya gerakannya smooth,
    // bukan langsung "nempel" ke posisi kursor (terasa lebih premium/organik).
    const targetRotX = mouse.current.y * 0.3;
    const targetRotY = mouse.current.x * 0.4;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.05
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY + t * 0.15, // + auto-rotate pelan biar tetap "hidup" walau mouse diam
      0.05
    );

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Plat/tag utama keychain */}
      <RoundedBox args={[1.2, 1.6, 0.15]} radius={0.15} smoothness={4} castShadow>
        <meshStandardMaterial color="#1c1824" metalness={0.3} roughness={0.4} />
      </RoundedBox>

      {/* Lilitan kawat bulu berwarna-warni mengelilingi tag */}
      <group ref={ringRef}>
        {colors.map((color, i) => (
          <mesh
            key={color}
            position={[
              Math.cos((i / colors.length) * Math.PI * 2) * 1.1,
              Math.sin((i / colors.length) * Math.PI * 2) * 1.1,
              0,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <torusGeometry args={[0.22, 0.06, 12, 24]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Ring gantungan kunci di atas */}
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.035, 12, 32]} />
        <meshStandardMaterial color="#C9C2D6" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Tracker posisi mouse dinormalisasi ke [-1, 1], di-update tiap pointermove */
function MouseTracker({ mouse }) {
  const { size } = useThree();
  return (
    <mesh
      visible={false}
      onPointerMove={(e) => {
        mouse.current.x = (e.clientX / size.width) * 2 - 1;
        mouse.current.y = -((e.clientY / size.height) * 2 - 1);
      }}
      position={[0, 0, -5]}
    >
      <planeGeometry args={[100, 100]} />
    </mesh>
  );
}

export default function Hero3D() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -((e.clientY / window.innerHeight) * 2 - 1);
        mouse.current.x = x;
        mouse.current.y = y;
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 40 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 4, 2]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, -2, -2]} intensity={0.5} color="#FF3B6E" />

        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
            <KeychainMesh mouse={mouse} />
          </Float>
          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.5}
            scale={6}
            blur={2.5}
            far={2}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
