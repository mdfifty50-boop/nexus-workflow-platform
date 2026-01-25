/**
 * Safe JSON Parsing Utilities
 *
 * Provides safeParse() and safeStringify() functions that handle malformed JSON
 * gracefully without crashing the application.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SafeParseResult<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
}

export interface SafeStringifyResult {
  success: boolean
  data: string | null
  error: string | null
}

export interface SafeParseOptions {
  /** Default value to return if parsing fails */
  defaultValue?: unknown
  /** Custom reviver function for JSON.parse */
  reviver?: (key: string, value: unknown) => unknown
  /** Whether to log errors to console */
  logErrors?: boolean
}

export interface SafeStringifyOptions {
  /** Custom replacer function for JSON.stringify */
  replacer?: (key: string, value: unknown) => unknown | null
  /** Indentation for pretty printing (number of spaces or string) */
  space?: string | number
  /** Whether to handle circular references */
  handleCircular?: boolean
  /** Default value to return if stringification fails */
  defaultValue?: string
  /** Whether to log errors to console */
  logErrors?: boolean
}

// =============================================================================
// SAFE PARSE
// =============================================================================

/**
 * Safely parses a JSON string, returning a result object instead of throwing
 *
 * @param json - The JSON string to parse
 * @param options - Parsing options
 * @returns SafeParseResult with success status, parsed data or default, and error message
 *
 * @example
 * ```ts
 * // Basic usage
 * const result = safeParse('{"name": "John"}')
 * if (result.success) {
 *   console.log(result.data) // { name: "John" }
 * }
 *
 * // With default value
 * const result = safeParse(invalidJson, { defaultValue: [] })
 * console.log(result.data) // [] if parsing failed
 *
 * // With type assertion
 * const result = safeParse<User>('{"name": "John"}')
 * if (result.success) {
 *   console.log(result.data?.name) // TypeScript knows this is User | null
 * }
 * ```
 */
