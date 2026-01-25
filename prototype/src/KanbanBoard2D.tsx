interface KanbanBoard2DProps {
  onClose: () => void
}

export default function KanbanBoard2D({ onClose }: KanbanBoard2DProps) {
  const columns = [
    {
      title: '📋 Backlog',
      tasks: [
        { id: 1, title: 'Create restaurant website', priority: 'High' },
        { id: 2, title: 'Design mobile app UI', priority: 'Medium' },
      ]
    },
    {
      title: '⚙️ In Progress',
      tasks: [
        { id: 3, title: 'Build 3D office prototype', priority: 'High', agent: 'Developer' },
      ]
    },
    {
      title: '🔍 Review',
      tasks: [
        { id: 4, title: 'Test authentication flow', priority: 'High', agent: 'QA Lead' },
      ]
    },
    {
      title: '✅ Done',
      tasks: [
        { id: 5, title: 'Research tech stack', priority: 'High' },
        { id: 6, title: 'Create PRD document', priority: 'Medium' },
      ]
    },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 999,
        padding: '40px',
        overflow: 'auto',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            margin: 0
          }}>
            📊 Project Board - 3D Office Platform
          </h1>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Kanban Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {columns.map((column, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Column Header */}
              <h2 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              }}>
                {column.title}
              </h2>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '8px',
                    }}>
                      {task.title}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      fontSize: '12px',
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: task.priority === 'High' ? '#fee2e2' : '#dbeafe',
                        color: task.priority === 'High' ? '#dc2626' : '#2563eb',
                        fontWeight: '500',
                      }}>
                        {task.priority}
                      </span>

                      {task.agent && (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          fontWeight: '500',
                        }}>
                          👤 {task.agent}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <div style={{
            display: 'flex',
            gap: '40px',
            color: 'white',
            fontSize: '14px',
          }}>
            <div>
              <span style={{ opacity: 0.7 }}>Total Tasks:</span>
              <strong style={{ marginLeft: '8px', fontSize: '18px' }}>6</strong>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>In Progress:</span>
              <strong style={{ marginLeft: '8px', fontSize: '18px', color: '#fbbf24' }}>1</strong>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Completed:</span>
              <strong style={{ marginLeft: '8px', fontSize: '18px', color: '#10b981' }}>2</strong>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Agents Working:</span>
              <strong style={{ marginLeft: '8px', fontSize: '18px', color: '#3b82f6' }}>2</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
