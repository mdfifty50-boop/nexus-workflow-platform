/**
 * Safe Expression Evaluator
 *
 * SECURITY: This module replaces dangerous eval/new Function() calls with a
 * whitelist-based expression parser that prevents Remote Code Execution (RCE).
 *
 * ONLY supports:
 * - Property access (input.field, input.nested.field, input['field'])
 * - Comparisons (===, ==, !==, !=, <, <=, >, >=)
 * - Logical operators (&&, ||, !)
 * - Arithmetic (+, -, *, /, %)
 * - Literals (strings, numbers, booleans, null)
 * - Array access (input[0], input.items[1])
 * - Simple method calls: .length, .includes(), .startsWith(), .endsWith(), .toLowerCase(), .toUpperCase()
 * - typeof operator
 * - Ternary operator (condition ? a : b)
 *
 * DOES NOT support (blocked for security):
 * - Function calls (except whitelisted string methods)
 * - Object construction
 * - Assignment operators
 * - eval, Function, import, require
 * - this, window, document, global, process
 * - prototype, __proto__, constructor
 */

// Tokens for the lexer
type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'NULL'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'COMPARISON'
  | 'LOGICAL'
  | 'DOT'
  | 'BRACKET_OPEN'
  | 'BRACKET_CLOSE'
  | 'PAREN_OPEN'
  | 'PAREN_CLOSE'
  | 'COMMA'
  | 'QUESTION'
  | 'COLON'
  | 'NOT'
  | 'TYPEOF'
  | 'EOF'

interface Token {
  type: TokenType
  value: string | number | boolean | null
  raw: string
}

// Blocked identifiers that could be used for attacks
const BLOCKED_IDENTIFIERS = new Set([
  'eval',
  'Function',
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'window',
  'document',
  'global',
  'globalThis',
  'process',
  'require',
  'import',
  'module',
  'exports',
  'this',
  'self',
  'top',
  'parent',
  'frames',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'Proxy',
  'Reflect',
  'Symbol',
  'AsyncFunction',
  'GeneratorFunction',
  'AsyncGeneratorFunction',
])

// Whitelisted method names for string/array operations
const WHITELISTED_METHODS = new Set([
  'length',
  'includes',
  'startsWith',
  'endsWith',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'indexOf',
  'lastIndexOf',
  'slice',
  'substring',
  'charAt',
  'split',
  'join',
  'toString',
  'valueOf',
  'hasOwnProperty',
])

class SafeExpressionError extends Error {
  constructor(message: string) {
    super(`Safe Expression Error: ${message}`)
    this.name = 'SafeExpressionError'
  }
}

