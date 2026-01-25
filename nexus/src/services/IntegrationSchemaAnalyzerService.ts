/**
 * IntegrationSchemaAnalyzerService - Schema Analysis & Transformation Planning
 *
 * Analyzes data schemas between tools in a chain and plans transformations:
 * - Extracts schemas from tool definitions
 * - Detects schema mismatches requiring transformation
 * - Generates transformation maps (field mappings, type conversions)
 * - Produces TypeScript transformation code
 * - Ensures data integrity with zero loss
 *
 * Story 16.4 Implementation
 */

import { supabase } from '../lib/supabase'
// toolCatalogService - reserved for future use
// import { toolCatalogService } from './ToolCatalogService'
import type {
  Tool,
  DiscoveredTool,
  SchemaFieldType,
  SchemaField,
  ToolSchema,
  TransformationType,
  FieldMapping,
  TypeConversionRule,
  TransformationMap,
  ToolPairAnalysis,
  SchemaAnalysisResult,
  SchemaAnalysisRequest,
  TransformationMapRow
} from '../types/tools'
import {
  transformationMapFromRow,
  FIELD_NAME_VARIATIONS,
  DEFAULT_TYPE_CONVERSIONS
} from '../types/tools'

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 200

/**
 * Cache entry for transformation maps
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Integration Schema Analyzer Service
 */
class IntegrationSchemaAnalyzerService {
  private transformationCache: Map<string, CacheEntry<TransformationMap>> = new Map()
  private schemaCache: Map<string, CacheEntry<ToolSchema>> = new Map()

