/**
 * WhatsApp Integration Component - DEPRECATED
 *
 * ⚠️ This component has been deprecated. The old QR code/pairing code approach
 * using whatsapp-web.js has been removed because:
 * 1. It violates WhatsApp's Terms of Service
 * 2. The "Can't link new devices" error makes it unusable
 * 3. It only works for developers, not end users
 *
 * Please use WhatsAppBusinessIntegration instead:
 * - Uses legitimate WhatsApp Business API via AiSensy BSP
 * - Works for all users (not just developers)
 * - Supports template messages for business outreach
 * - 24-hour session window for customer service replies
 */

import { useState } from 'react'
import { Button } from './ui/button'
import { WhatsAppBusinessIntegrationPanel } from './WhatsAppBusinessIntegration'

interface WhatsAppIntegrationPanelProps {
  className?: string
  userId?: string
}

/**
 * Deprecated - Redirects to WhatsApp Business Integration
 */
export function WhatsAppIntegrationPanel({ className = '', userId }: WhatsAppIntegrationPanelProps) {
  const [showNewComponent, setShowNewComponent] = useState(false)

  if (showNewComponent) {
    return <WhatsAppBusinessIntegrationPanel className={className} userId={userId} />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Deprecation Notice */}
      <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-400">
              Personal WhatsApp Integration Deprecated
            </h3>
            <p className="text-sm text-amber-200/80 mt-2">
              The QR code/pairing code approach has been removed because it violates WhatsApp's Terms of Service
              and the "Can't link new devices" error makes it unusable.
            </p>
          </div>
        </div>
      </div>

      {/* Migration Card */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              WhatsApp Business API Available
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Use the legitimate WhatsApp Business API via AiSensy BSP:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Compliant with WhatsApp Terms of Service
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                No QR code scanning required
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Supports template messages for business outreach
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                24-hour session window for customer service
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Works for all users (not just developers)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                $0 platform fee - only pay Meta per-message rates
              </li>
            </ul>
            <div className="mt-4">
              <Button
                onClick={() => setShowNewComponent(true)}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Use WhatsApp Business API →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Why the change */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-white mb-2">Why did we change?</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• whatsapp-web.js uses reverse-engineered WhatsApp Web protocol</li>
          <li>• WhatsApp blocks new device linking to prevent automation abuse</li>
          <li>• Personal accounts are NOT designed for business automation</li>
          <li>• Risk of account bans for Terms of Service violations</li>
          <li>• WhatsApp Business API is the legitimate way to automate</li>
        </ul>
      </div>
    </div>
  )
}

// Named export for backward compatibility
export { WhatsAppIntegrationPanel as WhatsAppConnection }
export default WhatsAppIntegrationPanel