/**
 * Lexer: Converts expression string into tokens
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  const isDigit = (c: string) => /[0-9]/.test(c)
  const isAlpha = (c: string) => /[a-zA-Z_$]/.test(c)
  const isAlphaNum = (c: string) => /[a-zA-Z0-9_$]/.test(c)
  const isWhitespace = (c: string) => /\s/.test(c)

  while (pos < expression.length) {
    const char = expression[pos]

    // Skip whitespace
    if (isWhitespace(char)) {
      pos++
      continue
    }

    // Numbers (including decimals)
    if (isDigit(char) || (char === '.' && isDigit(expression[pos + 1]))) {
      let numStr = ''
      let hasDot = false
      while (pos < expression.length && (isDigit(expression[pos]) || (!hasDot && expression[pos] === '.'))) {
        if (expression[pos] === '.') hasDot = true
        numStr += expression[pos]
        pos++
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr), raw: numStr })
      continue
    }

    // Strings (single or double quotes)
    if (char === '"' || char === "'") {
      const quote = char
      let str = ''
      pos++ // Skip opening quote
      while (pos < expression.length && expression[pos] !== quote) {
        if (expression[pos] === '\\' && pos + 1 < expression.length) {
          pos++
          const escaped = expression[pos]
          switch (escaped) {
            case 'n': str += '\n'; break
            case 't': str += '\t'; break
            case 'r': str += '\r'; break
            case '\\': str += '\\'; break
            case "'": str += "'"; break
            case '"': str += '"'; break
            default: str += escaped
          }
        } else {
          str += expression[pos]
        }
        pos++
      }
      if (pos >= expression.length) {
        throw new SafeExpressionError('Unterminated string literal')
      }
      pos++ // Skip closing quote
      tokens.push({ type: 'STRING', value: str, raw: `${quote}${str}${quote}` })
      continue
    }

    // Identifiers and keywords
    if (isAlpha(char)) {
      let ident = ''
      while (pos < expression.length && isAlphaNum(expression[pos])) {
        ident += expression[pos]
        pos++
      }

      // Check for blocked identifiers
      if (BLOCKED_IDENTIFIERS.has(ident)) {
        throw new SafeExpressionError(`Blocked identifier: "${ident}" is not allowed for security reasons`)
      }

      // Keywords
      if (ident === 'true') {
        tokens.push({ type: 'BOOLEAN', value: true, raw: ident })
      } else if (ident === 'false') {
        tokens.push({ type: 'BOOLEAN', value: false, raw: ident })
      } else if (ident === 'null') {
        tokens.push({ type: 'NULL', value: null, raw: ident })
      } else if (ident === 'undefined') {
        tokens.push({ type: 'NULL', value: undefined as any, raw: ident })
      } else if (ident === 'typeof') {
        tokens.push({ type: 'TYPEOF', value: 'typeof', raw: ident })
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, raw: ident })
      }
      continue
    }

    // Multi-character operators
    const twoChar = expression.slice(pos, pos + 2)
    const threeChar = expression.slice(pos, pos + 3)

    if (threeChar === '===') {
      tokens.push({ type: 'COMPARISON', value: '===', raw: '===' })
      pos += 3
      continue
    }
    if (threeChar === '!==') {
      tokens.push({ type: 'COMPARISON', value: '!==', raw: '!==' })
      pos += 3
      continue
    }
    if (twoChar === '==') {
      tokens.push({ type: 'COMPARISON', value: '==', raw: '==' })
      pos += 2
      continue
    }
    if (twoChar === '!=') {
      tokens.push({ type: 'COMPARISON', value: '!=', raw: '!=' })
      pos += 2
      continue
    }
    if (twoChar === '<=') {
      tokens.push({ type: 'COMPARISON', value: '<=', raw: '<=' })
      pos += 2
      continue
    }
    if (twoChar === '>=') {
      tokens.push({ type: 'COMPARISON', value: '>=', raw: '>=' })
      pos += 2
      continue
    }
    if (twoChar === '&&') {
      tokens.push({ type: 'LOGICAL', value: '&&', raw: '&&' })
      pos += 2
      continue
    }
    if (twoChar === '||') {
      tokens.push({ type: 'LOGICAL', value: '||', raw: '||' })
      pos += 2
      continue
    }

    // Single-character operators
    switch (char) {
      case '<':
      case '>':
        tokens.push({ type: 'COMPARISON', value: char, raw: char })
        pos++
        continue
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        tokens.push({ type: 'OPERATOR', value: char, raw: char })
        pos++
        continue
      case '.':
        tokens.push({ type: 'DOT', value: '.', raw: '.' })
        pos++
        continue
      case '[':
        tokens.push({ type: 'BRACKET_OPEN', value: '[', raw: '[' })
        pos++
        continue
      case ']':
        tokens.push({ type: 'BRACKET_CLOSE', value: ']', raw: ']' })
        pos++
        continue
      case '(':
        tokens.push({ type: 'PAREN_OPEN', value: '(', raw: '(' })
        pos++
        continue
      case ')':
        tokens.push({ type: 'PAREN_CLOSE', value: ')', raw: ')' })
        pos++
        continue
      case ',':
        tokens.push({ type: 'COMMA', value: ',', raw: ',' })
        pos++
        continue
      case '?':
        tokens.push({ type: 'QUESTION', value: '?', raw: '?' })
        pos++
        continue
      case ':':
        tokens.push({ type: 'COLON', value: ':', raw: ':' })
        pos++
        continue
      case '!':
        tokens.push({ type: 'NOT', value: '!', raw: '!' })
        pos++
        continue
      default:
        throw new SafeExpressionError(`Unexpected character: "${char}"`)
    }
  }

  tokens.push({ type: 'EOF', value: null, raw: '' })
  return tokens
}

/**
 * Parser: Builds AST from tokens and evaluates in a single pass
 */
class ExpressionParser {
  private tokens: Token[]
  private pos: number
  private context: Record<string, any>

