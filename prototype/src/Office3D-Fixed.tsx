import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Text,
  Sky
} from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Load Real CEO Office Model with FBX Loader
function RealOfficeModel() {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = new FBXLoader()

    loader.load(
      '/models/office.fbx',
      (fbx) => {
        console.log('Office FBX loaded successfully:', fbx)

        // Scale and position the office
        fbx.scale.set(0.01, 0.01, 0.01)
        fbx.position.set(0, 0, 0)

        // Enable shadows
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        setModel(fbx)
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`Loading office: ${percent.toFixed(0)}%`)
      },
      (err: any) => {
        console.error('Error loading office FBX:', err)
        setError(err.message)
      }
    )
  }, [])

  if (error) {
    console.error('Office loading error:', error)
    return <FallbackOffice />
  }

  if (!model) {
    return <LoadingIndicator text="Loading Office..." />
  }

  return <primitive object={model} />
}

// Fallback simple office
function FallbackOffice() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* CEO Desk */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.1, 1.5]} />
          <meshStandardMaterial color="#8B4513" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    </group>
  )
}

// Loading indicator
function LoadingIndicator({ text }: { text: string }) {
  return (
    <group>
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  )
}

// Animated Avatar with Idle Animation
function AnimatedAvatar({
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
  const groupRef = useRef<THREE.Group>(null)
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load GLB model
  useEffect(() => {
    const loader = new GLTFLoader()

    loader.load(
      modelPath,
      (gltf: any) => {
        console.log(`Avatar loaded: ${label}`, gltf)

        // Enable shadows
        gltf.scene.traverse((child: any) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        setModel(gltf.scene)
      },
      (progress: any) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`Loading ${label}: ${percent.toFixed(0)}%`)
      },
      (err: any) => {
        console.error(`Error loading avatar ${label}:`, err)
        setError(err.message)
      }
    )
  }, [modelPath, label])

  // Idle animation (breathing + subtle movement)
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime

      // Breathing effect (subtle up/down)
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.02

      // Subtle rotation (looking around)
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05

      // Subtle lean
      groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.01
    }
  })

  if (error) {
    return <FallbackAvatar position={position} label={label} color="#3b82f6" />
  }

  if (!model) {
    return <LoadingIndicator text={`Loading ${label}...`} />
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={model}
        scale={scale}
      />

      {/* Label */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.15}
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
}

// Fallback avatar
function FallbackAvatar({
  position,
  label,
  color
}: {
  position: [number, number, number]
  label: string
  color: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      meshRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.05
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
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

// Main Scene
export default function Office3DFixed() {
  return (
    <Canvas
      shadows
      style={{ background: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)' }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
      }}
    >
      {/* CEO POV Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 1.6, 4]}
        fov={65}
      />

      {/* Enhanced Controls */}
      <OrbitControls
        target={[0, 1, 0]}
        minDistance={2}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        enablePan={true}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* Lighting Setup */}
      <ambientLight intensity={0.4} />

      {/* Main directional light */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* Fill lights */}
      <directionalLight position={[-5, 10, -5]} intensity={0.6} />
      <spotLight position={[0, 8, 5]} angle={0.4} penumbra={1} intensity={1} castShadow />

      {/* Accent lights */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#fbbf24" />
      <pointLight position={[-5, 2, -5]} intensity={0.4} color="#60a5fa" />
      <pointLight position={[5, 2, -5]} intensity={0.4} color="#34d399" />

      {/* HDRI Environment */}
      <Suspense fallback={null}>
        <Environment preset="city" background={false} />
      </Suspense>

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Contact Shadows */}
      <ContactShadows
        opacity={0.6}
        scale={20}
        blur={2}
        far={5}
        resolution={512}
        color="#000000"
      />

      {/* Office Model */}
      <Suspense fallback={<LoadingIndicator text="Loading CEO Office..." />}>
        <RealOfficeModel />
      </Suspense>

      {/* Director Avatar with Animation */}
      <Suspense fallback={<LoadingIndicator text="Loading Director..." />}>
        <AnimatedAvatar
          modelPath="/models/director.glb"
          position={[0, 0, -2.5]}
          label="🧠 DIRECTOR"
          scale={1}
        />
      </Suspense>

      {/* Supervisor Avatar with Animation */}
      <Suspense fallback={<LoadingIndicator text="Loading Supervisor..." />}>
        <AnimatedAvatar
          modelPath="/models/supervisor.glb"
          position={[2.5, 0, -1]}
          label="📊 SUPERVISOR"
          scale={1}
        />
      </Suspense>

      {/* Grid */}
      <gridHelper args={[20, 20, '#444444', '#666666']} position={[0, 0.01, 0]} />
    </Canvas>
  )
}