export function safeParse<T = unknown>(
  json: string | null | undefined,
  options: SafeParseOptions = {}
): SafeParseResult<T> {
  const { defaultValue, reviver, logErrors = false } = options

  // Handle null/undefined input
  if (json === null || json === undefined) {
    return {
      success: false,
      data: (defaultValue as T) ?? null,
      error: 'Input is null or undefined'
    }
  }

  // Handle non-string input
  if (typeof json !== 'string') {
    return {
      success: false,
      data: (defaultValue as T) ?? null,
      error: `Expected string, got ${typeof json}`
    }
  }

  // Handle empty string
  const trimmed = json.trim()
  if (!trimmed) {
    return {
      success: false,
      data: (defaultValue as T) ?? null,
      error: 'Input is empty string'
    }
  }

  try {
    const parsed = JSON.parse(trimmed, reviver) as T
    return {
      success: true,
      data: parsed,
      error: null
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error'

    if (logErrors) {
      console.error('[safeParse] JSON parsing failed:', errorMessage)
    }

    return {
      success: false,
      data: (defaultValue as T) ?? null,
      error: errorMessage
    }
  }
}

/**
 * Parses JSON and returns the data or default value (simplified API)
 *
 * @param json - The JSON string to parse
 * @param defaultValue - Value to return if parsing fails (default: null)
 * @returns Parsed data or default value
 *
 * @example
 * ```ts
 * const data = parseOrDefault('{"valid": true}', {})
 * // data = { valid: true }
 *
 * const data = parseOrDefault('invalid json', {})
 * // data = {}
 *
 * const items = parseOrDefault<string[]>(jsonString, [])
 * // items is string[] whether parsing succeeds or not
 * ```
 */
export function parseOrDefault<T = unknown>(
  json: string | null | undefined,
  defaultValue: T
): T {
  const result = safeParse<T>(json)
  return result.success && result.data !== null ? result.data : defaultValue
}

/**
 * Parses JSON and throws a descriptive error if it fails
 *
 * @param json - The JSON string to parse
 * @param context - Optional context for error message
 * @returns Parsed data
 * @throws Error with descriptive message if parsing fails
 *
 * @example
 * ```ts
 * try {
 *   const config = parseOrThrow(configJson, 'loading configuration')
 * } catch (e) {
 *   console.error(e.message) // "Failed to parse JSON (loading configuration): ..."
 * }
 * ```
 */
export function parseOrThrow<T = unknown>(
  json: string | null | undefined,
  context?: string
): T {
  const result = safeParse<T>(json)

  if (!result.success) {
    const contextStr = context ? ` (${context})` : ''
    throw new Error(`Failed to parse JSON${contextStr}: ${result.error}`)
  }

  return result.data as T
}

// =============================================================================
// SAFE STRINGIFY
// =============================================================================

/**
 * Safely stringifies a value to JSON, handling errors and circular references
 *
 * @param value - The value to stringify
 * @param options - Stringification options
 * @returns SafeStringifyResult with success status, JSON string or default, and error
 *
 * @example
 * ```ts
 * // Basic usage
 * const result = safeStringify({ name: "John" })
 * if (result.success) {
 *   console.log(result.data) // '{"name":"John"}'
 * }
 *
 * // Handle circular references
 * const obj = { self: null }
 * obj.self = obj
 * const result = safeStringify(obj, { handleCircular: true })
 * // Works! Circular refs are replaced with "[Circular]"
 *
 * // Pretty print
 * const result = safeStringify(data, { space: 2 })
 * ```
 */
export function safeStringify(
  value: unknown,
  options: SafeStringifyOptions = {}
): SafeStringifyResult {
  const {
    replacer,
    space,
    handleCircular = false,
    defaultValue,
    logErrors = false
  } = options

  try {
    let finalReplacer = replacer

    // Handle circular references if requested
    if (handleCircular) {
      const seen = new WeakSet()
      finalReplacer = (key: string, val: unknown) => {
        // Apply custom replacer first if provided
        const processedVal = replacer ? replacer(key, val) : val

        // Check for circular references in objects
        if (typeof processedVal === 'object' && processedVal !== null) {
          if (seen.has(processedVal)) {
            return '[Circular]'
          }
          seen.add(processedVal)
        }

        return processedVal
      }
    }

    const result = JSON.stringify(value, finalReplacer as Parameters<typeof JSON.stringify>[1], space)

    // JSON.stringify returns undefined for certain values (functions, symbols, undefined)
    if (result === undefined) {
      return {
        success: false,
        data: defaultValue ?? null,
        error: 'Value is not JSON serializable'
      }
    }

    return {
      success: true,
      data: result,
      error: null
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown stringification error'

    if (logErrors) {
      console.error('[safeStringify] JSON stringification failed:', errorMessage)
    }

    return {
      success: false,
      data: defaultValue ?? null,
      error: errorMessage
    }
  }
}

/**
 * Stringifies value and returns the result or default (simplified API)
 *
 * @param value - The value to stringify
 * @param defaultValue - Value to return if stringification fails (default: '{}')
 * @param space - Indentation for pretty printing
 * @returns JSON string or default value
 *
 * @example
 * ```ts
 * const json = stringifyOrDefault(user, '{}')
 * localStorage.setItem('user', json)
 * ```
 */
export function stringifyOrDefault(
  value: unknown,
  defaultValue: string = '{}',
  space?: string | number
): string {
  const result = safeStringify(value, { space, handleCircular: true })
  return result.success && result.data !== null ? result.data : defaultValue
}

/**
 * Pretty prints JSON with indentation
 *
 * @param value - The value to stringify
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Pretty-printed JSON string
 *
 * @example
 * ```ts
 * console.log(prettyPrint({ user: { name: "John" } }))
 * // {
 * //   "user": {
 * //     "name": "John"
 * //   }
 * // }
 * ```
 */
export function prettyPrint(value: unknown, indent: number = 2): string {
  return stringifyOrDefault(value, '{}', indent)
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if a string is valid JSON
 *
 * @param json - The string to check
 * @returns True if the string is valid JSON
 *
 * @example
 * ```ts
 * isValidJson('{"valid": true}')  // true
 * isValidJson('not json')          // false
 * isValidJson('')                  // false
 * ```
 */
export function isValidJson(json: string | null | undefined): boolean {
  return safeParse(json).success
}

/**
 * Deep clones an object using JSON parse/stringify
 * Returns null if cloning fails (e.g., circular references, non-serializable values)
 *
 * @param value - The value to clone
 * @returns Cloned value or null if cloning fails
 *
 * @example
 * ```ts
 * const original = { nested: { value: 1 } }
 * const cloned = deepClone(original)
 * cloned.nested.value = 2
 * console.log(original.nested.value) // Still 1
 * ```
 */
export function deepClone<T>(value: T): T | null {
  const stringified = safeStringify(value)
  if (!stringified.success || !stringified.data) {
    return null
  }

  const parsed = safeParse<T>(stringified.data)
  return parsed.success ? parsed.data : null
}

/**
 * Merges two JSON objects, with the second overriding the first
 *
 * @param base - Base JSON string or object
 * @param override - Override JSON string or object
 * @returns Merged object or null if merge fails
 *
 * @example
 * ```ts
 * const merged = mergeJson(
 *   '{"a": 1, "b": 2}',
 *   '{"b": 3, "c": 4}'
 * )
 * // { a: 1, b: 3, c: 4 }
 * ```
 */
export function mergeJson<T extends Record<string, unknown>>(
  base: string | T | null | undefined,
  override: string | T | null | undefined
): T | null {
  const baseObj = typeof base === 'string' ? safeParse<T>(base).data : base
  const overrideObj = typeof override === 'string' ? safeParse<T>(override).data : override

  if (!baseObj && !overrideObj) {
    return null
  }

  return {
    ...(baseObj || {}),
    ...(overrideObj || {})
  } as T
}

/**
 * Safely accesses a nested property in a JSON object
 *
 * @param json - JSON string or object
 * @param path - Dot-separated path to the property
 * @param defaultValue - Default value if property not found
 * @returns The value at the path or default value
 *
 * @example
 * ```ts
 * const json = '{"user": {"profile": {"name": "John"}}}'
 * getJsonPath(json, 'user.profile.name', 'Unknown') // "John"
 * getJsonPath(json, 'user.profile.age', 0)          // 0
 * ```
 */
export function getJsonPath<T = unknown>(
  json: string | Record<string, unknown> | null | undefined,
  path: string,
  defaultValue: T
): T {
  const obj = typeof json === 'string' ? safeParse(json).data : json

  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current !== undefined ? (current as T) : defaultValue
}
