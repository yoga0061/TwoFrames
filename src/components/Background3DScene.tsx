"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sparkles } from "@react-three/drei";
import { Shape, IcosahedronGeometry, TorusGeometry, OctahedronGeometry, MeshStandardMaterial, ExtrudeGeometry } from "three";
import type { Mesh } from "three";

// Shared geometries cached at module level to prevent GPU memory allocation overhead
let sharedIcosahedron: IcosahedronGeometry | null = null;
let sharedTorus: TorusGeometry | null = null;
let sharedOctahedron: OctahedronGeometry | null = null;

const getIcosahedron = () => {
  if (typeof window === "undefined") return null;
  if (!sharedIcosahedron) sharedIcosahedron = new IcosahedronGeometry(1, 1);
  return sharedIcosahedron;
};

const getTorus = () => {
  if (typeof window === "undefined") return null;
  if (!sharedTorus) sharedTorus = new TorusGeometry(1, 0.35, 16, 48);
  return sharedTorus;
};

const getOctahedron = () => {
  if (typeof window === "undefined") return null;
  if (!sharedOctahedron) sharedOctahedron = new OctahedronGeometry(1, 0);
  return sharedOctahedron;
};

function FloatingShape({
  position,
  color,
  scale,
  geometry,
  isLateNight,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  geometry: "icosahedron" | "torus" | "octahedron";
  isLateNight: boolean;
}) {
  const ref = useRef<Mesh>(null);

  const geom = useMemo(() => {
    if (geometry === "icosahedron") return getIcosahedron();
    if (geometry === "torus") return getTorus();
    if (geometry === "octahedron") return getOctahedron();
    return null;
  }, [geometry]);

  const material = useMemo(() => {
    return new MeshStandardMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: isLateNight ? 0.12 : 0.22,
      emissive: color,
      emissiveIntensity: isLateNight ? 0.08 : 0.15,
    });
  }, [color, isLateNight]);

  useFrame((state) => {
    if (!ref.current) return;
    const speedMult = isLateNight ? 0.4 : 1.0;
    ref.current.rotation.x = state.clock.elapsedTime * 0.06 * speedMult;
    ref.current.rotation.y = state.clock.elapsedTime * 0.08 * speedMult;
  });

  return (
    <Float speed={isLateNight ? 0.5 : 1.2} rotationIntensity={0.2} floatIntensity={isLateNight ? 0.4 : 1.0}>
      <mesh
        ref={ref}
        position={position}
        scale={scale}
        geometry={geom ?? undefined}
        material={material}
      />
    </Float>
  );
}

function HeartShape({
  position,
  isLateNight,
}: {
  position: [number, number, number];
  isLateNight: boolean;
}) {
  const ref = useRef<Mesh>(null);

  const heartGeom = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0.4);
    s.bezierCurveTo(0.3, 0.8, 0.8, 0.5, 0.8, 0);
    s.bezierCurveTo(0.8, -0.4, 0.4, -0.7, 0, -1);
    s.bezierCurveTo(-0.4, -0.7, -0.8, -0.4, -0.8, 0);
    s.bezierCurveTo(-0.8, 0.5, -0.3, 0.8, 0, 0.4);

    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };
    return new ExtrudeGeometry(s, extrudeSettings);
  }, []);

  const material = useMemo(() => {
    const color = isLateNight ? "#818cf8" : "#fb7185";
    return new MeshStandardMaterial({
      color,
      transparent: true,
      opacity: isLateNight ? 0.2 : 0.35,
      emissive: color,
      emissiveIntensity: isLateNight ? 0.15 : 0.3,
      roughness: 0.2,
      metalness: 0.1,
    });
  }, [isLateNight]);

  const [speed] = useState(() => Math.random() * 0.15 + 0.05);
  const [xOffset] = useState(() => Math.random() * 2 * Math.PI);
  const driftY = useRef(position[1]);

  useFrame((state) => {
    if (!ref.current) return;
    
    // Rotate slowly
    ref.current.rotation.y = state.clock.elapsedTime * (isLateNight ? 0.15 : 0.3);
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;

    // Drifting upward motion
    driftY.current += (isLateNight ? speed * 0.5 : speed) * 0.012;
    if (driftY.current > 6) {
      driftY.current = -6; // Reset below the screen
    }
    
    ref.current.position.y = driftY.current;
    ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.5 + xOffset) * 0.4;
  });

  return (
    <Float speed={isLateNight ? 0.6 : 1.5} floatIntensity={0.6}>
      <mesh
        ref={ref}
        position={position}
        scale={0.4}
        geometry={heartGeom}
        material={material}
      />
    </Float>
  );
}

