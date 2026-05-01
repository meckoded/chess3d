import { useRef, useMemo } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PIECE_HEIGHT = 0.7;
const WHITE_MATERIAL = { color: '#f5f0e8', roughness: 0.35, metalness: 0.05 };
const BLACK_MATERIAL = { color: '#1a1a2e', roughness: 0.3, metalness: 0.15 };
const ACCENT_WHITE = { color: '#d4c5a9', roughness: 0.3, metalness: 0.1 };
const ACCENT_BLACK = { color: '#2d2d44', roughness: 0.25, metalness: 0.2 };

function createKingGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.16, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Stepped base ring */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <torusGeometry args={[0.25, 0.04, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Body — tapered cylinder */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Upper ring */}
      <mesh position={[0, 0.53, 0]} castShadow>
        <torusGeometry args={[0.2, 0.035, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.12, 16]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Crown — cross */}
      <group position={[0, 0.7, 0]}>
        {/* Crown base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.1, 0.08, 32]} />
          <meshStandardMaterial roughness={0.15} metalness={0.5} />
        </mesh>
        {/* Crown points */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh
            key={`crown-${i}`}
            position={[
              Math.cos(angle) * 0.1,
              0.07,
              Math.sin(angle) * 0.1,
            ]}
            castShadow
          >
            <boxGeometry args={[0.04, 0.1, 0.04]} />
            <meshStandardMaterial roughness={0.15} metalness={0.5} />
          </mesh>
        ))}
        {/* Top cross */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
          <meshStandardMaterial roughness={0.15} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.19, 0]} castShadow>
          <boxGeometry args={[0.08, 0.025, 0.03]} />
          <meshStandardMaterial roughness={0.15} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function createQueenGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.16, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Ring */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <torusGeometry args={[0.25, 0.04, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.4, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Upper ring */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <torusGeometry args={[0.19, 0.03, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.12, 16]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Crown — pointed */}
      <group position={[0, 0.75, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.11, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
          <meshStandardMaterial roughness={0.15} metalness={0.5} />
        </mesh>
        {/* Spikes */}
        {[0, (2 * Math.PI) / 5, (4 * Math.PI) / 5, (6 * Math.PI) / 5, (8 * Math.PI) / 5].map(
          (angle, i) => (
            <mesh
              key={`spike-${i}`}
              position={[
                Math.cos(angle) * 0.08,
                0.08,
                Math.sin(angle) * 0.08,
              ]}
              castShadow
            >
              <coneGeometry args={[0.025, 0.12, 8]} />
              <meshStandardMaterial roughness={0.15} metalness={0.5} />
            </mesh>
          )
        )}
        {/* Center spike */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <coneGeometry args={[0.03, 0.14, 8]} />
          <meshStandardMaterial roughness={0.15} metalness={0.5} />
        </mesh>
        {/* Ball on top */}
        <mesh position={[0, 0.23, 0]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial roughness={0.1} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function createRookGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.16, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Ring */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <torusGeometry args={[0.25, 0.04, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Body — slightly bulbous */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.22, 0.4, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Upper ring */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <torusGeometry args={[0.2, 0.04, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Tower top */}
      <mesh position={[0, 0.67, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 0.14, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Battlements */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={`batt-${i}`} position={[0, 0.76, 0]}>
          <mesh
            position={[Math.cos(angle) * 0.1, 0, Math.sin(angle) * 0.1]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.14, 0.06]} />
            <meshStandardMaterial {...color} />
          </mesh>
        </group>
      ))}
      {/* Top rim */}
      <mesh position={[0, 0.84, 0]} castShadow>
        <torusGeometry args={[0.16, 0.025, 8, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
    </group>
  );
}

function createBishopGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.26, 0.16, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Ring */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <torusGeometry args={[0.24, 0.04, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Body — cone-like */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.2, 0.45, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Collar ring */}
      <mesh position={[0, 0.63, 0]} castShadow>
        <torusGeometry args={[0.11, 0.03, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Mitre — pointed hat */}
      <group position={[0, 0.68, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.09, 0.2, 32]} />
          <meshStandardMaterial {...color} />
        </mesh>
        {/* Ball top */}
        <mesh position={[0, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial roughness={0.1} metalness={0.6} />
        </mesh>
      </group>
      {/* Slit in mitre */}
      <mesh position={[0.045, 0.72, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.02, 0.16, 0.15]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function createKnightGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.25, 0.16, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Neck — forward curve */}
      <mesh position={[0.05, 0.28, 0.06]} rotation={[0.4, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.35, 16]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Horse head */}
      <group position={[0.12, 0.52, 0.13]}>
        {/* Main head shape */}
        <mesh rotation={[-0.2, 0, 0.1]} castShadow>
          <boxGeometry args={[0.2, 0.22, 0.16]} />
          <meshStandardMaterial {...color} />
        </mesh>
        {/* Snout */}
        <mesh position={[0.1, -0.05, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.12, 0.12]} />
          <meshStandardMaterial {...color} />
        </mesh>
        {/* Ears */}
        <mesh position={[0.0, 0.12, -0.04]} rotation={[0.2, 0, 0.15]} castShadow>
          <coneGeometry args={[0.04, 0.08, 8]} />
          <meshStandardMaterial {...color} />
        </mesh>
        <mesh position={[0.05, 0.12, -0.04]} rotation={[0.2, 0, -0.15]} castShadow>
          <coneGeometry args={[0.04, 0.08, 8]} />
          <meshStandardMaterial {...color} />
        </mesh>
        {/* Mane */}
        <mesh position={[0.04, 0.08, -0.08]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.09]} />
          <meshStandardMaterial {...color} />
        </mesh>
      </group>
    </group>
  );
}

function createPawnGeometry(color) {
  return (
    <group scale={[0.85, 1, 0.85]}>
      {/* Base */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.12, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 0.28, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.37, 0]} castShadow>
        <torusGeometry args={[0.11, 0.025, 16, 32]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Head — sphere */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial {...color} />
      </mesh>
    </group>
  );
}

const PIECE_GEOMETRIES = {
  k: createKingGeometry,
  q: createQueenGeometry,
  r: createRookGeometry,
  b: createBishopGeometry,
  n: createKnightGeometry,
  p: createPawnGeometry,
};

export default function ChessPiece3D({ piece, position, isMoving, isCaptured }) {
  const groupRef = useRef();
  const liftAmount = piece.color === 'w' ? 0.1 : 0.1;

  const isWhite = piece.color === 'w';
  const material = isWhite ? WHITE_MATERIAL : BLACK_MATERIAL;

  const { posY, scale } = useSpring({
    posY: isMoving ? position[1] + 1.0 : position[1],
    scale: isCaptured ? 0 : 1,
    config: { mass: 0.5, tension: 300, friction: 20 },
  });

  // Compute continuous position
  useFrame(() => {
    if (groupRef.current) {
      const springPos = posY.get();
      const s = scale.get();
      groupRef.current.position.set(position[0], springPos, position[2]);
      groupRef.current.scale.setScalar(s);
    }
  });

  const geometryCreator = PIECE_GEOMETRIES[piece.type];

  return (
    <animated.group ref={groupRef}>
      {geometryCreator(material)}
      {/* Shadow on piece base */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[0.24, 0.3, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
    </animated.group>
  );
}