  constructor(tokens: Token[], context: Record<string, any>) {
    this.tokens = tokens
    this.pos = 0
    this.context = context
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: null, raw: '' }
  }

  private advance(): Token {
    const token = this.current()
    this.pos++
    return token
  }

  private expect(type: TokenType): Token {
    const token = this.current()
    if (token.type !== type) {
      throw new SafeExpressionError(`Expected ${type} but got ${token.type}`)
    }
    return this.advance()
  }

  parse(): any {
    const result = this.parseExpression()
    if (this.current().type !== 'EOF') {
      throw new SafeExpressionError(`Unexpected token: ${this.current().raw}`)
    }
    return result
  }

  private parseExpression(): any {
    return this.parseTernary()
  }

  private parseTernary(): any {
    let condition = this.parseOr()

    if (this.current().type === 'QUESTION') {
      this.advance() // consume ?
      const consequent = this.parseExpression()
      this.expect('COLON')
      const alternate = this.parseExpression()
      return condition ? consequent : alternate
    }

    return condition
  }

  private parseOr(): any {
    let left = this.parseAnd()

    while (this.current().type === 'LOGICAL' && this.current().value === '||') {
      this.advance()
      const right = this.parseAnd()
      left = left || right
    }

    return left
  }

  private parseAnd(): any {
    let left = this.parseComparison()

    while (this.current().type === 'LOGICAL' && this.current().value === '&&') {
      this.advance()
      const right = this.parseComparison()
      left = left && right
    }

    return left
  }

  private parseComparison(): any {
    let left = this.parseAdditive()

    while (this.current().type === 'COMPARISON') {
      const op = this.advance().value
      const right = this.parseAdditive()

      switch (op) {
        case '===': left = left === right; break
        case '!==': left = left !== right; break
        case '==': left = left == right; break
        case '!=': left = left != right; break
        case '<': left = left < right; break
        case '<=': left = left <= right; break
        case '>': left = left > right; break
        case '>=': left = left >= right; break
      }
    }

    return left
  }

  private parseAdditive(): any {
    let left = this.parseMultiplicative()

    while (this.current().type === 'OPERATOR' && (this.current().value === '+' || this.current().value === '-')) {
      const op = this.advance().value
      const right = this.parseMultiplicative()
      if (op === '+') {
        left = left + right
      } else {
        left = left - right
      }
    }

    return left
  }

  private parseMultiplicative(): any {
    let left = this.parseUnary()

    while (this.current().type === 'OPERATOR' && ['*', '/', '%'].includes(this.current().value as string)) {
      const op = this.advance().value
      const right = this.parseUnary()
      switch (op) {
        case '*': left = left * right; break
        case '/': left = left / right; break
        case '%': left = left % right; break
      }
    }

    return left
  }

  private parseUnary(): any {
    if (this.current().type === 'NOT') {
      this.advance()
      return !this.parseUnary()
    }

    if (this.current().type === 'OPERATOR' && this.current().value === '-') {
      this.advance()
      return -this.parseUnary()
    }

    if (this.current().type === 'TYPEOF') {
      this.advance()
      return typeof this.parseUnary()
    }

    return this.parseMemberOrCall()
  }

  private parseMemberOrCall(): any {
    let object = this.parsePrimary()

    while (true) {
      if (this.current().type === 'DOT') {
        this.advance()
        const prop = this.expect('IDENTIFIER').value as string

        // Check for blocked property access
        if (BLOCKED_IDENTIFIERS.has(prop)) {
          throw new SafeExpressionError(`Blocked property access: "${prop}"`)
        }

        // Handle method calls
        if (this.current().type === 'PAREN_OPEN') {
          this.advance()
          const args: any[] = []

          if (this.current().type !== 'PAREN_CLOSE') {
            args.push(this.parseExpression())
            while (this.current().type === 'COMMA') {
              this.advance()
              args.push(this.parseExpression())
            }
          }

          this.expect('PAREN_CLOSE')

          // Only allow whitelisted methods
          if (!WHITELISTED_METHODS.has(prop)) {
            throw new SafeExpressionError(`Method "${prop}" is not allowed. Only whitelisted methods are permitted.`)
          }

          if (object == null) {
            throw new SafeExpressionError(`Cannot call method "${prop}" on null/undefined`)
          }

          const method = object[prop]
          if (typeof method !== 'function') {
            throw new SafeExpressionError(`"${prop}" is not a function`)
          }

          object = method.apply(object, args)
        } else {
          // Property access
          if (object == null) {
            object = undefined
          } else {
            object = object[prop]
          }
        }
      } else if (this.current().type === 'BRACKET_OPEN') {
        this.advance()
        const index = this.parseExpression()
        this.expect('BRACKET_CLOSE')

        // Validate index isn't a blocked property
        if (typeof index === 'string' && BLOCKED_IDENTIFIERS.has(index)) {
          throw new SafeExpressionError(`Blocked property access: "${index}"`)
        }

        if (object == null) {
          object = undefined
        } else {
          object = object[index]
        }
      } else {
        break
      }
    }

    return object
  }

  private parsePrimary(): any {
    const token = this.current()

    switch (token.type) {
      case 'NUMBER':
      case 'STRING':
      case 'BOOLEAN':
      case 'NULL':
        this.advance()
        return token.value

      case 'IDENTIFIER':
        this.advance()
        const name = token.value as string

        // Special handling for 'input' - the main context variable
        if (name === 'input') {
          return this.context.input
        }

        // Check if identifier exists in context
        if (name in this.context) {
          return this.context[name]
        }

        // Return undefined for unknown identifiers (safer than throwing)
        return undefined

      case 'PAREN_OPEN':
        this.advance()
        const expr = this.parseExpression()
        this.expect('PAREN_CLOSE')
        return expr

      case 'BRACKET_OPEN':
        // Array literal
        this.advance()
        const elements: any[] = []
        if (this.current().type !== 'BRACKET_CLOSE') {
          elements.push(this.parseExpression())
          while (this.current().type === 'COMMA') {
            this.advance()
            elements.push(this.parseExpression())
          }
        }
        this.expect('BRACKET_CLOSE')
        return elements

      default:
        throw new SafeExpressionError(`Unexpected token: ${token.raw || token.type}`)
    }
  }
}

