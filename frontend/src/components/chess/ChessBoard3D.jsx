import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import useGameStore from '../../store/gameStore';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function ChessBoard3D({ onSquareClick }) {
  const boardRef = useRef();
  const { legalMoves, selectedSquare } = useGameStore();

  const lightColor = '#e8d5b7';
  const darkColor = '#6b4c3b';
  const highlightColor = 'rgba(245, 158, 11, 0.5)';
  const selectedColor = 'rgba(34, 211, 238, 0.5)';

  const squares = useMemo(() => {
    const result = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isDark = (rank + file) % 2 === 1;
        const squareKey = `${FILES[file]}${RANKS[7 - rank]}`;
        const isLegalTarget = legalMoves.some(
          (m) => m.to === squareKey
        );
        const isSelected = selectedSquare === squareKey;

        result.push({
          key: squareKey,
          position: [file - 3.5, 0, rank - 3.5],
          color: isSelected
            ? selectedColor
            : isLegalTarget
            ? highlightColor
            : isDark
            ? darkColor
            : lightColor,
          isDarkBase: isDark,
        });
      }
    }
    return result;
  }, [legalMoves, selectedSquare]);

  return (
    <group ref={boardRef}>
      {/* Board base — wooden frame */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[8.8, 0.18, 8.8]} />
        <meshStandardMaterial
          color="#3a2518"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Individual squares */}
      {squares.map(({ key, position, color, isDarkBase }) => (
        <mesh
          key={key}
          position={position}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSquareClick?.(key);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[1, 0.04, 1]} />
          <meshStandardMaterial
            color={isDarkBase ? darkColor : lightColor}
            roughness={0.4}
            metalness={0.05}
            transparent={isDarkBase ? undefined : color === highlightColor || color === selectedColor}
            opacity={
              color === highlightColor
                ? 0.35
                : color === selectedColor
                ? 0.4
                : undefined
            }
          />
          {/* Highlight overlay for legal moves */}
          {(color === highlightColor || color === selectedColor) && (
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[1, 0.01, 1]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.85}
              />
            </mesh>
          )}
        </mesh>
      ))}

      {/* File labels (a-h) */}
      {FILES.map((file, i) => (
        <Text
          key={`file-${file}`}
          position={[i - 3.5, -0.05, 4.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.35}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {file}
        </Text>
      ))}

      {/* Rank labels (1-8) */}
      {RANKS.map((rank, i) => (
        <Text
          key={`rank-${rank}`}
          position={[-4.2, -0.05, 3.5 - i]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={0.35}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {rank}
        </Text>
      ))}

      {/* Frame border — brass trim */}
      {[
        { pos: [0, -0.005, 4.1], size: [8.4, 0.06, 0.15] },
        { pos: [0, -0.005, -4.1], size: [8.4, 0.06, 0.15] },
        { pos: [4.1, -0.005, 0], size: [0.15, 0.06, 8.4] },
        { pos: [-4.1, -0.005, 0], size: [0.15, 0.06, 8.4] },
      ].map(({ pos, size }, i) => (
        <mesh key={`trim-${i}`} position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color="#c4a44a"
            roughness={0.25}
            metalness={0.65}
          />
        </mesh>
      ))}

      {/* Corner ornaments */}
      {[
        [-4.15, -4.15],
        [-4.15, 4.15],
        [4.15, -4.15],
        [4.15, 4.15],
      ].map(([cx, cz], i) => (
        <group key={`corner-${i}`} position={[cx, 0.0, cz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
            <meshStandardMaterial
              color="#c4a44a"
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color="#c4a44a"
              roughness={0.15}
              metalness={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
