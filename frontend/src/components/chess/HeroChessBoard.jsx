import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Float, Stars } from '@react-three/drei';

function RotatingChessBoard() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[5, 0.25, 5]} />
          <meshStandardMaterial color="#4a3728" roughness={0.7} metalness={0.1} />
        </mesh>
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const x = col - 3.5;
            const z = row - 3.5;
            const isDark = (row + col) % 2 === 1;
            return (
              <mesh key={`${row}-${col}`} position={[x, 0, z]} castShadow receiveShadow>
                <boxGeometry args={[1, 0.02, 1]} />
                <meshStandardMaterial color={isDark ? '#4a3728' : '#e8d5b7'} roughness={0.5} metalness={0.05} />
              </mesh>
            );
          })
        )}
        {[
          [0, 3.75], [0, -3.75], [3.75, 0], [-3.75, 0],
        ].map(([x, z], i) => (
          <mesh key={`edge-${i}`} position={[x, 0.03, z]} castShadow>
            <boxGeometry args={Math.abs(x) > Math.abs(z) ? [0.2, 0.06, 8] : [8, 0.06, 0.2]} />
            <meshStandardMaterial color="#c4a44a" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
        {[
          [-4, -4], [-4, 4], [4, -4], [4, 4],
        ].map(([cx, cz], i) => (
          <mesh key={`corner-${i}`} position={[cx, 0.3, cz]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.7, 16]} />
            <meshStandardMaterial color="#c4a44a" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function ParticleDot({ x, y, z, speed, size }) {
  const [posY, setPosY] = useState(y);
  useFrame(() => {
    setPosY((prev) => {
      const next = prev + speed;
      return next > 10 ? 2 : next;
    });
  });
  return (
    <mesh position={[x, posY, z]}>
      <sphereGeometry args={[size, 4, 4]} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
    </mesh>
  );
}

function Particles() {
  const particles = Array.from({ length: 30 }).map(() => ({
    x: (Math.random() - 0.5) * 20,
    y: Math.random() * 10 + 2,
    z: (Math.random() - 0.5) * 20,
    speed: Math.random() * 0.01 + 0.005,
    size: Math.random() * 0.03 + 0.01,
  }));
  return (
    <>
      {particles.map((p, i) => (
        <ParticleDot key={i} {...p} />
      ))}
    </>
  );
}

export default function HeroChessBoard() {
  return (
    <>
      <RotatingChessBoard />
      <Particles />
      <Stars radius={30} depth={50} count={300} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="night" />
    </>
  );
}
