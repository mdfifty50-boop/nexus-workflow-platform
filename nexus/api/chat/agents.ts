import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllAgents } from '../_lib/agents.js'
import { withSecurityHeaders } from '../_lib/security-headers.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers and handle CORS preflight
  if (withSecurityHeaders(req, res)) return

  const agents = getAllAgents().map(agent => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    avatar: agent.avatar,
    color: agent.color,
    department: agent.department,
    capabilities: agent.capabilities
  }))

  res.json({ success: true, agents })
}
