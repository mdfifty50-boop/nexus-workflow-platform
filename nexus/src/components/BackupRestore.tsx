/**
 * BackupRestore Component
 *
 * Provides functionality for backing up all user data to JSON and restoring from backup.
 * Includes workflows, settings, and other user data.
 */

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  HardDrive
} from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * Backup data structure
 */
export interface BackupData {
  version: string
  createdAt: string
  metadata: {
    userEmail?: string
    workflowCount: number
    projectCount: number
    executionCount: number
    totalSize: number
  }
  data: {
    workflows: unknown[]
    projects: unknown[]
    executions: unknown[]
    settings: Record<string, unknown>
    templates?: unknown[]
    integrations?: unknown[]
  }
}

/**
 * Validation result for backups
 */
interface BackupValidation {
  valid: boolean
  version: string
  compatible: boolean
  warnings: string[]
  errors: string[]
  summary: {
    workflows: number
    projects: number
    executions: number
    settings: boolean
  }
}

/**
 * Restore options
 */
interface RestoreOptions {
  overwriteExisting: boolean
  restoreWorkflows: boolean
  restoreProjects: boolean
  restoreExecutions: boolean
  restoreSettings: boolean
}

/**
 * Props for BackupRestore component
 */
interface BackupRestoreProps {
  onCreateBackup: () => Promise<BackupData>
  onRestore: (data: BackupData, options: RestoreOptions) => Promise<{ success: boolean; error?: string; restoredCount: number }>
  currentVersion?: string
}

const BACKUP_VERSION = '1.0.0'
const SUPPORTED_VERSIONS = ['1.0.0']

/**
 * Validate backup file structure
 */
