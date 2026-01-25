import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { useToast } from '@/contexts/ToastContext'

interface Deployment {
  uid: string
  name: string
  url: string
  state: string
  created: number
  target: string
}

interface EnvVar {
  id: string
  key: string
  value?: string
  target: string[]
  type: string
  createdAt: number
}

export function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'deployments' | 'env' | 'database'>('deployments')

  // Vercel state
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [vercelLoading, setVercelLoading] = useState(false)
  const [vercelError, setVercelError] = useState<string | null>(null)
  const [vercelConfigured, setVercelConfigured] = useState(true)
  const [setupSteps, setSetupSteps] = useState<string[]>([])

  // New env var form
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')
  const [envSaving, setEnvSaving] = useState(false)

  // Database state
  const [sqlQuery, setSqlQuery] = useState('')
  const [sqlResult, setSqlResult] = useState<string>('')
  const [sqlLoading, setSqlLoading] = useState(false)
  const [redeploying, setRedeploying] = useState<string | null>(null)

  // Pre-load the fix migration
  const fixMigration = `-- Fix infinite recursion in RLS policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());`

  useEffect(() => {
    if (activeTab === 'deployments') {
      loadDeployments()
    } else if (activeTab === 'env') {
      loadEnvVars()
    }
  }, [activeTab])

  const loadDeployments = async () => {
    setVercelLoading(true)
    setVercelError(null)
    try {
      const response = await apiClient.vercelAdmin({ action: 'getDeployments' })
      if (response.success) {
        setDeployments(response.result?.deployments || [])
        setVercelConfigured(true)
      } else {
        setVercelError(response.error || 'Failed to load deployments')
        if (response.setupSteps) {
          setSetupSteps(response.setupSteps)
          setVercelConfigured(false)
        }
      }
    } catch (error: any) {
      setVercelError(error.message || 'Failed to connect to Vercel')
      setVercelConfigured(false)
    } finally {
      setVercelLoading(false)
    }
  }

  const loadEnvVars = async () => {
    setVercelLoading(true)
    setVercelError(null)
    try {
      const response = await apiClient.vercelAdmin({ action: 'getEnvVars' })
      if (response.success) {
        setEnvVars(response.result?.envs || [])
        setVercelConfigured(true)
      } else {
        setVercelError(response.error || 'Failed to load environment variables')
        if (response.setupSteps) {
          setSetupSteps(response.setupSteps)
          setVercelConfigured(false)
        }
      }
    } catch (error: any) {
      setVercelError(error.message || 'Failed to connect to Vercel')
      setVercelConfigured(false)
    } finally {
      setVercelLoading(false)
    }
  }

  const handleRedeploy = async (deploymentId: string) => {
    setRedeploying(deploymentId)
    try {
      const response = await apiClient.vercelAdmin({
        action: 'redeploy',
        deploymentId,
        target: 'production',
      })
      if (response.success) {
        toast.success('Redeployment triggered! Check Vercel dashboard for progress.')
        loadDeployments()
      } else {
        toast.error(`Redeploy failed: ${response.error}`)
      }
    } catch (error: any) {
      toast.error(`Deployment error: ${error.message}`)
    } finally {
      setRedeploying(null)
    }
  }

  const handleSaveEnvVar = async () => {
    if (!newEnvKey.trim()) {
      toast.error('Please enter a variable name')
      return
    }

    setEnvSaving(true)
    try {
      const response = await apiClient.vercelAdmin({
        action: 'setEnvVar',
        envKey: newEnvKey.trim(),
        envValue: newEnvValue,
      })
      if (response.success) {
        toast.success(`Environment variable ${newEnvKey} saved! Redeploy to apply changes.`)
        setNewEnvKey('')
        setNewEnvValue('')
        loadEnvVars()
      } else {
        toast.error(`Failed to save: ${response.error}`)
      }
    } catch (error: any) {
      toast.error(`Error saving variable: ${error.message}`)
    } finally {
      setEnvSaving(false)
    }
  }

  const handleDeleteEnvVar = async (key: string) => {
    if (!confirm(`Delete environment variable "${key}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await apiClient.vercelAdmin({
        action: 'deleteEnvVar',
        envKey: key,
      })
      if (response.success) {
        toast.success(`Deleted ${key}. Redeploy to apply changes.`)
        loadEnvVars()
      } else {
        toast.error(`Failed to delete: ${response.error}`)
      }
    } catch (error: any) {
      toast.error(`Error deleting variable: ${error.message}`)
    }
  }

  const runSqlMigration = async () => {
    setSqlLoading(true)
    setSqlResult('')

    try {
      const response = await apiClient.supabaseAdmin({
        action: 'runSql',
        sql: sqlQuery,
      })

      if (response.success) {
        setSqlResult('✅ SQL executed successfully')
      } else {
        let result = `⚠️ ${response.error || 'SQL execution not available'}\n\n`

        if (response.hint) {
          result += `Hint: ${response.hint}\n\n`
        }

        if (response.manualSteps) {
          result += `Manual Steps:\n${response.manualSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
        }

        if (response.createFunction) {
          result += `Create exec_sql function first:\n\`\`\`sql\n${response.createFunction}\n\`\`\`\n`
        }

        setSqlResult(result)
      }
    } catch (error: any) {
      setSqlResult(`❌ Error: ${error.message}`)
    } finally {
      setSqlLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'READY':
        return 'text-green-500'
      case 'BUILDING':
      case 'INITIALIZING':
        return 'text-blue-500'
      case 'ERROR':
      case 'FAILED':
        return 'text-red-500'
      case 'CANCELED':
        return 'text-yellow-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/40 rounded-lg">
          <h3 className="font-bold text-destructive mb-2">Admin Access</h3>
          <p className="text-sm text-destructive-foreground">
            This panel provides direct control over deployments, environment variables, and database.
            Changes here can affect your live application immediately.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('deployments')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'deployments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Deployments
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'env'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Environment Variables
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'database'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Database
          </button>
        </div>

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Deployments</h2>
                <Button onClick={loadDeployments} variant="outline" disabled={vercelLoading}>
                  {vercelLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {!vercelConfigured && (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <h3 className="font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    Vercel API Not Configured
                  </h3>
                  <p className="text-sm mb-3">To enable in-app deployment management:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    {setupSteps.length > 0 ? (
                      setupSteps.map((step, i) => <li key={i}>{step}</li>)
                    ) : (
                      <>
                        <li>Go to <a href="https://vercel.com/account/tokens" target="_blank" className="text-primary hover:underline">vercel.com/account/tokens</a></li>
                        <li>Create a new token with full access</li>
                        <li>Add <code className="px-1 py-0.5 bg-muted rounded">VERCEL_TOKEN</code> to your Vercel environment variables</li>
                        <li>Also add <code className="px-1 py-0.5 bg-muted rounded">VERCEL_PROJECT_ID</code></li>
                        <li>Redeploy to apply</li>
                      </>
                    )}
                  </ol>
                </div>
              )}

              {vercelError && vercelConfigured && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {vercelError}
                </div>
              )}

              {vercelLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading deployments...</p>
                </div>
              ) : deployments.length > 0 ? (
                <div className="space-y-3">
                  {deployments.map((deployment) => (
                    <div
                      key={deployment.uid}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${getStatusColor(deployment.state)}`}>
                            {deployment.state}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            {deployment.target || 'preview'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {deployment.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(deployment.created)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRedeploy(deployment.uid)}
                        disabled={redeploying === deployment.uid}
                      >
                        {redeploying === deployment.uid ? 'Redeploying...' : 'Redeploy'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : vercelConfigured ? (
                <p className="text-center py-8 text-muted-foreground">No deployments found</p>
              ) : null}

              <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                <h4 className="font-bold mb-2">Quick Links</h4>
                <div className="flex gap-4">
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    className="text-primary hover:underline text-sm"
                  >
                    Vercel Dashboard →
                  </a>
                  <a
                    href="https://nexus-platform-gtsj.vercel.app"
                    target="_blank"
                    className="text-primary hover:underline text-sm"
                  >
                    Live Site →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables Tab */}
        {activeTab === 'env' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Environment Variables</h2>
                <Button onClick={loadEnvVars} variant="outline" disabled={vercelLoading}>
                  {vercelLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {!vercelConfigured && (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <h3 className="font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    Vercel API Not Configured
                  </h3>
                  <p className="text-sm">Configure VERCEL_TOKEN to manage environment variables from here.</p>
                </div>
              )}

              {/* Add New Variable Form */}
              <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h3 className="font-bold mb-3">Add/Update Environment Variable</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label className="text-sm">Variable Name</Label>
                    <input
                      type="text"
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                      placeholder="ANTHROPIC_API_KEY"
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Value</Label>
                    <input
                      type="password"
                      value={newEnvValue}
                      onChange={(e) => setNewEnvValue(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveEnvVar}
                  disabled={envSaving || !newEnvKey.trim() || !vercelConfigured}
                  size="sm"
                >
                  {envSaving ? 'Saving...' : 'Save Variable'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Variables are encrypted and applied to all environments. Redeploy after changes.
                </p>
              </div>

              {/* Current Variables */}
              {vercelLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                </div>
              ) : envVars.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Current Variables:</h3>
                  {envVars.map((env) => (
                    <div
                      key={env.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <code className="font-mono text-sm font-medium">{env.key}</code>
                        <div className="flex gap-2 mt-1">
                          {env.target?.map((t) => (
                            <span key={t} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                              {t}
                            </span>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {env.type}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDeleteEnvVar(env.key)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              ) : vercelConfigured ? (
                <p className="text-center py-4 text-muted-foreground">No environment variables found</p>
              ) : null}

              {/* Quick Reference */}
              <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                <h4 className="font-bold mb-2">Required Variables Reference</h4>
                <div className="grid gap-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span>ANTHROPIC_API_KEY</span>
                    <span className="text-muted-foreground">Claude AI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RESEND_API_KEY</span>
                    <span className="text-muted-foreground">Email</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HUBSPOT_ACCESS_TOKEN</span>
                    <span className="text-muted-foreground">CRM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VERCEL_TOKEN</span>
                    <span className="text-muted-foreground">Admin API</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SUPABASE_SERVICE_ROLE_KEY</span>
                    <span className="text-muted-foreground">Database Admin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border-2 border-border">
              <h2 className="text-xl font-bold mb-4">Database Management</h2>

              {/* Quick Fix Button */}
              <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-bold mb-2">Quick Fix: Project Creation Error</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Click below to load the SQL that fixes "infinite recursion" error
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSqlQuery(fixMigration)}
                >
                  Load Fix Migration
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2">SQL Query</Label>
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={12}
                    className="font-mono text-sm mt-2"
                    placeholder="-- Enter your SQL here
-- Example:
-- SELECT * FROM projects LIMIT 10;
-- ALTER TABLE projects ADD COLUMN new_field TEXT;"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={runSqlMigration}
                    disabled={sqlLoading || !sqlQuery.trim()}
                    className="flex-1"
                  >
                    {sqlLoading ? 'Executing...' : 'Execute SQL'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSqlQuery('')
                      setSqlResult('')
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {sqlResult && (
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <h4 className="font-bold mb-2">Result:</h4>
                    <pre className="text-sm whitespace-pre-wrap font-mono overflow-auto max-h-64">
                      {sqlResult}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                <h4 className="font-bold mb-2">Alternative: Supabase SQL Editor</h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" className="text-primary hover:underline">supabase.com/dashboard</a></li>
                  <li>Select your project</li>
                  <li>Open SQL Editor</li>
                  <li>Paste your SQL and run</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart AI Chatbot for assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
