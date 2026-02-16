/**
 * AITeamChatButton - Floating button to access AI team meeting room
 * Positioned above the chatbot button on desktop only
 * Only shows on workflow-related pages, NOT on landing page
 */

import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

export function AITeamChatButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Only show on workflow/dashboard pages, not on landing, login, signup, etc.
  const hiddenRoutes = ['/', '/login', '/sign-up', '/privacy', '/terms', '/help', '/try']
  const shouldShow = !hiddenRoutes.includes(location.pathname)

  const handleClick = () => {
    navigate('/meeting-room-demo')
  }

  // Don't render on hidden routes
  if (!shouldShow) {
    return null
  }

  return (
    // Visible on all screen sizes, positioned above chatbot
    <div className="flex fixed bottom-28 right-4 md:right-6 z-40">
      <button
        onClick={handleClick}
        className="group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:scale-110"
        aria-label={t('accessibility.aiConsultancy', 'AI Consultancy')}
      >
        {/* Icon - consultancy briefcase with people */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Subtle pulse animation */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-ping opacity-20"></span>

        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          {t('accessibility.aiConsultancy', 'AI Consultancy')}
        </span>
      </button>
    </div>
  )
}
