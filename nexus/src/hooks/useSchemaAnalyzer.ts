/**
 * useSchemaAnalyzer - React Hook for Schema Analysis
 *
 * Provides reactive access to the schema analyzer with:
 * - Chain schema analysis
 * - Transformation map preview
 * - Loading and error states
 *
 * Story 16.4 Implementation
 */

import { useState, useCallback, useRef } from 'react'
import { integrationSchemaAnalyzerService } from '../services/IntegrationSchemaAnalyzerService'
import type {
  ToolChain,
  SchemaAnalysisResult,
  SchemaAnalysisRequest,
  ToolPairAnalysis,
  TransformationMap,
  ToolSchema,
  Tool,
  DiscoveredTool
} from '../types/tools'

interface UseSchemaAnalyzerOptions {
  generateCode?: boolean
  strictMode?: boolean
  onAnalysisStart?: () => void
  onAnalysisComplete?: (result: SchemaAnalysisResult) => void
  onError?: (error: Error) => void
}

interface UseSchemaAnalyzerReturn {
  // Analysis result
  result: SchemaAnalysisResult | null
  pairAnalyses: ToolPairAnalysis[]
  transformationMaps: TransformationMap[]

  // State
  loading: boolean
  error: string | null
  analysisTimeMs: number | null

  // Summary data
  isCompatible: boolean
  compatibilityScore: number
  totalTransformations: number
  dataIntegrityRisk: 'none' | 'low' | 'medium' | 'high'
  warnings: string[]
  recommendations: string[]

  // Actions
  analyzeChain: (chain: ToolChain) => Promise<SchemaAnalysisResult | null>
  analyzeToolPair: (source: Tool | DiscoveredTool, target: Tool | DiscoveredTool) => Promise<ToolPairAnalysis | null>
  getTransformationPreview: (sourceToolId: string, targetToolId: string) => TransformationMap | null
  clearResult: () => void
}

/**
 * Main hook for schema analysis
 */
export function useSchemaAnalyzer(options: UseSchemaAnalyzerOptions = {}): UseSchemaAnalyzerReturn {
  const {
    generateCode = true,
    strictMode = false,
    onAnalysisStart,
    onAnalysisComplete,
    onError
  } = options

  // State
  const [result, setResult] = useState<SchemaAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null)

  // Prevent overlapping analyses
  const analysisInProgress = useRef(false)

  /**
   * Analyze an entire tool chain
   */
  const analyzeChain = useCallback(async (chain: ToolChain): Promise<SchemaAnalysisResult | null> => {
    if (analysisInProgress.current) {
      return null
    }

    analysisInProgress.current = true
    setLoading(true)
    setError(null)
    setAnalysisTimeMs(null)

    onAnalysisStart?.()

    try {
      const request: SchemaAnalysisRequest = {
        chain,
        generateCode,
        strictMode
      }

      const analysisResult = await integrationSchemaAnalyzerService.analyzeChain(request)

      setResult(analysisResult)
      setAnalysisTimeMs(analysisResult.estimatedTransformationTimeMs)

      onAnalysisComplete?.(analysisResult)

      return analysisResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
      analysisInProgress.current = false
    }
  }, [generateCode, strictMode, onAnalysisStart, onAnalysisComplete, onError])

  /**
   * Analyze a single tool pair
   */
  const analyzeToolPair = useCallback(async (
    source: Tool | DiscoveredTool,
    target: Tool | DiscoveredTool
  ): Promise<ToolPairAnalysis | null> => {
    setLoading(true)
    setError(null)

    try {
      const pairAnalysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        source,
        target,
        generateCode
      )

      return pairAnalysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pair analysis failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [generateCode, onError])

  /**
   * Get transformation preview for a tool pair
   */
  const getTransformationPreview = useCallback((
    sourceToolId: string,
    targetToolId: string
  ): TransformationMap | null => {
    if (!result) return null

    return result.transformationMaps.find(
      map => map.sourceToolId === sourceToolId && map.targetToolId === targetToolId
    ) || null
  }, [result])

  /**
   * Clear the analysis result
   */
  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
    setAnalysisTimeMs(null)
  }, [])

  // Computed values
  const pairAnalyses = result?.pairAnalyses || []
  const transformationMaps = result?.transformationMaps || []
  const isCompatible = result?.isChainCompatible ?? true
  const compatibilityScore = result?.overallCompatibilityScore ?? 1
  const totalTransformations = result?.totalTransformations ?? 0
  const dataIntegrityRisk = result?.overallDataIntegrityRisk ?? 'none'
  const warnings = result?.warnings ?? []
  const recommendations = result?.recommendations ?? []

  return {
    result,
    pairAnalyses,
    transformationMaps,
    loading,
    error,
    analysisTimeMs,
    isCompatible,
    compatibilityScore,
    totalTransformations,
    dataIntegrityRisk,
    warnings,
    recommendations,
    analyzeChain,
    analyzeToolPair,
    getTransformationPreview,
    clearResult
  }
}

