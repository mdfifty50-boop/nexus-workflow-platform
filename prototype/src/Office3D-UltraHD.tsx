import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  useFBX,
  Environment,
  ContactShadows,
  Text,
  Sky
} from '@react-three/drei'
import { Suspense } from 'react'

// Load Real CEO Office Model
function RealOfficeModel() {
  try {
    const fbx = useFBX('/models/office.fbx')

    return (
      <primitive
        object={fbx}
        scale={0.01}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    )
  } catch (error) {
    console.error('Error loading office model:', error)
    return <FallbackOffice />
  }
}

// Fallback simple office if FBX fails
function FallbackOffice() {
  return (
    <group>
      <mesh position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#d4d4d8" />
      </mesh>
    </group>
  )
}

// Load Real Avatar Models
function RealAvatar({
  modelPath,
  position,
  label,
  scale = 1
}: {
  modelPath: string
  position: [number, number, number]
  label: string
  scale?: number
}) {
  try {
    const { scene } = useGLTF(modelPath)

    return (
      <group position={position}>
        <primitive
          object={scene.clone()}
          scale={scale}
          castShadow
          receiveShadow
        />

        {/* Label above avatar */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {label}
        </Text>
      </group>
    )
  } catch (error) {
    console.error(`Error loading avatar ${modelPath}:`, error)
    return <FallbackAvatar position={position} label={label} color="#3b82f6" />
  }
}

// Fallback avatar if GLB fails
function FallbackAvatar({
  position,
  label,
  color
}: {
  position: [number, number, number]
  label: string
  color: string
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
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

// Main Ultra HD Scene
export default function Office3DUltraHD() {
  return (
    <Canvas
      shadows
      style={{ background: 'linear-gradient(to bottom, #1e3a8a 0%, #172554 100%)' }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
    >
      {/* CEO POV Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 1.6, 3]}
        fov={60}
      />

      {/* Enhanced Controls */}
      <OrbitControls
        target={[0, 1.2, -1]}
        minDistance={2}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        enablePan={true}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* Advanced Lighting Setup */}
      <ambientLight intensity={0.3} />

      {/* Key Light (main illumination) */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill Light (soften shadows) */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.5}
      />

      {/* Rim Light (edge definition) */}
      <spotLight
        position={[0, 8, 5]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        castShadow
      />

      {/* Point lights for atmosphere */}
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#fbbf24" />
      <pointLight position={[-5, 2, -5]} intensity={0.3} color="#60a5fa" />

      {/* HDRI Environment for realistic reflections */}
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Contact Shadows for realism */}
      <ContactShadows
        opacity={0.5}
        scale={20}
        blur={2}
        far={4}
        resolution={256}
        color="#000000"
      />

      {/* Load Real Models */}
      <Suspense fallback={<FallbackOffice />}>
        <RealOfficeModel />
      </Suspense>

      {/* Director Avatar (Real GLB Model) */}
      <Suspense fallback={<FallbackAvatar position={[0, 0, -2.5]} label="DIRECTOR" color="#3b82f6" />}>
        <RealAvatar
          modelPath="/models/director.glb"
          position={[0, 0, -2.5]}
          label="🧠 DIRECTOR"
          scale={1}
        />
      </Suspense>

      {/* Supervisor Avatar (Real GLB Model) */}
      <Suspense fallback={<FallbackAvatar position={[2.5, 0, -1]} label="SUPERVISOR" color="#10b981" />}>
        <RealAvatar
          modelPath="/models/supervisor.glb"
          position={[2.5, 0, -1]}
          label="📊 SUPERVISOR"
          scale={1}
        />
      </Suspense>

      {/* Sky background for realism */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Grid helper for spatial awareness */}
      <gridHelper args={[20, 20, '#666666', '#888888']} position={[0, 0.01, 0]} />
    </Canvas>
  )
}

// Preload models for faster loading
useGLTF.preload('/models/director.glb')
useGLTF.preload('/models/supervisor.glb')
useFBX.preload('/models/office.fbx')