/**
 * Safely evaluate a condition expression
 *
 * @param condition - The condition expression to evaluate (e.g., "input.value > 10")
 * @param input - The input object available as 'input' in the expression
 * @returns The boolean result of the condition
 * @throws SafeExpressionError if the expression is invalid or uses blocked operations
 */
export function evaluateCondition(condition: string, input: any): boolean {
  if (!condition || condition.trim() === '') {
    return true
  }

  // Normalize common condition patterns
  const normalizedCondition = condition.trim()

  // Quick safety check - reject obvious attack patterns
  const dangerousPatterns = [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /\bsetTimeout\s*\(/i,
    /\bsetInterval\s*\(/i,
    /\bimport\s*\(/i,
    /\brequire\s*\(/i,
    /`[^`]*\$\{/,  // Template literals with expressions
    /\.\s*constructor/i,
    /\.\s*__proto__/i,
    /\.\s*prototype/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalizedCondition)) {
      throw new SafeExpressionError('Expression contains blocked pattern')
    }
  }

  try {
    const tokens = tokenize(normalizedCondition)
    const parser = new ExpressionParser(tokens, { input })
    const result = parser.parse()
    return Boolean(result)
  } catch (error) {
    if (error instanceof SafeExpressionError) {
      throw error
    }
    throw new SafeExpressionError(`Failed to evaluate condition: ${error}`)
  }
}

/**
 * Safe data transformation operations
 * Instead of arbitrary code execution, this provides a predefined set of transformations
 */
export interface TransformOperation {
  type: 'pick' | 'omit' | 'rename' | 'map_field' | 'filter' | 'default' | 'flatten' | 'merge' | 'expression'
  // For pick/omit: fields to include/exclude
  fields?: string[]
  // For rename: { oldName: newName }
  renames?: Record<string, string>
  // For map_field: { fieldName: expression }
  mappings?: Record<string, string>
  // For filter: condition expression
  condition?: string
  // For default: { fieldName: defaultValue }
  defaults?: Record<string, any>
  // For expression: a safe expression to evaluate
  expression?: string
}

/**
 * Safely transform data using predefined operations
 *
 * @param input - The input data to transform
 * @param operations - Array of transform operations to apply
 * @returns The transformed data
 */
export function transformData(input: any, operations: TransformOperation[]): any {
  let result = input

  for (const op of operations) {
    switch (op.type) {
      case 'pick':
        if (Array.isArray(result)) {
          result = result.map(item => pickFields(item, op.fields || []))
        } else {
          result = pickFields(result, op.fields || [])
        }
        break

      case 'omit':
        if (Array.isArray(result)) {
          result = result.map(item => omitFields(item, op.fields || []))
        } else {
          result = omitFields(result, op.fields || [])
        }
        break

      case 'rename':
        if (Array.isArray(result)) {
          result = result.map(item => renameFields(item, op.renames || {}))
        } else {
          result = renameFields(result, op.renames || {})
        }
        break

      case 'map_field':
        if (Array.isArray(result)) {
          result = result.map(item => mapFields(item, op.mappings || {}))
        } else {
          result = mapFields(result, op.mappings || {})
        }
        break

      case 'filter':
        if (Array.isArray(result)) {
          result = result.filter(item => evaluateCondition(op.condition || 'true', item))
        }
        break

      case 'default':
        if (Array.isArray(result)) {
          result = result.map(item => applyDefaults(item, op.defaults || {}))
        } else {
          result = applyDefaults(result, op.defaults || {})
        }
        break

      case 'flatten':
        if (Array.isArray(result)) {
          result = result.flat()
        }
        break

      case 'merge':
        if (typeof result === 'object' && !Array.isArray(result)) {
          result = { ...result, ...op.defaults }
        }
        break

      case 'expression':
        // Evaluate a safe expression and return the result
        if (op.expression) {
          const tokens = tokenize(op.expression)
          const parser = new ExpressionParser(tokens, { input: result })
          result = parser.parse()
        }
        break
    }
  }

  return result
}

// Helper functions for transformations
function pickFields(obj: any, fields: string[]): any {
  if (typeof obj !== 'object' || obj === null) return obj
  const result: Record<string, any> = {}
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field]
    }
  }
  return result
}

