import type { VercelRequest, VercelResponse } from '@vercel/node'

// Supabase Management API Endpoint
// Allows the Nexus admin panel to manage Supabase database

const SUPABASE_MANAGEMENT_API = 'https://api.supabase.com'

interface SupabaseRequest {
  action: 'runSql' | 'getTables' | 'getTableData' | 'getProject' | 'getUsage'
  sql?: string
  tableName?: string
  limit?: number
  offset?: number
}

async function makeSupabaseManagementRequest(
  accessToken: string,
  method: string,
  endpoint: string,
  body?: any
) {
  const response = await fetch(`${SUPABASE_MANAGEMENT_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || `Supabase API error: ${response.status}`)
  }

  return data
}

// Direct database query using PostgREST or pg_execute
async function executeSQL(
  supabaseUrl: string,
  serviceRoleKey: string,
  sql: string
) {
  // Use Supabase's pg_execute via REST
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })

  if (!response.ok) {
    // If exec_sql RPC doesn't exist, try a different approach
    const errorText = await response.text()
    throw new Error(`SQL execution failed: ${errorText}`)
  }

  return response.json()
}

// Get list of tables in the database
async function getTables(supabaseUrl: string, serviceRoleKey: string) {
  const sql = `
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `

  // Try using RPC first
  try {
    return await executeSQL(supabaseUrl, serviceRoleKey, sql)
  } catch {
    // Fallback: Query the _supabase_functions schema or return error
    return {
      error: 'Unable to list tables. The exec_sql function may not be available.',
      hint: 'Create the exec_sql function in Supabase SQL Editor or use the manual method.',
    }
  }
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
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const managementAccessToken = process.env.SUPABASE_ACCESS_TOKEN
    const projectRef = process.env.SUPABASE_PROJECT_REF

    if (!supabaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
        hint: 'Add SUPABASE_URL or VITE_SUPABASE_URL to environment variables',
      })
    }

    const body: SupabaseRequest = req.body
    const { action, sql, tableName, limit = 100, offset = 0 } = body

    let result: any

    switch (action) {
      case 'getProject': {
        if (!managementAccessToken || !projectRef) {
          return res.status(200).json({
            success: true,
            result: {
              configured: true,
              url: supabaseUrl,
              hasServiceRole: !!serviceRoleKey,
              hasManagementAccess: !!managementAccessToken,
              hint: !managementAccessToken
                ? 'Add SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF for full management access'
                : undefined,
            },
          })
        }

        result = await makeSupabaseManagementRequest(
          managementAccessToken,
          'GET',
          `/v1/projects/${projectRef}`
        )
        break
      }

      case 'getUsage': {
        if (!managementAccessToken || !projectRef) {
          return res.status(400).json({
            success: false,
            error: 'Management API not configured',
            hint: 'Add SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF',
          })
        }

        result = await makeSupabaseManagementRequest(
          managementAccessToken,
          'GET',
          `/v1/projects/${projectRef}/usage`
        )
        break
      }

      case 'getTables': {
        if (!serviceRoleKey) {
          return res.status(400).json({
            success: false,
            error: 'Service role key not configured',
            hint: 'Add SUPABASE_SERVICE_ROLE_KEY to environment variables',
          })
        }

        result = await getTables(supabaseUrl, serviceRoleKey)
        break
      }

      case 'getTableData': {
        if (!tableName) {
          return res.status(400).json({
            success: false,
            error: 'tableName is required',
          })
        }

        if (!serviceRoleKey) {
          return res.status(400).json({
            success: false,
            error: 'Service role key not configured',
          })
        }

        // Use PostgREST to fetch table data
        const response = await fetch(
          `${supabaseUrl}/rest/v1/${tableName}?limit=${limit}&offset=${offset}&select=*`,
          {
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch table data: ${response.statusText}`)
        }

        result = await response.json()
        break
      }

      case 'runSql': {
        if (!sql) {
          return res.status(400).json({
            success: false,
            error: 'sql is required',
          })
        }

        if (!serviceRoleKey) {
          return res.status(200).json({
            success: false,
            error: 'Direct SQL execution requires SUPABASE_SERVICE_ROLE_KEY',
            hint: 'For security, SQL must be run manually in Supabase SQL Editor',
            manualSteps: [
              'Go to https://supabase.com/dashboard',
              'Select your project',
              'Go to SQL Editor',
              'Paste the SQL and run',
            ],
            sql: sql, // Return the SQL so user can copy it
          })
        }

        // Attempt to execute SQL
        try {
          result = await executeSQL(supabaseUrl, serviceRoleKey, sql)
        } catch (error: any) {
          // If exec_sql doesn't exist, provide instructions
          return res.status(200).json({
            success: false,
            error: error.message,
            hint: 'The exec_sql function may not exist. Create it or run SQL manually.',
            createFunction: `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;`,
            manualSteps: [
              'Go to Supabase SQL Editor',
              'Run the createFunction SQL above first',
              'Then retry running your SQL',
            ],
            sql: sql,
          })
        }
        break
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['getProject', 'getUsage', 'getTables', 'getTableData', 'runSql'],
        })
    }

    return res.status(200).json({
      success: true,
      action,
      result,
    })
  } catch (error: any) {
    console.error('Supabase API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Supabase operation failed',
    })
  }
}
