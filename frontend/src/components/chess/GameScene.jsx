import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import ChessBoard3D from './ChessBoard3D';
import ChessPiece3D from './ChessPiece3D';
import useGameStore from '../../store/gameStore';

function parseFen(fen) {
  const [placement] = fen.split(' ');
  const pieces = [];
  const ranks = placement.split('/');

  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of ranks[rank]) {
      if (isNaN(char)) {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase();
        pieces.push({
          type,
          color,
          position: [file - 3.5, 0.06, 3.5 - rank],
          square: `${String.fromCharCode(97 + file)}${8 - rank}`,
        });
        file++;
      } else {
        file += parseInt(char);
      }
    }
  }
  return pieces;
}

function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(7, 7, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function SceneLighting() {
  return (
    <>
      {/* Key light */}
      <directionalLight
        position={[8, 12, 4]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      {/* Fill light */}
      <directionalLight
        position={[-4, 6, -4]}
        intensity={0.3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Back/rim light */}
      <spotLight
        position={[0, 8, -10]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.4}
        castShadow
      />
      {/* Ambient */}
      <ambientLight intensity={0.35} />
      {/* Under-glow */}
      <pointLight position={[0, -0.3, 0]} intensity={0.15} color="#f59e0b" />
    </>
  );
}

function FloatingParticles() {
  const particlesRef = useRef([]);
  const count = 25;

  if (particlesRef.current.length === 0) {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 8 + 1,
          (Math.random() - 0.5) * 12
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          Math.random() * 0.005 + 0.002,
          (Math.random() - 0.5) * 0.003
        ),
        size: Math.random() * 0.025 + 0.008,
      });
    }
  }

  useFrame(() => {
    particlesRef.current.forEach((p) => {
      p.position.y += p.velocity.y;
      p.position.x += p.velocity.x;
      p.position.z += p.velocity.z;
      if (p.position.y > 8) p.position.y = 1;
      if (Math.abs(p.position.x) > 6) p.velocity.x *= -1;
      if (Math.abs(p.position.z) > 6) p.velocity.z *= -1;
    });
  });

  return (
    <>
      {particlesRef.current.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  );
}

export default function GameScene({ onSquareClick }) {
  const { fen, moves } = useGameStore();

  const pieces = parseFen(fen);

  // Determine which pieces are moving (for animation)
  const lastMove = moves[moves.length - 1];

  return (
    <div className="w-full h-[calc(100vh-10rem)] min-h-[500px] rounded-2xl overflow-hidden glass border border-slate-700/30">
      <Canvas
        shadows
        gl={{ antialias: true }}
        onPointerMissed={() => onSquareClick(null)}
      >
        <PerspectiveCamera makeDefault position={[7, 7, 7]} fov={45} />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />

        <SceneLighting />
        <FloatingParticles />
        <Stars radius={30} depth={50} count={200} factor={3} saturation={0} fade speed={0.3} />
        <Environment files="/hdri/dikhololo_night_1k.hdr" />
        <fog attach="fog" args={['#0f172a', 10, 35]} />

        {/* Ground plane for shadow */}
        <mesh
          position={[0, -0.3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <shadowMaterial transparent opacity={0.15} />
        </mesh>

        <ChessBoard3D onSquareClick={onSquareClick} />

        {pieces.map((piece, i) => (
          <ChessPiece3D
            key={`${piece.square}-${piece.type}-${piece.color}`}
            piece={piece}
            position={piece.position}
            isMoving={lastMove && (piece.square === lastMove.to)}
            isCaptured={false}
          />
        ))}
      </Canvas>
    </div>
  );
}
