/**
 * Data Normalization Utilities
 *
 * Normalizes API responses by flattening nested data, handling null/undefined
 * consistently, and providing type-safe transformations.
 */

// =============================================================================
// TYPES
// =============================================================================

export type Primitive = string | number | boolean | null | undefined

export interface NormalizeOptions {
  /** Replace null values with this value */
  nullValue?: unknown
  /** Replace undefined values with this value */
  undefinedValue?: unknown
  /** Maximum depth for flattening (default: no limit) */
  maxDepth?: number
  /** Separator for flattened keys (default: '.') */
  keySeparator?: string
  /** Whether to preserve arrays (default: true) */
  preserveArrays?: boolean
  /** Custom key transformer */
  keyTransformer?: (key: string) => string
  /** Custom value transformer */
  valueTransformer?: (value: unknown, key: string) => unknown
}

export interface NormalizedEntity<T = unknown> {
  id: string | number
  data: T
}

export interface NormalizationResult<T> {
  entities: Record<string | number, T>
  ids: (string | number)[]
}

// =============================================================================
// CORE NORMALIZATION
// =============================================================================

/**
 * Normalizes a value, handling null/undefined consistently
 *
 * @param value - Value to normalize
 * @param options - Normalization options
 * @returns Normalized value
 *
 * @example
 * ```ts
 * normalizeValue(null, { nullValue: '' })           // ''
 * normalizeValue(undefined, { undefinedValue: 0 }) // 0
 * normalizeValue('hello')                          // 'hello'
 * ```
 */
export function normalizeValue(value: unknown, options: NormalizeOptions = {}): unknown {
  const { nullValue = null, undefinedValue = undefined, valueTransformer } = options

  if (value === null) {
    return nullValue
  }

  if (value === undefined) {
    return undefinedValue
  }

  if (valueTransformer) {
    return valueTransformer(value, '')
  }

  return value
}

/**
 * Normalizes an object's values, handling null/undefined in nested structures
 *
 * @param obj - Object to normalize
 * @param options - Normalization options
 * @returns Normalized object
 *
 * @example
 * ```ts
 * const data = {
 *   name: 'John',
 *   email: null,
 *   profile: {
 *     bio: undefined,
 *     age: 25
 *   }
 * }
 *
 * normalizeObject(data, { nullValue: '', undefinedValue: '' })
 * // { name: 'John', email: '', profile: { bio: '', age: 25 } }
 * ```
 */
export function normalizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: NormalizeOptions = {}
): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const result: Record<string, unknown> = Array.isArray(obj) ? ([] as unknown as Record<string, unknown>) : {}

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = options.keyTransformer ? options.keyTransformer(key) : key

    if (value === null) {
      result[normalizedKey] = options.nullValue ?? null
    } else if (value === undefined) {
      result[normalizedKey] = options.undefinedValue ?? undefined
    } else if (Array.isArray(value)) {
      result[normalizedKey] = value.map(item =>
        typeof item === 'object' && item !== null
          ? normalizeObject(item as Record<string, unknown>, options)
          : normalizeValue(item, options)
      )
    } else if (typeof value === 'object') {
      result[normalizedKey] = normalizeObject(value as Record<string, unknown>, options)
    } else if (options.valueTransformer) {
      result[normalizedKey] = options.valueTransformer(value, normalizedKey)
    } else {
      result[normalizedKey] = value
    }
  }

  return result as T
}

// =============================================================================
// FLATTENING
// =============================================================================

/**
 * Flattens a nested object into a single-level object with dot-notation keys
 *
 * @param obj - Object to flatten
 * @param options - Flattening options
 * @returns Flattened object
 *
 * @example
 * ```ts
 * const nested = {
 *   user: {
 *     profile: {
 *       name: 'John',
 *       settings: { theme: 'dark' }
 *     }
 *   }
 * }
 *
 * flatten(nested)
 * // {
 * //   'user.profile.name': 'John',
 * //   'user.profile.settings.theme': 'dark'
 * // }
 * ```
 */
