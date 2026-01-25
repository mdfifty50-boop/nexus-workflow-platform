import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Box, Sphere, Text } from '@react-three/drei'

// CEO Desk Component
function CEODesk() {
  return (
    <group position={[0, 0, 0]}>
      {/* Desk */}
      <Box args={[3, 0.1, 1.5]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#8B4513" />
      </Box>

      {/* Desk Legs */}
      <Box args={[0.1, 0.75, 0.1]} position={[-1.4, 0.375, -0.7]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[0.1, 0.75, 0.1]} position={[1.4, 0.375, -0.7]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[0.1, 0.75, 0.1]} position={[-1.4, 0.375, 0.7]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[0.1, 0.75, 0.1]} position={[1.4, 0.375, 0.7]}>
        <meshStandardMaterial color="#654321" />
      </Box>

      {/* Monitor */}
      <Box args={[1.2, 0.8, 0.05]} position={[0, 1.2, -0.3]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>

      {/* Monitor Screen */}
      <Box args={[1.1, 0.7, 0.02]} position={[0, 1.2, -0.275]}>
        <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.3} />
      </Box>
    </group>
  )
}

// Agent Avatar Component
function AgentAvatar({
  position,
  color,
  label
}: {
  position: [number, number, number]
  color: string
  label: string
}) {
  return (
    <group position={position}>
      {/* Body */}
      <Box args={[0.5, 0.8, 0.3]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color={color} />
      </Box>

      {/* Head */}
      <Sphere args={[0.25, 32, 32]} position={[0, 1.7, 0]}>
        <meshStandardMaterial color="#ffdbac" />
      </Sphere>

      {/* Chair */}
      <Box args={[0.6, 0.1, 0.6]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>
      <Box args={[0.6, 0.6, 0.1]} position={[0, 0.8, 0.25]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* Label */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  )
}

// Office Floor
function OfficeFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#d4d4d8" />
    </mesh>
  )
}

// Main 3D Office Scene
export default function Office3D() {
  return (
    <Canvas shadows style={{ background: '#f0f0f0' }}>
      {/* Camera - CEO POV (sitting at desk) */}
      <PerspectiveCamera makeDefault position={[0, 1.6, 2.5]} fov={60} />

      {/* Controls - Allow user to look around */}
      <OrbitControls
        target={[0, 1.2, -1]}
        minDistance={1}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        enablePan={true}
      />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 3, 0]} intensity={0.5} />

      {/* Office Floor */}
      <OfficeFloor />

      {/* CEO Desk (your desk) */}
      <CEODesk />

      {/* Director Avatar - sitting in front of you */}
      <AgentAvatar
        position={[0, 0, -2.5]}
        color="#3b82f6"
        label="🧠 DIRECTOR"
      />

      {/* Supervisor Avatar - sitting to the side */}
      <AgentAvatar
        position={[2.5, 0, -1]}
        color="#10b981"
        label="📊 SUPERVISOR"
      />

      {/* Office Walls (subtle) */}
      <Box args={[20, 4, 0.2]} position={[0, 2, -8]}>
        <meshStandardMaterial color="#e5e7eb" />
      </Box>
      <Box args={[0.2, 4, 20]} position={[-8, 2, 0]}>
        <meshStandardMaterial color="#e5e7eb" />
      </Box>
      <Box args={[0.2, 4, 20]} position={[8, 2, 0]}>
        <meshStandardMaterial color="#e5e7eb" />
      </Box>

      {/* Grid helper (optional - shows spatial awareness) */}
      <gridHelper args={[20, 20, '#999999', '#cccccc']} position={[0, 0.01, 0]} />
    </Canvas>
  )
}
