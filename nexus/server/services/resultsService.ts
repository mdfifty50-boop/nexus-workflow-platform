import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase with credential validation
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate service key is a JWT (starts with 'eyJ')
const isValidServiceKey = supabaseServiceKey.startsWith('eyJ')
const hasValidCredentials = supabaseUrl && isValidServiceKey

if (!hasValidCredentials) {
  console.warn('[resultsService] Missing or invalid Supabase credentials. Results persistence disabled.')
}

const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

// =============================================================================
// Types (Epic 10)
// =============================================================================

export interface WorkflowResult {
  id: string
  workflow_id: string
  project_id: string
  clerk_user_id: string
  title: string
  description: string | null
  result_type: 'data' | 'file' | 'report' | 'chart' | 'table'
  data: Record<string, unknown>
  artifacts: Artifact[]
  share_token: string | null
  share_expires_at: string | null
  created_at: string
}

export interface Artifact {
  id: string
  name: string
  type: string
  size: number
  url: string
  created_at: string
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
  }[]
}

export interface TableData {
  columns: { key: string; label: string; type?: 'text' | 'number' | 'date' }[]
  rows: Record<string, unknown>[]
}

// =============================================================================
// Results Service
// =============================================================================

export const resultsService = {
  // ---------------------------------------------------------------------------
  // Store Workflow Result (Story 10.1)
  // ---------------------------------------------------------------------------
  async storeResult(
    workflowId: string,
    projectId: string,
    clerkUserId: string,
    title: string,
    resultType: 'data' | 'file' | 'report' | 'chart' | 'table',
    data: Record<string, unknown>,
    description?: string
  ): Promise<WorkflowResult | null> {
    try {
      const { data: result, error } = await supabase
        .from('workflow_results')
        .insert({
          workflow_id: workflowId,
          project_id: projectId,
          clerk_user_id: clerkUserId,
          title,
          description,
          result_type: resultType,
          data,
          artifacts: [],
        })
        .select()
        .single()

      if (error) throw error
      return result
    } catch (err) {
      console.error('Store result error:', err)
      return null
    }
  },

  // ---------------------------------------------------------------------------
  // Upload Artifact (Story 10.2)
  // ---------------------------------------------------------------------------
  async uploadArtifact(
    resultId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<Artifact | null> {
    try {
      const filePath = `results/${resultId}/${Date.now()}-${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('artifacts')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('artifacts').getPublicUrl(filePath)

      const artifact: Artifact = {
        id: crypto.randomUUID(),
        name: fileName,
        type: mimeType,
        size: fileBuffer.length,
        url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      }

      // Update result with artifact
      const { data: result } = await supabase
        .from('workflow_results')
        .select('artifacts')
        .eq('id', resultId)
        .single()

      const artifacts = [...(result?.artifacts || []), artifact]

      await supabase.from('workflow_results').update({ artifacts }).eq('id', resultId)

      return artifact
    } catch (err) {
      console.error('Upload artifact error:', err)
      return null
    }
  },

  // ---------------------------------------------------------------------------
  // Get Workflow Results
  // ---------------------------------------------------------------------------
  async getWorkflowResults(workflowId: string): Promise<WorkflowResult[]> {
    const { data } = await supabase
      .from('workflow_results')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })

    return data || []
  },

  // ---------------------------------------------------------------------------
  // Get Result by ID
  // ---------------------------------------------------------------------------
  async getResult(resultId: string): Promise<WorkflowResult | null> {
    const { data } = await supabase
      .from('workflow_results')
      .select('*')
      .eq('id', resultId)
      .single()

    return data
  },

  // ---------------------------------------------------------------------------
  // Generate Shareable URL (Story 10.4)
  // ---------------------------------------------------------------------------
  async generateShareUrl(
    resultId: string,
    expiresInHours: number = 24
  ): Promise<{ url: string; expiresAt: string } | null> {
    try {
      const shareToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

      await supabase
        .from('workflow_results')
        .update({
          share_token: shareToken,
          share_expires_at: expiresAt.toISOString(),
        })
        .eq('id', resultId)

      const baseUrl = process.env.APP_URL || 'http://localhost:3001'
      const url = `${baseUrl}/share/results/${shareToken}`

      return { url, expiresAt: expiresAt.toISOString() }
    } catch (err) {
      console.error('Generate share URL error:', err)
      return null
    }
  },

  // ---------------------------------------------------------------------------
  // Get Result by Share Token
  // ---------------------------------------------------------------------------
  async getResultByShareToken(shareToken: string): Promise<WorkflowResult | null> {
    const { data } = await supabase
      .from('workflow_results')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (!data) return null

    // Check if expired
    if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
      return null
    }

    return data
  },

  // ---------------------------------------------------------------------------
  // Render Chart Data (Story 10.3)
  // ---------------------------------------------------------------------------
  renderChartData(data: Record<string, unknown>): ChartData | null {
    try {
      // Detect data structure and convert to chart format
      if (Array.isArray(data.items)) {
        const items = data.items as Record<string, unknown>[]
        const labelKey = data.labelKey as string || Object.keys(items[0])[0]
        const valueKey = data.valueKey as string || Object.keys(items[0])[1]

        return {
          type: (data.chartType as ChartData['type']) || 'bar',
          labels: items.map((item) => String(item[labelKey])),
          datasets: [
            {
              label: String(data.title || 'Data'),
              data: items.map((item) => Number(item[valueKey]) || 0),
              backgroundColor: [
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
                '#EC4899',
              ],
            },
          ],
        }
      }

      return null
    } catch {
      return null
    }
  },

  // ---------------------------------------------------------------------------
  // Render Table Data (Story 10.3)
  // ---------------------------------------------------------------------------
  renderTableData(data: Record<string, unknown>): TableData | null {
    try {
      if (Array.isArray(data.rows) && Array.isArray(data.columns)) {
        return data as unknown as TableData
      }

      // Auto-detect from array of objects
      if (Array.isArray(data.items)) {
        const items = data.items as Record<string, unknown>[]
        if (items.length === 0) return null

        const columns = Object.keys(items[0]).map((key) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          type: typeof items[0][key] === 'number' ? 'number' as const : 'text' as const,
        }))

        return { columns, rows: items }
      }

      return null
    } catch {
      return null
    }
  },

  // ---------------------------------------------------------------------------
  // Send Completion Notification (Story 10.5)
  // ---------------------------------------------------------------------------
  async sendCompletionNotification(
    workflowId: string,
    resultId: string,
    email?: string
  ): Promise<{ success: boolean }> {
    // This would integrate with the email service
    // For now, just log the notification
    console.log(`Notification: Workflow ${workflowId} completed. Result: ${resultId}`)

    if (email) {
      // TODO: Integrate with Resend or other email service
      // await fetch('/api/integrations/email', { ... })
    }

    return { success: true }
  },
}