function validateBackup(data: unknown): BackupValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      version: 'unknown',
      compatible: false,
      errors: ['Invalid backup format: expected an object'],
      warnings: [],
      summary: { workflows: 0, projects: 0, executions: 0, settings: false }
    }
  }

  const backup = data as Record<string, unknown>

  // Check version
  const version = (backup.version as string) || 'unknown'
  const compatible = SUPPORTED_VERSIONS.includes(version)
  if (!compatible) {
    warnings.push(`Backup version ${version} may not be fully compatible. Supported: ${SUPPORTED_VERSIONS.join(', ')}`)
  }

  // Check required structure
  if (!backup.data || typeof backup.data !== 'object') {
    errors.push('Missing data section in backup')
    return {
      valid: false,
      version,
      compatible,
      errors,
      warnings,
      summary: { workflows: 0, projects: 0, executions: 0, settings: false }
    }
  }

  const backupData = backup.data as Record<string, unknown>

  // Validate workflows
  const workflows = Array.isArray(backupData.workflows) ? backupData.workflows : []
  if (!Array.isArray(backupData.workflows)) {
    warnings.push('Workflows section is missing or invalid')
  }

  // Validate projects
  const projects = Array.isArray(backupData.projects) ? backupData.projects : []
  if (!Array.isArray(backupData.projects)) {
    warnings.push('Projects section is missing or invalid')
  }

  // Validate executions
  const executions = Array.isArray(backupData.executions) ? backupData.executions : []
  if (!Array.isArray(backupData.executions)) {
    warnings.push('Executions section is missing or invalid')
  }

  // Validate settings
  const hasSettings = Boolean(backupData.settings && typeof backupData.settings === 'object')
  if (!hasSettings) {
    warnings.push('Settings section is missing')
  }

  return {
    valid: errors.length === 0,
    version,
    compatible,
    errors,
    warnings,
    summary: {
      workflows: workflows.length,
      projects: projects.length,
      executions: executions.length,
      settings: hasSettings
    }
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function BackupRestore({ onCreateBackup, onRestore, currentVersion: _currentVersion = BACKUP_VERSION }: BackupRestoreProps) {
  const [mode, setMode] = useState<'idle' | 'backup' | 'restore'>('idle')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [validation, setValidation] = useState<BackupValidation | null>(null)
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    overwriteExisting: false,
    restoreWorkflows: true,
    restoreProjects: true,
    restoreExecutions: true,
    restoreSettings: true
  })
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateBackup = useCallback(async () => {
    setMode('backup')
    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      setProgress(20)
      const data = await onCreateBackup()
      setProgress(80)

      // Create and download file
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const filename = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setProgress(100)
      setResult({
        success: true,
        message: `Backup created successfully: ${filename} (${formatFileSize(json.length)})`
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create backup')
    } finally {
      setLoading(false)
    }
  }, [onCreateBackup])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMode('restore')
    setLoading(true)
    setError(null)
    setValidation(null)
    setBackupData(null)

    try {
      const content = await file.text()
      const data = JSON.parse(content)
      const validationResult = validateBackup(data)

      setValidation(validationResult)

      if (validationResult.valid || validationResult.warnings.length > 0) {
        setBackupData(data as BackupData)
      }
    } catch (e) {
      setError(`Failed to read backup file: ${e instanceof Error ? e.message : 'Invalid JSON'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRestore = useCallback(async () => {
    if (!backupData) return

    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      setProgress(20)
      const restoreResult = await onRestore(backupData, restoreOptions)
      setProgress(100)

      if (restoreResult.success) {
        setResult({
          success: true,
          message: `Restored ${restoreResult.restoredCount} items successfully`
        })
      } else {
        setError(restoreResult.error || 'Restore failed')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed')
    } finally {
      setLoading(false)
    }
  }, [backupData, restoreOptions, onRestore])

  const reset = useCallback(() => {
    setMode('idle')
    setLoading(false)
    setProgress(0)
    setError(null)
    setBackupData(null)
    setValidation(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Create a complete backup of your workflows and settings, or restore from a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Idle State - Action Buttons */}
        {mode === 'idle' && !result && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreateBackup}
              className="p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <Download className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Create Backup</h3>
              <p className="text-sm text-muted-foreground">
                Download a complete backup of all your data
              </p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <Upload className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Restore Backup</h3>
              <p className="text-sm text-muted-foreground">
                Restore data from a backup file
              </p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Backup Info Section */}
        {mode === 'backup' && !result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Creating Backup...</p>
                <p className="text-sm text-muted-foreground">
                  Collecting workflows, projects, and settings
                </p>
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-center text-muted-foreground">
                  {progress < 50 ? 'Gathering data...' : 'Preparing download...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Restore Preview */}
        {mode === 'restore' && validation && !result && (
          <div className="space-y-4">
            {/* Validation Status */}
            <div className={cn(
              'p-4 rounded-lg border',
              validation.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'
            )}>
              <div className="flex items-start gap-3">
                {validation.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {validation.valid ? 'Valid Backup File' : 'Invalid Backup File'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Version: {validation.version}
                    {!validation.compatible && ' (may not be fully compatible)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="space-y-2">
                {validation.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                {validation.warnings.map((warn, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {warn}
                  </div>
                ))}
              </div>
            )}

            {/* Backup Summary */}
            {backupData && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{validation.summary.workflows}</p>
                    <p className="text-sm text-muted-foreground">Workflows</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{validation.summary.projects}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{validation.summary.executions}</p>
                    <p className="text-sm text-muted-foreground">Executions</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{validation.summary.settings ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-muted-foreground">Settings</p>
                  </div>
                </div>

                {/* Backup Metadata */}
                {backupData.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Backup created: {new Date(backupData.createdAt).toLocaleString()}
                  </div>
                )}

                {/* Restore Options */}
                <div className="space-y-3 pt-4 border-t">
                  <p className="font-medium">Restore Options</p>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={restoreOptions.restoreWorkflows}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreWorkflows: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Workflows</p>
                      <p className="text-xs text-muted-foreground">{validation.summary.workflows} workflows</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={restoreOptions.restoreProjects}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreProjects: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Projects</p>
                      <p className="text-xs text-muted-foreground">{validation.summary.projects} projects</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={restoreOptions.restoreExecutions}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreExecutions: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Execution History</p>
                      <p className="text-xs text-muted-foreground">{validation.summary.executions} executions</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={restoreOptions.restoreSettings}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreSettings: e.target.checked }))}
                      className="h-4 w-4"
                      disabled={!validation.summary.settings}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Settings</p>
                      <p className="text-xs text-muted-foreground">
                        {validation.summary.settings ? 'User preferences and configuration' : 'Not available in backup'}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-yellow-500/30 bg-yellow-500/5 rounded-lg cursor-pointer hover:bg-yellow-500/10">
                    <input
                      type="checkbox"
                      checked={restoreOptions.overwriteExisting}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <p className="font-medium">Overwrite Existing Data</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Replace existing items with backup data (cannot be undone)
                      </p>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && mode === 'restore' && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              {progress < 50 ? 'Reading backup file...' : 'Restoring data...'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className={cn(
            'rounded-lg p-4 flex items-start gap-3',
            result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
          )}>
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{result.success ? 'Success' : 'Failed'}</p>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {(mode !== 'idle' || result) && (
            <Button variant="outline" onClick={reset}>
              {result ? 'Done' : 'Cancel'}
            </Button>
          )}

          {mode === 'restore' && backupData && validation?.valid && !result && (
            <Button onClick={handleRestore} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default BackupRestore
