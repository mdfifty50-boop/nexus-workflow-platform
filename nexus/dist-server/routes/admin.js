import { Router } from 'express';
const router = Router();
// POST /api/admin/vercel - Vercel management operations
router.post('/vercel', async (req, res) => {
    try {
        const vercelToken = process.env.VERCEL_TOKEN;
        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID;
        if (!vercelToken) {
            return res.status(500).json({
                success: false,
                error: 'Vercel not configured',
                hint: 'Add VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables',
                setupSteps: [
                    'Go to https://vercel.com/account/tokens',
                    'Create a new token with full access',
                    'Add VERCEL_TOKEN to your environment variables',
                    'Add VERCEL_PROJECT_ID with your project ID'
                ]
            });
        }
        const { action, deploymentId, envKey, envValue, target } = req.body;
        const VERCEL_API = 'https://api.vercel.com';
        const teamQuery = teamId ? `?teamId=${teamId}` : '';
        async function vercelRequest(method, endpoint, body) {
            const response = await fetch(`${VERCEL_API}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${vercelToken}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || `Vercel API error: ${response.status}`);
            }
            return data;
        }
        let result;
        switch (action) {
            case 'getProject': {
                result = await vercelRequest('GET', `/v9/projects/${projectId}${teamQuery}`);
                break;
            }
            case 'getDeployments': {
                result = await vercelRequest('GET', `/v6/deployments?projectId=${projectId}&limit=10${teamId ? `&teamId=${teamId}` : ''}`);
                break;
            }
            case 'redeploy': {
                if (!deploymentId) {
                    return res.status(400).json({ success: false, error: 'deploymentId is required' });
                }
                result = await vercelRequest('POST', `/v13/deployments${teamQuery}`, {
                    deploymentId,
                    target: target || 'production'
                });
                break;
            }
            case 'getEnvVars': {
                result = await vercelRequest('GET', `/v9/projects/${projectId}/env${teamQuery}`);
                break;
            }
            case 'setEnvVar': {
                if (!envKey || envValue === undefined) {
                    return res.status(400).json({ success: false, error: 'envKey and envValue are required' });
                }
                // Check if var exists
                const existingVars = await vercelRequest('GET', `/v9/projects/${projectId}/env${teamQuery}`);
                const existingVar = existingVars.envs?.find((v) => v.key === envKey);
                if (existingVar) {
                    result = await vercelRequest('PATCH', `/v9/projects/${projectId}/env/${existingVar.id}${teamQuery}`, {
                        value: envValue,
                        target: ['production', 'preview', 'development']
                    });
                }
                else {
                    result = await vercelRequest('POST', `/v10/projects/${projectId}/env${teamQuery}`, {
                        key: envKey,
                        value: envValue,
                        type: 'encrypted',
                        target: ['production', 'preview', 'development']
                    });
                }
                break;
            }
            case 'deleteEnvVar': {
                if (!envKey) {
                    return res.status(400).json({ success: false, error: 'envKey is required' });
                }
                const vars = await vercelRequest('GET', `/v9/projects/${projectId}/env${teamQuery}`);
                const varToDelete = vars.envs?.find((v) => v.key === envKey);
                if (!varToDelete) {
                    return res.status(404).json({ success: false, error: `Variable ${envKey} not found` });
                }
                result = await vercelRequest('DELETE', `/v9/projects/${projectId}/env/${varToDelete.id}${teamQuery}`);
                break;
            }
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`,
                    availableActions: ['getProject', 'getDeployments', 'redeploy', 'getEnvVars', 'setEnvVar', 'deleteEnvVar']
                });
        }
        res.json({ success: true, action, result });
    }
    catch (error) {
        console.error('Vercel admin error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/admin/supabase - Supabase management operations
router.post('/supabase', async (req, res) => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl) {
            return res.status(500).json({
                success: false,
                error: 'Supabase not configured',
                hint: 'Add SUPABASE_URL environment variable'
            });
        }
        const { action, sql, tableName, limit = 100 } = req.body;
        switch (action) {
            case 'getProject': {
                res.json({
                    success: true,
                    result: {
                        configured: true,
                        url: supabaseUrl,
                        hasServiceRole: !!serviceRoleKey
                    }
                });
                return;
            }
            case 'getTables': {
                if (!serviceRoleKey) {
                    return res.status(400).json({
                        success: false,
                        error: 'Service role key required for this operation'
                    });
                }
                // Query information_schema for tables
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                    })
                });
                if (!response.ok) {
                    return res.json({
                        success: false,
                        error: 'exec_sql function not available',
                        hint: 'Create the exec_sql function in Supabase SQL Editor or use the Supabase Dashboard directly'
                    });
                }
                res.json({ success: true, result: await response.json() });
                return;
            }
            case 'getTableData': {
                if (!tableName) {
                    return res.status(400).json({ success: false, error: 'tableName is required' });
                }
                if (!serviceRoleKey) {
                    return res.status(400).json({ success: false, error: 'Service role key required' });
                }
                const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=${limit}&select=*`, {
                    headers: {
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch table data: ${response.statusText}`);
                }
                res.json({ success: true, result: await response.json() });
                return;
            }
            case 'runSql': {
                if (!sql) {
                    return res.status(400).json({ success: false, error: 'sql is required' });
                }
                if (!serviceRoleKey) {
                    return res.json({
                        success: false,
                        error: 'Direct SQL requires SUPABASE_SERVICE_ROLE_KEY',
                        hint: 'For security, run SQL manually in Supabase Dashboard',
                        manualSteps: [
                            'Go to https://supabase.com/dashboard',
                            'Select your project',
                            'Go to SQL Editor',
                            'Paste and run your SQL'
                        ],
                        sql // Return SQL so user can copy it
                    });
                }
                // Try to execute SQL
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sql })
                });
                if (!response.ok) {
                    return res.json({
                        success: false,
                        error: 'SQL execution failed - exec_sql function may not exist',
                        hint: 'Run SQL manually in Supabase SQL Editor',
                        sql
                    });
                }
                res.json({ success: true, result: await response.json() });
                return;
            }
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`,
                    availableActions: ['getProject', 'getTables', 'getTableData', 'runSql']
                });
        }
    }
    catch (error) {
        console.error('Supabase admin error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
//# sourceMappingURL=admin.js.map