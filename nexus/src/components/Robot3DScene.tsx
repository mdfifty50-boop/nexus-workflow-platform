/**
 * Robot3DScene - Self-contained 3D Robot using React Three Fiber
 *
 * A procedurally generated metallic robot head with:
 * - Glowing purple eyes that follow the cursor
 * - Floating/bobbing animation
 * - Metallic purple/blue materials matching Nexus brand
 * - Ambient particle effects
 *
 * Lazy-loaded to avoid adding Three.js to the initial bundle.
 */

import { useRef, useMemo, useEffect, createContext, useContext } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// Global mouse tracking - shared between React and Three.js
// ============================================================================

// Normalized mouse position (-1 to 1) tracked across the entire page
const globalMouse = { x: 0, y: 0 }

const GlobalMouseContext = createContext(globalMouse)

// ============================================================================
// Robot Head - follows mouse cursor ANYWHERE on the page
// ============================================================================

function RobotHead() {
  const groupRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const antennaRef = useRef<THREE.Mesh>(null)
  const mouse = useContext(GlobalMouseContext)

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    // Smooth cursor follow using global mouse position
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouse.x * 0.5,
      0.04
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -mouse.y * 0.3,
      0.04
    )

    // Pulsing eye glow
    const pulse = Math.sin(clock.elapsedTime * 2) * 0.3 + 1.7
    if (leftEyeRef.current) {
      const mat = leftEyeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = pulse
    }
    if (rightEyeRef.current) {
      const mat = rightEyeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = pulse
    }

    // Antenna tip pulse
    if (antennaRef.current) {
      const mat = antennaRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(clock.elapsedTime * 3) * 0.5 + 1.5
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main head body - rounded look */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.3, 1.2]} />
        <meshStandardMaterial
          color="#1e1145"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* Head top bevel */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.3, 0.2, 1.0]} />
        <meshStandardMaterial
          color="#2a1660"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Face plate / visor */}
      <mesh position={[0, 0.0, 0.61]}>
        <boxGeometry args={[1.25, 0.55, 0.04]} />
        <meshStandardMaterial
          color="#0a0a1a"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Visor border glow */}
      <mesh position={[0, 0.0, 0.615]}>
        <boxGeometry args={[1.3, 0.6, 0.01]} />
        <meshStandardMaterial
          color="#4c1d95"
          emissive="#4c1d95"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.32, 0.02, 0.65]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.32, 0.02, 0.65]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Eye glow halos */}
      <pointLight position={[-0.32, 0.02, 0.8]} intensity={0.4} color="#a855f7" distance={1.5} />
      <pointLight position={[0.32, 0.02, 0.8]} intensity={0.4} color="#a855f7" distance={1.5} />

      {/* Mouth / speaker grille */}
      <mesh position={[0, -0.3, 0.62]}>
        <boxGeometry args={[0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#2d1b69" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.38, 0.62]}>
        <boxGeometry args={[0.4, 0.05, 0.02]} />
        <meshStandardMaterial color="#2d1b69" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Antenna mast */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.4]} />
        <meshStandardMaterial color="#3b1d8c" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Antenna tip - glowing orb */}
      <mesh ref={antennaRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#c084fc"
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight position={[0, 1.1, 0]} intensity={0.3} color="#c084fc" distance={1} />

      {/* Ear modules */}
      <mesh position={[-0.82, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.45]} />
        <meshStandardMaterial color="#2a1660" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0.82, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.45]} />
        <meshStandardMaterial color="#2a1660" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Ear accent lights */}
      <mesh position={[-0.88, 0.05, 0]}>
        <boxGeometry args={[0.01, 0.2, 0.2]} />
        <meshStandardMaterial color="#6d28d9" emissive="#6d28d9" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.88, 0.05, 0]}>
        <boxGeometry args={[0.01, 0.2, 0.2]} />
        <meshStandardMaterial color="#6d28d9" emissive="#6d28d9" emissiveIntensity={0.8} />
      </mesh>

      {/* Chin piece */}
      <mesh position={[0, -0.58, 0.1]} castShadow>
        <boxGeometry args={[1.0, 0.15, 0.8]} />
        <meshStandardMaterial color="#1e1145" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Neck connector */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.2, 8]} />
        <meshStandardMaterial color="#1a0e3d" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// ============================================================================
// Floating particles around the robot
// ============================================================================

function Particles() {
  const particlesRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const count = 30
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random positions in a sphere around the robot
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 1.5 + Math.random() * 1.5

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 0.2
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Purple-ish colors
      col[i * 3] = 0.5 + Math.random() * 0.3     // R
      col[i * 3 + 1] = 0.1 + Math.random() * 0.2 // G
      col[i * 3 + 2] = 0.8 + Math.random() * 0.2 // B
    }

    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (!particlesRef.current) return
    particlesRef.current.rotation.y = clock.elapsedTime * 0.05
    particlesRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.1
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// ============================================================================
// Scene composition
// ============================================================================

function Scene() {
  return (
    <>
      {/* Ambient fill light */}
      <ambientLight intensity={0.25} />

      {/* Key light - purple */}
      <directionalLight
        position={[3, 2, 4]}
        intensity={0.8}
        color="#8b5cf6"
      />

      {/* Fill light - blue */}
      <pointLight
        position={[-3, -1, 3]}
        intensity={0.5}
        color="#3b82f6"
        distance={8}
      />

      {/* Rim light - bright purple */}
      <spotLight
        position={[0, 3, -2]}
        intensity={0.6}
        angle={0.6}
        penumbra={1}
        color="#a855f7"
      />

      {/* Bottom fill to prevent pure black underside */}
      <pointLight
        position={[0, -3, 2]}
        intensity={0.2}
        color="#6366f1"
        distance={5}
      />

      {/* Floating robot head */}
      <Float
        speed={1.8}
        rotationIntensity={0.15}
        floatIntensity={0.4}
        floatingRange={[-0.1, 0.1]}
      >
        <RobotHead />
      </Float>

      {/* Ambient particles */}
      <Particles />
    </>
  )
}

// ============================================================================
// Exported Canvas wrapper
// ============================================================================

interface Robot3DSceneProps {
  width: number
  height: number
}

export default function Robot3DScene({ width, height }: Robot3DSceneProps) {
  const mouseRef = useRef(globalMouse)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track mouse relative to the canvas center, so the robot always
  // faces toward the cursor's position on the dashboard
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el) return

      // Get the canvas center in viewport coordinates
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Direction from canvas center to cursor, normalized to ~-1..1
      // Use a divisor that gives full range when cursor is ~400px away
      const range = Math.max(rect.width, 400)
      mouseRef.current.x = Math.max(-1, Math.min(1, (e.clientX - centerX) / range))
      mouseRef.current.y = -Math.max(-1, Math.min(1, (e.clientY - centerY) / range))
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <GlobalMouseContext.Provider value={mouseRef.current}>
      <div ref={containerRef} style={{ width, height }}>
        <Canvas
          camera={{ position: [0, 0.2, 3.2], fov: 35 }}
          style={{ width, height, borderRadius: '1rem' }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </div>
    </GlobalMouseContext.Provider>
  )
}