export function flatten(
  obj: Record<string, unknown>,
  options: NormalizeOptions = {}
): Record<string, Primitive> {
  const { keySeparator = '.', maxDepth, preserveArrays = true } = options
  const result: Record<string, Primitive> = {}

  function flattenRecursive(
    current: unknown,
    prefix: string,
    depth: number
  ): void {
    // Check depth limit
    if (maxDepth !== undefined && depth >= maxDepth) {
      if (isPrimitive(current)) {
        result[prefix] = current as Primitive
      } else {
        // Store as JSON string if we hit depth limit on non-primitive
        result[prefix] = JSON.stringify(current) as Primitive
      }
      return
    }

    if (current === null || current === undefined) {
      result[prefix] = current as Primitive
      return
    }

    if (isPrimitive(current)) {
      result[prefix] = current as Primitive
      return
    }

    if (Array.isArray(current)) {
      if (preserveArrays) {
        // Flatten array elements with index as key
        current.forEach((item, index) => {
          const newKey = prefix ? `${prefix}${keySeparator}${index}` : String(index)
          flattenRecursive(item, newKey, depth + 1)
        })
      } else {
        // Store array as JSON string
        result[prefix] = JSON.stringify(current)
      }
      return
    }

    if (typeof current === 'object') {
      for (const [key, value] of Object.entries(current)) {
        const newKey = prefix ? `${prefix}${keySeparator}${key}` : key
        flattenRecursive(value, newKey, depth + 1)
      }
    }
  }

  flattenRecursive(obj, '', 0)
  return result
}

/**
 * Unflattens a dot-notation object back into nested structure
 *
 * @param obj - Flattened object
 * @param keySeparator - Key separator (default: '.')
 * @returns Unflattened nested object
 *
 * @example
 * ```ts
 * const flat = {
 *   'user.name': 'John',
 *   'user.settings.theme': 'dark'
 * }
 *
 * unflatten(flat)
 * // { user: { name: 'John', settings: { theme: 'dark' } } }
 * ```
 */
export function unflatten(
  obj: Record<string, unknown>,
  keySeparator: string = '.'
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [flatKey, value] of Object.entries(obj)) {
    const keys = flatKey.split(keySeparator)
    let current: Record<string, unknown> = result

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      const nextKey = keys[i + 1]

      // Determine if next level should be array or object
      const isArrayIndex = /^\d+$/.test(nextKey)

      if (!(key in current)) {
        current[key] = isArrayIndex ? [] : {}
      }

      current = current[key] as Record<string, unknown>
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = value
  }

  return result
}

// =============================================================================
// ENTITY NORMALIZATION (Redux-style)
// =============================================================================

/**
 * Normalizes an array of entities by ID for efficient lookup
 *
 * @param entities - Array of entities
 * @param idKey - Key to use as ID (default: 'id')
 * @returns Normalized result with entities map and ids array
 *
 * @example
 * ```ts
 * const users = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' }
 * ]
 *
 * const { entities, ids } = normalizeEntities(users)
 * // entities: { 1: { id: 1, name: 'John' }, 2: { id: 2, name: 'Jane' } }
 * // ids: [1, 2]
 * ```
 */
export function normalizeEntities<T extends Record<string, unknown>>(
  entities: T[],
  idKey: keyof T = 'id' as keyof T
): NormalizationResult<T> {
  const result: NormalizationResult<T> = {
    entities: {},
    ids: []
  }

  for (const entity of entities) {
    const id = entity[idKey] as string | number
    if (id !== undefined && id !== null) {
      result.entities[id] = entity
      result.ids.push(id)
    }
  }

  return result
}

/**
 * Denormalizes entities back to array
 *
 * @param normalized - Normalized result
 * @returns Array of entities in original order
 */
export function denormalizeEntities<T>(
  normalized: NormalizationResult<T>
): T[] {
  return normalized.ids.map(id => normalized.entities[id])
}

/**
 * Merges new entities into existing normalized data
 *
 * @param existing - Existing normalized data
 * @param newEntities - New entities to merge
 * @param idKey - Key to use as ID
 * @returns Merged normalized result
 */
export function mergeNormalizedEntities<T extends Record<string, unknown>>(
  existing: NormalizationResult<T>,
  newEntities: T[],
  idKey: keyof T = 'id' as keyof T
): NormalizationResult<T> {
  const merged = normalizeEntities(newEntities, idKey)

  return {
    entities: {
      ...existing.entities,
      ...merged.entities
    },
    ids: [...new Set([...existing.ids, ...merged.ids])]
  }
}

// =============================================================================
// API RESPONSE NORMALIZATION
// =============================================================================

/**
 * Normalizes common API response patterns
 *
 * @param response - API response object
 * @param options - Normalization options
 * @returns Normalized response
 *
 * @example
 * ```ts
 * // Handles various API response formats
 * normalizeApiResponse({ data: { users: [] } })        // Returns data.users
 * normalizeApiResponse({ results: [] })                // Returns results
 * normalizeApiResponse({ items: [] })                  // Returns items
 * normalizeApiResponse([1, 2, 3])                      // Returns as-is
 * ```
 */