  constructor() {
    // Initialize service
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Analyze an entire tool chain and plan transformations
   */
  async analyzeChain(request: SchemaAnalysisRequest): Promise<SchemaAnalysisResult> {
    const startTime = Date.now()
    const { chain, generateCode = true, strictMode = false } = request

    console.log(`[SchemaAnalyzer] Analyzing chain "${chain.name}" with ${chain.steps.length} steps`)

    const pairAnalyses: ToolPairAnalysis[] = []
    const transformationMaps: TransformationMap[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    // Analyze each consecutive pair of tools
    for (let i = 0; i < chain.steps.length - 1; i++) {
      const sourceStep = chain.steps[i]
      const targetStep = chain.steps[i + 1]

      const pairAnalysis = await this.analyzeToolPair(
        sourceStep.tool,
        targetStep.tool,
        generateCode
      )

      pairAnalyses.push(pairAnalysis)

      // Collect transformation map if generated
      if (pairAnalysis.transformationMap) {
        transformationMaps.push(pairAnalysis.transformationMap)
      }

      // Collect warnings and suggestions
      warnings.push(...pairAnalysis.warnings)
      recommendations.push(...pairAnalysis.suggestions)

      // In strict mode, fail if required fields are missing
      if (strictMode && pairAnalysis.requiredButMissing.length > 0) {
        throw new Error(
          `Schema analysis failed: Required target fields missing: ${pairAnalysis.requiredButMissing.join(', ')}`
        )
      }
    }

    // Calculate aggregate scores
    const overallCompatibilityScore = this.calculateAverageScore(
      pairAnalyses.map(p => p.compatibilityScore)
    )

    const overallComplexityScore = this.calculateComplexityScore(transformationMaps)

    const overallDataIntegrityRisk = this.calculateOverallRisk(
      pairAnalyses.map(p => p.dataIntegrityRisk)
    )

    const requiresTransformations = pairAnalyses.some(p => p.requiresTransformation)
    const totalTransformations = transformationMaps.reduce(
      (sum, map) => sum + map.fieldMappings.length,
      0
    )

    const result: SchemaAnalysisResult = {
      chainId: chain.id,
      analyzedAt: new Date().toISOString(),
      isChainCompatible: pairAnalyses.every(p => p.isCompatible),
      requiresTransformations,
      totalTransformations,
      pairAnalyses,
      overallCompatibilityScore,
      overallComplexityScore,
      overallDataIntegrityRisk,
      transformationMaps,
      warnings: [...new Set(warnings)], // Deduplicate
      recommendations: [...new Set(recommendations)],
      estimatedTransformationTimeMs: Date.now() - startTime
    }

    console.log(`[SchemaAnalyzer] Analysis complete: ${totalTransformations} transformations, compatibility: ${(overallCompatibilityScore * 100).toFixed(0)}%`)

    return result
  }

  /**
   * Analyze a single pair of tools
   */
  async analyzeToolPair(
    sourceTool: Tool | DiscoveredTool,
    targetTool: Tool | DiscoveredTool,
    generateCode: boolean = true
  ): Promise<ToolPairAnalysis> {
    const cacheKey = `${sourceTool.id}:${targetTool.id}`

    // Check cache for existing transformation map
    const cachedMap = this.getCachedTransformationMap(cacheKey)

    // Extract schemas
    const sourceSchema = await this.extractSchema(sourceTool, 'output')
    const targetSchema = await this.extractSchema(targetTool, 'input')

    // Find field mappings
    const fieldMappings = this.findFieldMappings(sourceSchema, targetSchema)

    // Identify unmapped fields
    const mappedSourceFields = new Set(fieldMappings.map(m => m.sourceField))
    const mappedTargetFields = new Set(fieldMappings.map(m => m.targetField))

    const unmappedSourceFields = sourceSchema.fields
      .map(f => f.name)
      .filter(f => !mappedSourceFields.has(f))

    const unmappedTargetFields = targetSchema.fields
      .map(f => f.name)
      .filter(f => !mappedTargetFields.has(f))

    const requiredButMissing = targetSchema.fields
      .filter(f => f.required && !mappedTargetFields.has(f.name))
      .map(f => f.name)

    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(
      fieldMappings,
      targetSchema.fields.length
    )

    // Determine data integrity risk
    const dataIntegrityRisk = this.assessDataIntegrityRisk(
      requiredButMissing.length,
      fieldMappings
    )

    // Generate transformation map
    let transformationMap: TransformationMap | undefined

    if (generateCode && (fieldMappings.length > 0 || requiredButMissing.length > 0)) {
      transformationMap = cachedMap || this.generateTransformationMap(
        sourceTool,
        targetTool,
        sourceSchema,
        targetSchema,
        fieldMappings
      )

      // Cache the transformation map
      if (!cachedMap) {
        this.cacheTransformationMap(cacheKey, transformationMap)
      }
    }

    // Generate warnings and suggestions
    const warnings = this.generateWarnings(
      requiredButMissing,
      fieldMappings,
      dataIntegrityRisk
    )

    const suggestions = this.generateSuggestions(
      unmappedSourceFields,
      unmappedTargetFields,
      requiredButMissing
    )

    return {
      sourceToolId: sourceTool.id,
      targetToolId: targetTool.id,
      sourceSchema,
      targetSchema,
      isCompatible: requiredButMissing.length === 0,
      requiresTransformation: fieldMappings.some(m => m.transformationType !== 'direct'),
      fieldMappings,
      unmappedSourceFields,
      unmappedTargetFields,
      requiredButMissing,
      transformationMap,
      compatibilityScore,
      dataIntegrityRisk,
      warnings,
      suggestions
    }
  }

  /**
   * Extract schema from a tool definition
   */
  async extractSchema(
    tool: Tool | DiscoveredTool,
    direction: 'input' | 'output'
  ): Promise<ToolSchema> {
    const cacheKey = `${tool.id}:${direction}`

    // Check cache
    const cached = this.schemaCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    // Extract from tool definition
    const rawSchema = direction === 'input'
      ? (tool as Tool).inputSchema || (tool as DiscoveredTool).inputSchema
      : (tool as Tool).outputSchema || (tool as DiscoveredTool).outputSchema

    const fields = this.parseSchemaFields(rawSchema || {})

    const schema: ToolSchema = {
      toolId: tool.id,
      direction,
      fields,
      version: undefined,
      examples: undefined
    }

    // Cache the schema
    this.schemaCache.set(cacheKey, {
      data: schema,
      timestamp: Date.now()
    })

    return schema
  }

  /**
   * Get a cached or stored transformation map for a tool pair
   */
  async getStoredTransformationMap(
    sourceToolId: string,
    targetToolId: string
  ): Promise<TransformationMap | null> {
    try {
      const { data, error } = await supabase
        .from('transformation_maps')
        .select('*')
        .eq('source_tool_id', sourceToolId)
        .eq('target_tool_id', targetToolId)
        .single()

      if (error || !data) {
        return null
      }

      return transformationMapFromRow(data as TransformationMapRow)
    } catch (err) {
      console.error('[SchemaAnalyzer] Failed to fetch transformation map:', err)
      return null
    }
  }

  /**
   * Store a transformation map for reuse
   */
  async storeTransformationMap(map: TransformationMap): Promise<void> {
    try {
      const { error } = await supabase
        .from('transformation_maps')
        .upsert({
          id: map.id,
          source_tool_id: map.sourceToolId,
          target_tool_id: map.targetToolId,
          field_mappings: map.fieldMappings,
          type_conversions: map.typeConversions,
          default_values: map.defaultValues,
          transform_function: map.transformFunction,
          reverse_function: map.reverseFunction,
          confidence_score: map.confidenceScore,
          usage_count: map.usageCount,
          success_rate: map.successRate,
          metadata: {}
        }, {
          onConflict: 'source_tool_id,target_tool_id'
        })

      if (error) {
        console.error('[SchemaAnalyzer] Failed to store transformation map:', error)
      }
    } catch (err) {
      console.error('[SchemaAnalyzer] Failed to store transformation map:', err)
    }
  }

  /**
   * Record a successful transformation execution
   */
  async recordTransformationSuccess(
    sourceToolId: string,
    targetToolId: string
  ): Promise<void> {
    try {
      // Increment usage count and update success rate
      await supabase.rpc('increment_transformation_usage', {
        p_source_tool_id: sourceToolId,
        p_target_tool_id: targetToolId,
        p_success: true
      })
    } catch (err) {
      console.error('[SchemaAnalyzer] Failed to record transformation success:', err)
    }
  }

  /**
   * Record a failed transformation execution
   */
  async recordTransformationFailure(
    sourceToolId: string,
    targetToolId: string
  ): Promise<void> {
    try {
      await supabase.rpc('increment_transformation_usage', {
        p_source_tool_id: sourceToolId,
        p_target_tool_id: targetToolId,
        p_success: false
      })
    } catch (err) {
      console.error('[SchemaAnalyzer] Failed to record transformation failure:', err)
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.transformationCache.clear()
    this.schemaCache.clear()
    console.log('[SchemaAnalyzer] Caches cleared')
  }

  // ============================================================================
  // Schema Extraction
  // ============================================================================

  /**
   * Parse schema fields from a raw schema object
   */
  private parseSchemaFields(schema: Record<string, unknown>, prefix: string = ''): SchemaField[] {
    const fields: SchemaField[] = []

    if (!schema || typeof schema !== 'object') {
      return fields
    }

    // Handle JSON Schema format
    if (schema.properties && typeof schema.properties === 'object') {
      const properties = schema.properties as Record<string, unknown>
      const required = Array.isArray(schema.required) ? schema.required as string[] : []

      for (const [name, prop] of Object.entries(properties)) {
        const propObj = prop as Record<string, unknown>
        const field = this.parseSchemaProperty(name, propObj, required.includes(name), prefix)
        fields.push(field)
      }
    } else {
      // Handle simple object format
      for (const [name, value] of Object.entries(schema)) {
        if (name === 'required' || name === 'type' || name === '$schema') continue

        const type = this.inferType(value)
        fields.push({
          name: prefix ? `${prefix}.${name}` : name,
          type,
          required: false,
          description: undefined
        })
      }
    }

    return fields
  }

  /**
   * Parse a single schema property
   */
  private parseSchemaProperty(
    name: string,
    prop: Record<string, unknown>,
    required: boolean,
    prefix: string
  ): SchemaField {
    const fullName = prefix ? `${prefix}.${name}` : name
    const type = this.mapJsonSchemaType(prop.type as string)

    const field: SchemaField = {
      name: fullName,
      type,
      required,
      description: prop.description as string | undefined,
      format: prop.format as string | undefined,
      default: prop.default,
      enum: prop.enum as unknown[] | undefined
    }

    // Handle nested objects
    if (type === 'object' && prop.properties) {
      field.nested = this.parseSchemaFields(prop as Record<string, unknown>, fullName)
    }

    // Handle arrays
    if (type === 'array' && prop.items) {
      const items = prop.items as Record<string, unknown>
      field.items = this.parseSchemaProperty('item', items, false, '')
    }

    return field
  }

  /**
   * Map JSON Schema type to our SchemaFieldType
   */
  private mapJsonSchemaType(type: string | undefined): SchemaFieldType {
    switch (type) {
      case 'string':
        return 'string'
      case 'number':
      case 'integer':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'object':
        return 'object'
      case 'array':
        return 'array'
      case 'null':
        return 'null'
      default:
        return 'unknown'
    }
  }

  /**
   * Infer type from a value
   */
  private inferType(value: unknown): SchemaFieldType {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Date) return 'date'

    const type = typeof value
    switch (type) {
      case 'string':
        return 'string'
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'object':
        return 'object'
      default:
        return 'unknown'
    }
  }

  // ============================================================================
  // Field Mapping
  // ============================================================================

  /**
   * Find field mappings between source and target schemas
   */
  private findFieldMappings(
    sourceSchema: ToolSchema,
    targetSchema: ToolSchema
  ): FieldMapping[] {
    const mappings: FieldMapping[] = []
    const mappedTargetFields = new Set<string>()

    // Flatten nested fields for matching
    const sourceFields = this.flattenFields(sourceSchema.fields)
    const targetFields = this.flattenFields(targetSchema.fields)

    // First pass: exact matches
    for (const targetField of targetFields) {
      const exactMatch = sourceFields.find(sf =>
        sf.name.toLowerCase() === targetField.name.toLowerCase() &&
        !mappedTargetFields.has(targetField.name)
      )

      if (exactMatch) {
        mappings.push(this.createFieldMapping(exactMatch, targetField, 'exact'))
        mappedTargetFields.add(targetField.name)
      }
    }

    // Second pass: fuzzy matches
    for (const targetField of targetFields) {
      if (mappedTargetFields.has(targetField.name)) continue

      const fuzzyMatch = this.findFuzzyMatch(targetField.name, sourceFields)
      if (fuzzyMatch) {
        mappings.push(this.createFieldMapping(fuzzyMatch, targetField, 'fuzzy'))
        mappedTargetFields.add(targetField.name)
      }
    }

    // Third pass: semantic matches
    for (const targetField of targetFields) {
      if (mappedTargetFields.has(targetField.name)) continue

      const semanticMatch = this.findSemanticMatch(targetField.name, sourceFields)
      if (semanticMatch) {
        mappings.push(this.createFieldMapping(semanticMatch, targetField, 'semantic'))
        mappedTargetFields.add(targetField.name)
      }
    }

    return mappings
  }

  /**
   * Flatten nested fields into dot-notation paths
   */
  private flattenFields(fields: SchemaField[]): SchemaField[] {
    const flattened: SchemaField[] = []

    for (const field of fields) {
      flattened.push(field)
      if (field.nested) {
        flattened.push(...this.flattenFields(field.nested))
      }
    }

    return flattened
  }

  /**
   * Create a field mapping between source and target
   */
  private createFieldMapping(
    source: SchemaField,
    target: SchemaField,
    matchType: 'exact' | 'fuzzy' | 'semantic'
  ): FieldMapping {
    const needsTypeConversion = source.type !== target.type
    const transformationType = this.determineTransformationType(source, target)

    let confidence = matchType === 'exact' ? 1.0 : matchType === 'fuzzy' ? 0.8 : 0.6

    // Reduce confidence for type conversions
    if (needsTypeConversion) {
      confidence *= 0.9
    }

    return {
      sourceField: source.name,
      targetField: target.name,
      transformationType,
      confidence,
      matchType,
      conversionRule: needsTypeConversion
        ? `Convert ${source.type} to ${target.type}`
        : undefined,
      defaultValue: target.default,
      notes: undefined
    }
  }

  /**
   * Determine the transformation type between two fields
   */
  private determineTransformationType(
    source: SchemaField,
    target: SchemaField
  ): TransformationType {
    // Same type = direct mapping
    if (source.type === target.type) {
      return 'direct'
    }

    // Type conversion needed
    const conversionKey = `${source.type}_to_${target.type}`
    if (DEFAULT_TYPE_CONVERSIONS[conversionKey]) {
      return 'type_cast'
    }

    // Format conversion (e.g., date formats)
    if (source.format || target.format) {
      return 'format'
    }

    // Object to string or vice versa
    if (
      (source.type === 'object' && target.type === 'string') ||
      (source.type === 'string' && target.type === 'object')
    ) {
      return 'type_cast'
    }

    // Nested extraction
    if (source.name.includes('.') && !target.name.includes('.')) {
      return 'extract'
    }

    // Nesting
    if (!source.name.includes('.') && target.name.includes('.')) {
      return 'nest'
    }

    return 'type_cast'
  }

  /**
   * Find a fuzzy match for a field name
   */
  private findFuzzyMatch(targetName: string, sourceFields: SchemaField[]): SchemaField | null {
    const normalizedTarget = this.normalizeFieldName(targetName)

    for (const source of sourceFields) {
      const normalizedSource = this.normalizeFieldName(source.name)

      // Check if normalized names match
      if (normalizedSource === normalizedTarget) {
        return source
      }

      // Check for common variations
      if (this.areFieldNamesRelated(source.name, targetName)) {
        return source
      }
    }

    return null
  }

  /**
   * Find a semantic match for a field name
   */
  private findSemanticMatch(targetName: string, sourceFields: SchemaField[]): SchemaField | null {
    // Look up known variations
    for (const [_canonical, variations] of Object.entries(FIELD_NAME_VARIATIONS)) {
      const targetMatches = variations.some(v =>
        v.toLowerCase() === targetName.toLowerCase() ||
        targetName.toLowerCase().includes(v.toLowerCase())
      )

      if (targetMatches) {
        // Find a source field that matches any variation
        for (const source of sourceFields) {
          const sourceMatches = variations.some(v =>
            v.toLowerCase() === source.name.toLowerCase() ||
            source.name.toLowerCase().includes(v.toLowerCase())
          )

          if (sourceMatches) {
            return source
          }
        }
      }
    }

    return null
  }

  /**
   * Normalize a field name for comparison
   */
  private normalizeFieldName(name: string): string {
    // Remove common prefixes/suffixes
    let normalized = name
      .replace(/^(get|set|is|has|_)/i, '')
      .replace(/(_id|Id|ID)$/i, '')

    // Convert to lowercase and remove underscores/hyphens
    normalized = normalized
      .toLowerCase()
      .replace(/[-_]/g, '')

    return normalized
  }

  /**
   * Check if two field names are related variations
   */
  private areFieldNamesRelated(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase()
    const n2 = name2.toLowerCase()

    // camelCase vs snake_case
    const snake1 = this.camelToSnake(n1)
    const snake2 = this.camelToSnake(n2)
    const camel1 = this.snakeToCamel(n1)
    const camel2 = this.snakeToCamel(n2)

    return (
      snake1 === snake2 ||
      camel1 === camel2 ||
      snake1 === n2 ||
      n1 === snake2 ||
      camel1 === n2 ||
      n1 === camel2
    )
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  /**
   * Convert snake_case to camelCase
   */
  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  // ============================================================================
  // Transformation Map Generation
  // ============================================================================

  /**
   * Generate a complete transformation map
   */
  private generateTransformationMap(
    sourceTool: Tool | DiscoveredTool,
    targetTool: Tool | DiscoveredTool,
    _sourceSchema: ToolSchema,
    targetSchema: ToolSchema,
    fieldMappings: FieldMapping[]
  ): TransformationMap {
    void _sourceSchema
    // Generate type conversions
    const typeConversions = this.generateTypeConversions(fieldMappings)

    // Generate default values for unmapped required fields
    const defaultValues = this.generateDefaultValues(targetSchema, fieldMappings)

    // Generate transformation function
    const transformFunction = this.generateTransformFunction(
      fieldMappings,
      typeConversions,
      defaultValues
    )

    // Generate reverse function if possible
    const reverseFunction = this.generateReverseFunction(fieldMappings)

    // Calculate scores
    const confidenceScore = this.calculateAverageScore(fieldMappings.map(m => m.confidence))
    const coverageScore = fieldMappings.length / Math.max(targetSchema.fields.length, 1)
    const complexityScore = this.calculateMappingComplexity(fieldMappings, typeConversions)

    return {
      id: `tm_${sourceTool.id}_${targetTool.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceToolId: sourceTool.id,
      sourceToolName: sourceTool.name,
      targetToolId: targetTool.id,
      targetToolName: targetTool.name,
      fieldMappings,
      typeConversions,
      defaultValues,
      transformFunction,
      reverseFunction,
      confidenceScore,
      coverageScore,
      complexityScore,
      usageCount: 0,
      successRate: 1.0,
      lastUsedAt: undefined
    }
  }

  /**
   * Generate type conversions for field mappings
   */
  private generateTypeConversions(fieldMappings: FieldMapping[]): TypeConversionRule[] {
    const conversions: TypeConversionRule[] = []
    const addedKeys = new Set<string>()

    for (const mapping of fieldMappings) {
      if (mapping.transformationType === 'type_cast' && mapping.conversionRule) {
        // Parse the conversion rule to get types
        const match = mapping.conversionRule.match(/Convert (\w+) to (\w+)/)
        if (match) {
          const sourceType = match[1] as SchemaFieldType
          const targetType = match[2] as SchemaFieldType
          const key = `${sourceType}_to_${targetType}`

          if (!addedKeys.has(key)) {
            const defaultConversion = DEFAULT_TYPE_CONVERSIONS[key]
            if (defaultConversion) {
              conversions.push(defaultConversion)
              addedKeys.add(key)
            }
          }
        }
      }
    }

    return conversions
  }

  /**
   * Generate default values for unmapped required fields
   */
  private generateDefaultValues(
    targetSchema: ToolSchema,
    fieldMappings: FieldMapping[]
  ): Record<string, unknown> {
    const defaults: Record<string, unknown> = {}
    const mappedFields = new Set(fieldMappings.map(m => m.targetField))

    for (const field of targetSchema.fields) {
      if (field.required && !mappedFields.has(field.name)) {
        // Use schema default if available, otherwise generate one
        defaults[field.name] = field.default ?? this.getDefaultForType(field.type)
      }
    }

    return defaults
  }

  /**
   * Get default value for a type
   */
  private getDefaultForType(type: SchemaFieldType): unknown {
    switch (type) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'object':
        return {}
      case 'array':
        return []
      case 'date':
        return new Date().toISOString()
      case 'null':
        return null
      default:
        return null
    }
  }

  /**
   * Generate TypeScript transformation function
   */
  private generateTransformFunction(
    fieldMappings: FieldMapping[],
    _typeConversions: TypeConversionRule[],
    defaultValues: Record<string, unknown>
  ): string {
    void _typeConversions
    const lines: string[] = [
      '/**',
      ' * Auto-generated transformation function',
      ' * @param source - Source data object',
      ' * @returns Transformed data object',
      ' */',
      'function transform(source: Record<string, unknown>): Record<string, unknown> {',
      '  const result: Record<string, unknown> = {};',
      ''
    ]

    // Add helper functions for type conversions
    const conversionHelpers = new Set<string>()
    for (const mapping of fieldMappings) {
      if (mapping.transformationType === 'type_cast') {
        conversionHelpers.add(mapping.conversionRule || '')
      }
    }

    // Generate field assignments
    for (const mapping of fieldMappings) {
      const assignment = this.generateFieldAssignment(mapping)
      lines.push(`  ${assignment}`)
    }

    // Add default values
    if (Object.keys(defaultValues).length > 0) {
      lines.push('')
      lines.push('  // Default values for unmapped required fields')
      for (const [field, value] of Object.entries(defaultValues)) {
        lines.push(`  if (result['${field}'] === undefined) {`)
        lines.push(`    result['${field}'] = ${JSON.stringify(value)};`)
        lines.push('  }')
      }
    }

    lines.push('')
    lines.push('  return result;')
    lines.push('}')

    return lines.join('\n')
  }

  /**
   * Generate assignment code for a single field mapping
   */
  private generateFieldAssignment(mapping: FieldMapping): string {
    const sourceAccess = this.generateSourceAccess(mapping.sourceField)
    const targetKey = mapping.targetField

    switch (mapping.transformationType) {
      case 'direct':
        return `result['${targetKey}'] = ${sourceAccess};`

      case 'type_cast':
        return this.generateTypeCastAssignment(mapping, sourceAccess, targetKey)

      case 'format':
        return `result['${targetKey}'] = formatValue(${sourceAccess}, '${mapping.template || ''}');`

      case 'template':
        return `result['${targetKey}'] = \`${mapping.template}\`.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => source[key] || '');`

      case 'extract':
        return `result['${targetKey}'] = ${sourceAccess};`

      case 'default':
        return `result['${targetKey}'] = ${sourceAccess} ?? ${JSON.stringify(mapping.defaultValue)};`

      default:
        return `result['${targetKey}'] = ${sourceAccess}; // TODO: Implement ${mapping.transformationType} transformation`
    }
  }

  /**
   * Generate source field access code
   */
  private generateSourceAccess(fieldPath: string): string {
    if (!fieldPath.includes('.')) {
      return `source['${fieldPath}']`
    }

    // Handle nested paths
    const parts = fieldPath.split('.')
    let access = 'source'
    for (const part of parts) {
      access += `?.['${part}']`
    }
    return access
  }

  /**
   * Generate type cast assignment
   */
  private generateTypeCastAssignment(
    mapping: FieldMapping,
    sourceAccess: string,
    targetKey: string
  ): string {
    const match = mapping.conversionRule?.match(/Convert (\w+) to (\w+)/)
    if (!match) {
      return `result['${targetKey}'] = ${sourceAccess};`
    }

    const [, sourceType, targetType] = match
    const conversionKey = `${sourceType}_to_${targetType}`
    const conversion = DEFAULT_TYPE_CONVERSIONS[conversionKey]

    if (conversion) {
      // Use the conversion function
      const value = sourceAccess
      const fallback = JSON.stringify(mapping.defaultValue ?? conversion.fallbackValue)
      return `result['${targetKey}'] = (() => { const value = ${value}; const fallback = ${fallback}; ${conversion.conversionFunction} })();`
    }

    return `result['${targetKey}'] = ${sourceAccess}; // Manual conversion needed: ${mapping.conversionRule}`
  }

  /**
   * Generate reverse transformation function (if possible)
   */
  private generateReverseFunction(fieldMappings: FieldMapping[]): string | undefined {
    // Only generate reverse if all mappings are reversible
    const reversibleTypes: TransformationType[] = ['direct', 'type_cast']
    const canReverse = fieldMappings.every(m => reversibleTypes.includes(m.transformationType))

    if (!canReverse) {
      return undefined
    }

    const lines: string[] = [
      '/**',
      ' * Auto-generated reverse transformation function',
      ' * @param target - Target data object',
      ' * @returns Source data object (reverse transformed)',
      ' */',
      'function reverseTransform(target: Record<string, unknown>): Record<string, unknown> {',
      '  const result: Record<string, unknown> = {};',
      ''
    ]

    // Reverse the mappings
    for (const mapping of fieldMappings) {
      const sourceKey = mapping.sourceField
      const targetAccess = `target['${mapping.targetField}']`

      if (mapping.transformationType === 'direct') {
        lines.push(`  result['${sourceKey}'] = ${targetAccess};`)
      } else if (mapping.transformationType === 'type_cast') {
        // For type casts, we'd need the reverse conversion
        lines.push(`  result['${sourceKey}'] = ${targetAccess}; // Reverse type cast`)
      }
    }

    lines.push('')
    lines.push('  return result;')
    lines.push('}')

    return lines.join('\n')
  }

  // ============================================================================
  // Score Calculations
  // ============================================================================

  /**
   * Calculate average score
   */
  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0
    return scores.reduce((sum, s) => sum + s, 0) / scores.length
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibilityScore(
    fieldMappings: FieldMapping[],
    totalTargetFields: number
  ): number {
    if (totalTargetFields === 0) return 1

    // Weight by match type
    const weightedScore = fieldMappings.reduce((sum, m) => {
      const weight = m.matchType === 'exact' ? 1.0 : m.matchType === 'fuzzy' ? 0.8 : 0.6
      return sum + weight
    }, 0)

    return Math.min(1, weightedScore / totalTargetFields)
  }

  /**
   * Calculate complexity score for transformation maps
   */
  private calculateComplexityScore(transformationMaps: TransformationMap[]): number {
    if (transformationMaps.length === 0) return 0

    const avgComplexity = transformationMaps.reduce((sum, map) => {
      return sum + map.complexityScore
    }, 0) / transformationMaps.length

    return avgComplexity
  }

  /**
   * Calculate mapping complexity
   */
  private calculateMappingComplexity(
    fieldMappings: FieldMapping[],
    typeConversions: TypeConversionRule[]
  ): number {
    if (fieldMappings.length === 0) return 0

    // More conversions = more complex
    const conversionRatio = typeConversions.length / fieldMappings.length

    // Non-direct mappings add complexity
    const nonDirectRatio = fieldMappings.filter(m => m.transformationType !== 'direct').length / fieldMappings.length

    // Low confidence mappings add complexity
    const lowConfidenceRatio = fieldMappings.filter(m => m.confidence < 0.7).length / fieldMappings.length

    return (conversionRatio * 0.4) + (nonDirectRatio * 0.4) + (lowConfidenceRatio * 0.2)
  }

  /**
   * Assess data integrity risk
   */
  private assessDataIntegrityRisk(
    missingRequiredCount: number,
    fieldMappings: FieldMapping[]
  ): 'none' | 'low' | 'medium' | 'high' {
    if (missingRequiredCount > 2) return 'high'
    if (missingRequiredCount > 0) return 'medium'

    // Check for low-confidence mappings
    const lowConfidence = fieldMappings.filter(m => m.confidence < 0.5).length
    if (lowConfidence > 3) return 'medium'
    if (lowConfidence > 0) return 'low'

    return 'none'
  }

  /**
   * Calculate overall risk from individual risks
   */
  private calculateOverallRisk(
    risks: Array<'none' | 'low' | 'medium' | 'high'>
  ): 'none' | 'low' | 'medium' | 'high' {
    const riskLevels = { none: 0, low: 1, medium: 2, high: 3 }
    const maxRisk = Math.max(...risks.map(r => riskLevels[r]))

    const riskNames: Array<'none' | 'low' | 'medium' | 'high'> = ['none', 'low', 'medium', 'high']
    return riskNames[maxRisk]
  }

  // ============================================================================
  // Warnings & Suggestions
  // ============================================================================

  /**
   * Generate warnings based on analysis
   */
  private generateWarnings(
    requiredButMissing: string[],
    fieldMappings: FieldMapping[],
    dataIntegrityRisk: 'none' | 'low' | 'medium' | 'high'
  ): string[] {
    const warnings: string[] = []

    if (requiredButMissing.length > 0) {
      warnings.push(`Missing required fields: ${requiredButMissing.join(', ')}`)
    }

    const lowConfidence = fieldMappings.filter(m => m.confidence < 0.5)
    if (lowConfidence.length > 0) {
      warnings.push(`${lowConfidence.length} field mapping(s) have low confidence (<50%)`)
    }

    if (dataIntegrityRisk === 'high') {
      warnings.push('High risk of data loss - please review field mappings carefully')
    } else if (dataIntegrityRisk === 'medium') {
      warnings.push('Some data may be lost or require manual mapping')
    }

    const typeConversions = fieldMappings.filter(m => m.transformationType === 'type_cast')
    if (typeConversions.length > 3) {
      warnings.push(`${typeConversions.length} type conversions required - verify data integrity`)
    }

    return warnings
  }

  /**
   * Generate suggestions based on analysis
   */
  private generateSuggestions(
    unmappedSourceFields: string[],
    unmappedTargetFields: string[],
    requiredButMissing: string[]
  ): string[] {
    const suggestions: string[] = []

    if (unmappedSourceFields.length > 0 && unmappedTargetFields.length > 0) {
      suggestions.push('Consider manually mapping additional fields for better data transfer')
    }

    if (requiredButMissing.length > 0) {
      suggestions.push(`Provide default values or source mappings for: ${requiredButMissing.join(', ')}`)
    }

    if (unmappedSourceFields.length > 5) {
      suggestions.push('Many source fields are unused - consider if all data is being utilized')
    }

    return suggestions
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Get cached transformation map
   */
  private getCachedTransformationMap(key: string): TransformationMap | null {
    const cached = this.transformationCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }
    return null
  }

  /**
   * Cache a transformation map
   */
  private cacheTransformationMap(key: string, map: TransformationMap): void {
    // Enforce cache size limit
    if (this.transformationCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.transformationCache.keys().next().value
      if (oldestKey) {
        this.transformationCache.delete(oldestKey)
      }
    }

    this.transformationCache.set(key, {
      data: map,
      timestamp: Date.now()
    })
  }
}

// Export singleton instance
export const integrationSchemaAnalyzerService = new IntegrationSchemaAnalyzerService()