function omitFields(obj: any, fields: string[]): any {
  if (typeof obj !== 'object' || obj === null) return obj
  const omitSet = new Set(fields)
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (!omitSet.has(key)) {
      result[key] = value
    }
  }
  return result
}

function renameFields(obj: any, renames: Record<string, string>): any {
  if (typeof obj !== 'object' || obj === null) return obj
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = renames[key] || key
    result[newKey] = value
  }
  return result
}

function mapFields(obj: any, mappings: Record<string, string>): any {
  if (typeof obj !== 'object' || obj === null) return obj
  const result = { ...obj }
  for (const [field, expression] of Object.entries(mappings)) {
    try {
      const tokens = tokenize(expression)
      const parser = new ExpressionParser(tokens, { input: obj })
      result[field] = parser.parse()
    } catch {
      // Keep original value if expression fails
    }
  }
  return result
}

function applyDefaults(obj: any, defaults: Record<string, any>): any {
  if (typeof obj !== 'object' || obj === null) return { ...defaults }
  const result = { ...defaults, ...obj }
  return result
}

/**
 * Parse legacy transform code into safe operations
 * This attempts to convert simple JavaScript transform patterns into safe operations
 *
 * @param transformCode - The legacy transform code
 * @returns An array of safe transform operations, or null if conversion is not possible
 */
export function parseLegacyTransform(transformCode: string): TransformOperation[] | null {
  const code = transformCode.trim()

  // Handle "return input" or just "input"
  if (code === 'return input' || code === 'input') {
    return [] // No-op, return input as-is
  }

  // Handle "return input.field" patterns
  const simpleFieldMatch = code.match(/^return\s+input\.(\w+)$/)
  if (simpleFieldMatch) {
    return [{ type: 'expression', expression: `input.${simpleFieldMatch[1]}` }]
  }

  // Handle "return { ...input, field: value }"
  const spreadMatch = code.match(/^return\s*\{\s*\.\.\.input\s*,\s*(\w+)\s*:\s*(.+)\s*\}$/)
  if (spreadMatch) {
    return [
      { type: 'map_field', mappings: { [spreadMatch[1]]: spreadMatch[2] } }
    ]
  }

  // Handle "return { field1: input.x, field2: input.y }"
  const objectLiteralMatch = code.match(/^return\s*\{([^}]+)\}$/)
  if (objectLiteralMatch) {
    const mappings: Record<string, string> = {}
    const pairs = objectLiteralMatch[1].split(',')
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim())
      if (key && value) {
        mappings[key] = value
      }
    }
    if (Object.keys(mappings).length > 0) {
      return [{ type: 'map_field', mappings }]
    }
  }

  // Cannot safely convert - return null to signal legacy code needs review
  return null
}

// Export types
export { SafeExpressionError }
