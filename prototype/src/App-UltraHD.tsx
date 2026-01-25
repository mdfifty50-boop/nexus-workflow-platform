import { useState } from 'react'
import Office3DFixed from './Office3D-Fixed'
import KanbanBoard2D from './KanbanBoard2D'

export default function AppUltraHD() {
  const [showBoard, setShowBoard] = useState(false)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Ultra HD 3D Office Scene with Animations */}
      <Office3DFixed />

      {/* Toggle Board Button */}
      <button
        onClick={() => setShowBoard(!showBoard)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '14px 28px',
          fontSize: '17px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 8px 16px rgba(102,126,234,0.4)',
          zIndex: 1000,
          transition: 'all 0.3s',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(102,126,234,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(102,126,234,0.4)'
        }}
      >
        {showBoard ? '🏢 3D Office' : '📋 2D Board'}
      </button>

      {/* Enhanced Info Panel */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.95) 100%)',
          color: 'white',
          borderRadius: '16px',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '350px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '18px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ✨ Ultra HD CEO POV
        </h3>
        <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎯</span>
            <strong>You:</strong> CEO at your desk
          </p>
          <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧠</span>
            <strong>Director:</strong> Photorealistic AI avatar
          </p>
          <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <strong>Supervisor:</strong> Photorealistic AI avatar
          </p>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '10px' }}>
          <p style={{ margin: '4px 0' }}>🖱️ Drag to rotate view</p>
          <p style={{ margin: '4px 0' }}>🔍 Scroll to zoom in/out</p>
          <p style={{ margin: '4px 0' }}>🎨 <strong>ULTRA HD:</strong> Real AI-generated models</p>
        </div>
      </div>

      {/* Loading indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          textAlign: 'center',
          zIndex: 500,
          pointerEvents: 'none',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        <p>Loading Ultra HD Assets...</p>
        <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
          CEO Office + Photorealistic Avatars
        </p>
      </div>

      {/* 2D Kanban Board Overlay */}
      {showBoard && <KanbanBoard2D onClose={() => setShowBoard(false)} />}
    </div>
  )
}
