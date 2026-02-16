/**
 * AI Consultancy Page
 *
 * Full-page wrapper for the AIMeetingRoomV2 multi-agent consultancy.
 * Provides access to 8 specialized AI expert consultants.
 */

import { useNavigate } from 'react-router-dom'
import { AIMeetingRoomV2 } from '@/components/AIMeetingRoomV2'

export function AIConsultancy() {
  const navigate = useNavigate()

  return (
    <AIMeetingRoomV2
      isOpen={true}
      onClose={() => navigate('/chat')}
      mode="brainstorm"
      fullPage={true}
    />
  )
}

export default AIConsultancy
