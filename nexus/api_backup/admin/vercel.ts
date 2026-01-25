import type { VercelRequest, VercelResponse } from '@vercel/node'

// Vercel API Management Endpoint
// Allows the Nexus admin panel to manage Vercel deployments and environment variables

const VERCEL_API_BASE = 'https://api.vercel.com'

interface VercelRequest {
  action: 'getDeployments' | 'redeploy' | 'getEnvVars' | 'setEnvVar' | 'deleteEnvVar' | 'getProject'
  deploymentId?: string
  envKey?: string
  envValue?: string
  target?: 'production' | 'preview' | 'development'
}

async function makeVercelRequest(
  token: string,
  method: string,
  endpoint: string,
  body?: any
) {
  const response = await fetch(`${VERCEL_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || `Vercel API error: ${response.status}`)
  }

  return data
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const vercelToken = process.env.VERCEL_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID || 'nexus-platform-gtsj'
    const teamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken) {
      return res.status(500).json({
        success: false,
        error: 'Vercel not configured',
        hint: 'Add VERCEL_TOKEN to environment variables',
        setupSteps: [
          'Go to https://vercel.com/account/tokens',
          'Create a new token with full access',
          'Add VERCEL_TOKEN to your Vercel environment variables',
          'Also add VERCEL_PROJECT_ID (your project ID)',
          'Redeploy to apply changes',
        ],
      })
    }

    const body: VercelRequest = req.body
    const { action, deploymentId, envKey, envValue, target } = body

    // Build team query param if needed
    const teamQuery = teamId ? `?teamId=${teamId}` : ''

    let result: any

    switch (action) {
      case 'getProject': {
        result = await makeVercelRequest(
          vercelToken,
          'GET',
          `/v9/projects/${projectId}${teamQuery}`
        )
        break
      }

      case 'getDeployments': {
        result = await makeVercelRequest(
          vercelToken,
          'GET',
          `/v6/deployments?projectId=${projectId}&limit=10${teamId ? `&teamId=${teamId}` : ''}`
        )
        break
      }

      case 'redeploy': {
        if (!deploymentId) {
          return res.status(400).json({
            success: false,
            error: 'deploymentId is required for redeploy',
          })
        }

        result = await makeVercelRequest(
          vercelToken,
          'POST',
          `/v13/deployments${teamQuery}`,
          {
            deploymentId,
            target: target || 'production',
          }
        )
        break
      }

      case 'getEnvVars': {
        result = await makeVercelRequest(
          vercelToken,
          'GET',
          `/v9/projects/${projectId}/env${teamQuery}`
        )
        break
      }

      case 'setEnvVar': {
        if (!envKey || envValue === undefined) {
          return res.status(400).json({
            success: false,
            error: 'envKey and envValue are required',
          })
        }

        // Check if var exists to decide update vs create
        const existingVars = await makeVercelRequest(
          vercelToken,
          'GET',
          `/v9/projects/${projectId}/env${teamQuery}`
        )

        const existingVar = existingVars.envs?.find(
          (v: any) => v.key === envKey
        )

        if (existingVar) {
          // Update existing
          result = await makeVercelRequest(
            vercelToken,
            'PATCH',
            `/v9/projects/${projectId}/env/${existingVar.id}${teamQuery}`,
            {
              value: envValue,
              target: ['production', 'preview', 'development'],
            }
          )
        } else {
          // Create new
          result = await makeVercelRequest(
            vercelToken,
            'POST',
            `/v10/projects/${projectId}/env${teamQuery}`,
            {
              key: envKey,
              value: envValue,
              type: 'encrypted',
              target: ['production', 'preview', 'development'],
            }
          )
        }
        break
      }

      case 'deleteEnvVar': {
        if (!envKey) {
          return res.status(400).json({
            success: false,
            error: 'envKey is required',
          })
        }

        // Find var ID first
        const vars = await makeVercelRequest(
          vercelToken,
          'GET',
          `/v9/projects/${projectId}/env${teamQuery}`
        )

        const varToDelete = vars.envs?.find((v: any) => v.key === envKey)

        if (!varToDelete) {
          return res.status(404).json({
            success: false,
            error: `Environment variable ${envKey} not found`,
          })
        }

        result = await makeVercelRequest(
          vercelToken,
          'DELETE',
          `/v9/projects/${projectId}/env/${varToDelete.id}${teamQuery}`
        )
        break
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['getProject', 'getDeployments', 'redeploy', 'getEnvVars', 'setEnvVar', 'deleteEnvVar'],
        })
    }

    return res.status(200).json({
      success: true,
      action,
      result,
    })
  } catch (error: any) {
    console.error('Vercel API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Vercel operation failed',
    })
  }
}
