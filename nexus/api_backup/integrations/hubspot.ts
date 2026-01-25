import type { VercelRequest, VercelResponse } from '@vercel/node'

interface HubSpotContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  properties?: Record<string, string>
}

interface HubSpotRequest {
  action: 'createContact' | 'updateContact' | 'getContact' | 'searchContacts' | 'createDeal' | 'listContacts'
  data?: HubSpotContact | Record<string, any>
  contactId?: string
  query?: string
  limit?: number
}

const HUBSPOT_API_BASE = 'https://api.hubapi.com'

async function makeHubSpotRequest(accessToken: string, method: string, endpoint: string, body?: any) {
  const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `HubSpot API error: ${response.status}`)
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
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN || req.headers['x-hubspot-token']

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        error: 'HubSpot not configured',
        hint: 'Add HUBSPOT_ACCESS_TOKEN to environment variables or connect via OAuth',
        setupUrl: 'https://app.hubspot.com/developer/integrations',
      })
    }

    const body: HubSpotRequest = req.body
    const { action, data, contactId, query, limit = 10 } = body

    let result: any

    switch (action) {
      case 'createContact': {
        if (!data || !data.email) {
          return res.status(400).json({
            success: false,
            error: 'Email is required to create a contact',
          })
        }

        const contactData = data as HubSpotContact
        const properties: Record<string, string> = {
          email: contactData.email,
          ...contactData.properties,
        }

        if (contactData.firstName) properties.firstname = contactData.firstName
        if (contactData.lastName) properties.lastname = contactData.lastName
        if (contactData.phone) properties.phone = contactData.phone
        if (contactData.company) properties.company = contactData.company

        result = await makeHubSpotRequest(String(accessToken), 'POST', '/crm/v3/objects/contacts', {
          properties,
        })
        break
      }

      case 'updateContact': {
        if (!contactId) {
          return res.status(400).json({
            success: false,
            error: 'contactId is required for update',
          })
        }

        const updateData = data as HubSpotContact
        const properties: Record<string, string> = { ...updateData.properties }

        if (updateData.email) properties.email = updateData.email
        if (updateData.firstName) properties.firstname = updateData.firstName
        if (updateData.lastName) properties.lastname = updateData.lastName
        if (updateData.phone) properties.phone = updateData.phone
        if (updateData.company) properties.company = updateData.company

        result = await makeHubSpotRequest(
          String(accessToken),
          'PATCH',
          `/crm/v3/objects/contacts/${contactId}`,
          { properties }
        )
        break
      }

      case 'getContact': {
        if (!contactId) {
          return res.status(400).json({
            success: false,
            error: 'contactId is required',
          })
        }

        result = await makeHubSpotRequest(
          String(accessToken),
          'GET',
          `/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone,company`
        )
        break
      }

      case 'searchContacts': {
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'query is required for search',
          })
        }

        result = await makeHubSpotRequest(String(accessToken), 'POST', '/crm/v3/objects/contacts/search', {
          query,
          limit,
          properties: ['email', 'firstname', 'lastname', 'phone', 'company'],
        })
        break
      }

      case 'listContacts': {
        result = await makeHubSpotRequest(
          String(accessToken),
          'GET',
          `/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company`
        )
        break
      }

      case 'createDeal': {
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Deal data is required',
          })
        }

        const dealData = data as Record<string, any>
        result = await makeHubSpotRequest(String(accessToken), 'POST', '/crm/v3/objects/deals', {
          properties: {
            dealname: dealData.name || 'New Deal',
            amount: dealData.amount || '0',
            pipeline: dealData.pipeline || 'default',
            dealstage: dealData.stage || 'appointmentscheduled',
            ...dealData.properties,
          },
        })
        break
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['createContact', 'updateContact', 'getContact', 'searchContacts', 'createDeal', 'listContacts'],
        })
    }

    return res.status(200).json({
      success: true,
      action,
      result,
    })
  } catch (error: any) {
    console.error('HubSpot API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'HubSpot operation failed',
    })
  }
}
