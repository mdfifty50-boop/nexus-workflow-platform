import { useState } from 'react'
import Office3D from './Office3D'
import KanbanBoard2D from './KanbanBoard2D'

export default function App() {
  const [showBoard, setShowBoard] = useState(false)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Office Scene */}
      <Office3D />

      {/* Toggle Board Button */}
      <button
        onClick={() => setShowBoard(!showBoard)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1d4ed8'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        {showBoard ? '🏢 3D Office View' : '📋 2D Board View'}
      </button>

      {/* Info Panel */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '16px 20px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '300px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          🎯 CEO POV Prototype
        </h3>
        <p style={{ margin: '4px 0', opacity: 0.9 }}>
          <strong>You:</strong> CEO at your desk
        </p>
        <p style={{ margin: '4px 0', opacity: 0.9 }}>
          <strong>Director:</strong> Blue avatar (orchestrator)
        </p>
        <p style={{ margin: '4px 0', opacity: 0.9 }}>
          <strong>Supervisor:</strong> Green avatar (monitor)
        </p>
        <p style={{ margin: '8px 0 4px 0', fontSize: '12px', opacity: 0.7 }}>
          🖱️ Drag to rotate | Scroll to zoom
        </p>
      </div>

      {/* 2D Kanban Board Overlay */}
      {showBoard && <KanbanBoard2D onClose={() => setShowBoard(false)} />}
    </div>
  )
}