export function normalizeApiResponse<T = unknown>(
  response: unknown,
  options: NormalizeOptions = {}
): T {
  if (!response || typeof response !== 'object') {
    return normalizeValue(response, options) as T
  }

  const resp = response as Record<string, unknown>

  // Common nested data patterns
  const dataKeys = ['data', 'results', 'items', 'records', 'rows', 'content', 'body']

  for (const key of dataKeys) {
    if (key in resp) {
      const data = resp[key]
      // If the nested data is also an object with a common key, unwrap again
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const nestedKey of dataKeys) {
          if (nestedKey in (data as Record<string, unknown>)) {
            return normalizeObject(
              (data as Record<string, unknown>)[nestedKey] as Record<string, unknown>,
              options
            ) as T
          }
        }
      }
      return normalizeObject(data as Record<string, unknown>, options) as T
    }
  }

  // If array at root, normalize each item
  if (Array.isArray(response)) {
    return response.map(item =>
      typeof item === 'object' && item !== null
        ? normalizeObject(item as Record<string, unknown>, options)
        : normalizeValue(item, options)
    ) as T
  }

  // Return normalized object
  return normalizeObject(resp, options) as T
}

/**
 * Extracts pagination metadata from API response
 *
 * @param response - API response object
 * @returns Pagination info or null
 */
export interface PaginationInfo {
  page?: number
  pageSize?: number
  totalPages?: number
  totalItems?: number
  hasNext?: boolean
  hasPrev?: boolean
  nextCursor?: string
  prevCursor?: string
}

export function extractPagination(response: unknown): PaginationInfo | null {
  if (!response || typeof response !== 'object') {
    return null
  }

  const resp = response as Record<string, unknown>
  const pagination: PaginationInfo = {}

  // Common pagination field names
  const pageFields = ['page', 'pageNumber', 'current_page', 'currentPage']
  const sizeFields = ['pageSize', 'page_size', 'limit', 'per_page', 'perPage']
  const totalPageFields = ['totalPages', 'total_pages', 'pages']
  const totalItemFields = ['totalItems', 'total_items', 'total', 'count', 'totalCount', 'total_count']

  for (const field of pageFields) {
    if (typeof resp[field] === 'number') {
      pagination.page = resp[field] as number
      break
    }
  }

  for (const field of sizeFields) {
    if (typeof resp[field] === 'number') {
      pagination.pageSize = resp[field] as number
      break
    }
  }

  for (const field of totalPageFields) {
    if (typeof resp[field] === 'number') {
      pagination.totalPages = resp[field] as number
      break
    }
  }

  for (const field of totalItemFields) {
    if (typeof resp[field] === 'number') {
      pagination.totalItems = resp[field] as number
      break
    }
  }

  // Cursor-based pagination
  const cursorFields = ['nextCursor', 'next_cursor', 'cursor', 'after']
  for (const field of cursorFields) {
    if (typeof resp[field] === 'string') {
      pagination.nextCursor = resp[field] as string
      break
    }
  }

  // Has next/prev
  if ('hasNext' in resp) pagination.hasNext = Boolean(resp.hasNext)
  if ('has_next' in resp) pagination.hasNext = Boolean(resp.has_next)
  if ('hasMore' in resp) pagination.hasNext = Boolean(resp.hasMore)
  if ('has_more' in resp) pagination.hasNext = Boolean(resp.has_more)

  if ('hasPrev' in resp) pagination.hasPrev = Boolean(resp.hasPrev)
  if ('has_prev' in resp) pagination.hasPrev = Boolean(resp.has_prev)

  // Return null if no pagination info found
  if (Object.keys(pagination).length === 0) {
    return null
  }

  return pagination
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if a value is a primitive type
 */
export function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

/**
 * Picks specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only picked keys
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omits specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without omitted keys
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * Transforms object keys using a transformer function
 *
 * @param obj - Source object
 * @param transformer - Key transformer function
 * @returns Object with transformed keys
 */
export function transformKeys<T extends Record<string, unknown>>(
  obj: T,
  transformer: (key: string) => string
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[transformer(key)] = value
  }
  return result
}

/**
 * Converts snake_case keys to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Converts camelCase keys to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Normalizes object keys from snake_case to camelCase
 */
export function normalizeKeysToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return normalizeObject(obj, { keyTransformer: snakeToCamel })
}

/**
 * Normalizes object keys from camelCase to snake_case
 */
export function normalizeKeysToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return normalizeObject(obj, { keyTransformer: camelToSnake })
}

/**
 * Removes all null and undefined values from an object
 */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  return result
}

/**
 * Deep equals comparison for objects
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (typeof a !== 'object') return a === b

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEquals(item, b[index]))
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>

  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  return aKeys.every(key => deepEquals(aObj[key], bObj[key]))
}