/**
 * Hook for previewing a single transformation
 */
export function useTransformationPreview() {
  const [preview, setPreview] = useState<{
    sourceSchema: ToolSchema | null
    targetSchema: ToolSchema | null
    transformationMap: TransformationMap | null
  }>({
    sourceSchema: null,
    targetSchema: null,
    transformationMap: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load preview for a tool pair
   */
  const loadPreview = useCallback(async (
    sourceTool: Tool | DiscoveredTool,
    targetTool: Tool | DiscoveredTool
  ): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      // Extract schemas
      const sourceSchema = await integrationSchemaAnalyzerService.extractSchema(sourceTool, 'output')
      const targetSchema = await integrationSchemaAnalyzerService.extractSchema(targetTool, 'input')

      // Analyze the pair
      const pairAnalysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      setPreview({
        sourceSchema,
        targetSchema,
        transformationMap: pairAnalysis.transformationMap || null
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Preview failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clear the preview
   */
  const clearPreview = useCallback(() => {
    setPreview({
      sourceSchema: null,
      targetSchema: null,
      transformationMap: null
    })
    setError(null)
  }, [])

  return {
    ...preview,
    loading,
    error,
    loadPreview,
    clearPreview
  }
}

/**
 * Hook for displaying transformation code
 */
export function useTransformationCode(transformationMap: TransformationMap | null) {
  const [showCode, setShowCode] = useState(false)
  const [codeType, setCodeType] = useState<'transform' | 'reverse'>('transform')

  const toggleCode = useCallback(() => {
    setShowCode(prev => !prev)
  }, [])

  const switchCodeType = useCallback((type: 'transform' | 'reverse') => {
    setCodeType(type)
  }, [])

  const currentCode = codeType === 'transform'
    ? transformationMap?.transformFunction || ''
    : transformationMap?.reverseFunction || ''

  const hasReverseFunction = !!transformationMap?.reverseFunction

  return {
    showCode,
    codeType,
    currentCode,
    hasReverseFunction,
    toggleCode,
    switchCodeType
  }
}

/**
 * Hook for field mapping display and editing
 */
export function useFieldMappings(transformationMap: TransformationMap | null) {
  const [selectedMapping, setSelectedMapping] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'mapped' | 'unmapped' | 'low-confidence'>('all')

  const fieldMappings = transformationMap?.fieldMappings || []

  const filteredMappings = fieldMappings.filter(mapping => {
    switch (filter) {
      case 'mapped':
        return mapping.confidence > 0
      case 'unmapped':
        return mapping.confidence === 0
      case 'low-confidence':
        return mapping.confidence > 0 && mapping.confidence < 0.7
      default:
        return true
    }
  })

  const selectMapping = useCallback((index: number | null) => {
    setSelectedMapping(index)
  }, [])

  const setMappingFilter = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter)
    setSelectedMapping(null)
  }, [])

  const getMappingStats = useCallback(() => {
    const total = fieldMappings.length
    const highConfidence = fieldMappings.filter(m => m.confidence >= 0.8).length
    const mediumConfidence = fieldMappings.filter(m => m.confidence >= 0.5 && m.confidence < 0.8).length
    const lowConfidence = fieldMappings.filter(m => m.confidence < 0.5).length

    return {
      total,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      averageConfidence: total > 0
        ? fieldMappings.reduce((sum, m) => sum + m.confidence, 0) / total
        : 0
    }
  }, [fieldMappings])

  return {
    fieldMappings: filteredMappings,
    allMappings: fieldMappings,
    selectedMapping,
    filter,
    selectMapping,
    setMappingFilter,
    getMappingStats
  }
}