interface Background3DSceneProps {
  isLateNight?: boolean;
}

export default function Background3DScene({ isLateNight = false }: Background3DSceneProps) {
  const bgTheme = isLateNight ? "#050208" : "#0f0a1a";
  const lightColor1 = isLateNight ? "#93c5fd" : "#f472b6"; // moonlight blue vs pink glow
  const lightColor2 = isLateNight ? "#818cf8" : "#a78bfa"; // evening indigo vs purple glow

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={[bgTheme]} />
      <fog attach="fog" args={[bgTheme, 6, 22]} />
      <ambientLight intensity={isLateNight ? 0.18 : 0.3} />
      <pointLight position={[8, 6, 8]} intensity={isLateNight ? 0.35 : 0.8} color={lightColor1} />
      <pointLight position={[-6, -4, 4]} intensity={isLateNight ? 0.25 : 0.6} color={lightColor2} />

      <Stars
        radius={60}
        depth={40}
        count={isLateNight ? 1000 : 1800}
        factor={isLateNight ? 2.5 : 3.5}
        saturation={0.4}
        fade
        speed={isLateNight ? 0.2 : 0.6}
      />
      
      {/* Drifting sparkles */}
      <Sparkles
        count={isLateNight ? 25 : 50}
        scale={10}
        size={isLateNight ? 1.2 : 1.8}
        speed={isLateNight ? 0.12 : 0.3}
        color={lightColor1}
        opacity={isLateNight ? 0.25 : 0.4}
      />
      <Sparkles
        count={isLateNight ? 25 : 50}
        scale={10}
        size={isLateNight ? 1.5 : 2.2}
        speed={isLateNight ? 0.1 : 0.25}
        color={lightColor2}
        opacity={isLateNight ? 0.2 : 0.35}
      />

      {/* Floating abstract wireframes */}
      <FloatingShape position={[-3.5, 1.5, -2]} color={isLateNight ? "#818cf8" : "#f472b6"} scale={1.1} geometry="icosahedron" isLateNight={isLateNight} />
      <FloatingShape position={[3.8, -1, -3]} color={isLateNight ? "#3b82f6" : "#a78bfa"} scale={0.9} geometry="torus" isLateNight={isLateNight} />
      <FloatingShape position={[0, 2.5, -4]} color={isLateNight ? "#4f46e5" : "#fb7185"} scale={0.75} geometry="octahedron" isLateNight={isLateNight} />
      <FloatingShape position={[-2, -2.5, -1]} color={isLateNight ? "#6366f1" : "#ec4899"} scale={0.65} geometry="torus" isLateNight={isLateNight} />
      <FloatingShape position={[4, 2, -5]} color={isLateNight ? "#4f46e5" : "#c084fc"} scale={0.55} geometry="icosahedron" isLateNight={isLateNight} />

      {/* Floating and drifting heart particles */}
      <HeartShape position={[-2, -3, -2]} isLateNight={isLateNight} />
      <HeartShape position={[2, -1, -3]} isLateNight={isLateNight} />
      <HeartShape position={[0.5, -5, -4]} isLateNight={isLateNight} />
      <HeartShape position={[-3.5, 2, -3]} isLateNight={isLateNight} />
      <HeartShape position={[3, 3, -2]} isLateNight={isLateNight} />
    </Canvas>
  );
}
