/**
 * Voice Commands System
 *
 * Provides parseable voice commands for hands-free operation:
 * - Create workflow
 * - Execute/Run workflow
 * - Cancel workflow
 * - Help
 * - Navigation commands
 * - Status queries
 *
 * Supports both English and Arabic commands
 */

export type VoiceCommandType =
  | 'create_workflow'
  | 'execute_workflow'
  | 'run_workflow'
  | 'cancel_workflow'
  | 'stop'
  | 'help'
  | 'navigate'
  | 'status'
  | 'list_workflows'
  | 'save'
  | 'undo'
  | 'redo'
  | 'clear'
  | 'repeat'
  | 'mute'
  | 'unmute'
  | 'unknown'

export interface VoiceCommandMatch {
  type: VoiceCommandType
  confidence: number
  parameters: Record<string, string>
  originalText: string
  matchedPattern: string
}

export interface VoiceCommandHandler {
  type: VoiceCommandType
  handler: (params: Record<string, string>) => void | Promise<void>
}

// Command patterns with support for variations and parameters
interface CommandPattern {
  type: VoiceCommandType
  patterns: RegExp[]
  paramExtractor?: (match: RegExpMatchArray) => Record<string, string>
  description: string
  examples: string[]
}

// English command patterns
const ENGLISH_PATTERNS: CommandPattern[] = [
  {
    type: 'create_workflow',
    patterns: [
      /^(?:create|new|make|start|build)\s+(?:a\s+)?(?:new\s+)?workflow(?:\s+(?:called|named)\s+(.+))?$/i,
      /^(?:create|new|make)\s+(?:a\s+)?(?:new\s+)?(?:automation|process)(?:\s+(?:called|named)\s+(.+))?$/i,
    ],
    paramExtractor: (match) => ({ name: match[1]?.trim() || '' }),
    description: 'Create a new workflow',
    examples: ['create workflow', 'new workflow called My Automation', 'make a workflow']
  },
  {
    type: 'execute_workflow',
    patterns: [
      /^(?:execute|run|start|launch|begin)\s+(?:the\s+)?workflow(?:\s+(.+))?$/i,
      /^(?:execute|run|start)\s+(?:the\s+)?(?:automation|process)(?:\s+(.+))?$/i,
      /^go$/i,
      /^run\s+it$/i,
    ],
    paramExtractor: (match) => ({ workflowName: match[1]?.trim() || '' }),
    description: 'Execute or run a workflow',
    examples: ['execute workflow', 'run the workflow', 'start My Automation', 'go']
  },
  {
    type: 'run_workflow',
    patterns: [
      /^run$/i,
      /^execute$/i,
    ],
    description: 'Quick run command',
    examples: ['run', 'execute']
  },
  {
    type: 'cancel_workflow',
    patterns: [
      /^(?:cancel|abort|stop|terminate|end)\s+(?:the\s+)?(?:workflow|execution|process|automation)?$/i,
      /^(?:kill|halt)\s+(?:it|everything)?$/i,
    ],
    description: 'Cancel the current workflow',
    examples: ['cancel workflow', 'stop', 'abort execution']
  },
  {
    type: 'stop',
    patterns: [
      /^stop$/i,
      /^halt$/i,
      /^pause$/i,
    ],
    description: 'Stop listening or current action',
    examples: ['stop', 'halt', 'pause']
  },
  {
    type: 'help',
    patterns: [
      /^(?:help|help me|what can you do|show commands|list commands)$/i,
      /^(?:what|how)\s+(?:can|do)\s+(?:i|you)(?:\s+(?:say|do))?$/i,
      /^commands$/i,
    ],
    description: 'Show available voice commands',
    examples: ['help', 'what can you do', 'show commands']
  },
  {
    type: 'navigate',
    patterns: [
      /^(?:go|navigate|open|show)\s+(?:to\s+)?(?:the\s+)?(dashboard|workflows|templates|integrations|settings|profile|projects)$/i,
      /^(?:take me to|bring up)\s+(?:the\s+)?(dashboard|workflows|templates|integrations|settings|profile|projects)$/i,
    ],
    paramExtractor: (match) => ({ destination: match[1]?.toLowerCase() || '' }),
    description: 'Navigate to a page',
    examples: ['go to dashboard', 'open workflows', 'show settings']
  },
  {
    type: 'status',
    patterns: [
      /^(?:what(?:'s| is)\s+(?:the\s+)?)?status$/i,
      /^(?:show|get|check)\s+(?:the\s+)?status$/i,
      /^how(?:'s| is)\s+(?:it|the workflow)\s+going$/i,
    ],
    description: 'Check workflow status',
    examples: ['status', 'what is the status', 'show status']
  },
  {
    type: 'list_workflows',
    patterns: [
      /^(?:list|show|display)\s+(?:all\s+)?(?:my\s+)?workflows$/i,
      /^(?:what|which)\s+workflows\s+(?:do i have|are there)$/i,
    ],
    description: 'List all workflows',
    examples: ['list workflows', 'show my workflows']
  },
  {
    type: 'save',
    patterns: [
      /^save$/i,
      /^save\s+(?:it|this|workflow|changes)$/i,
    ],
    description: 'Save current work',
    examples: ['save', 'save workflow']
  },
  {
    type: 'undo',
    patterns: [
      /^undo$/i,
      /^undo\s+(?:that|last\s+(?:action|change))$/i,
      /^go\s+back$/i,
    ],
    description: 'Undo last action',
    examples: ['undo', 'undo that', 'go back']
  },
  {
    type: 'redo',
    patterns: [
      /^redo$/i,
      /^redo\s+(?:that|last\s+(?:action|change))$/i,
    ],
    description: 'Redo last undone action',
    examples: ['redo', 'redo that']
  },
  {
    type: 'clear',
    patterns: [
      /^clear$/i,
      /^clear\s+(?:all|everything|transcript)$/i,
      /^reset$/i,
    ],
    description: 'Clear current input or transcript',
    examples: ['clear', 'clear all', 'reset']
  },
  {
    type: 'repeat',
    patterns: [
      /^repeat$/i,
      /^(?:say|repeat)\s+(?:that|it)\s+again$/i,
      /^what(?:'d| did)\s+you\s+say$/i,
    ],
    description: 'Repeat last spoken message',
    examples: ['repeat', 'say that again']
  },
  {
    type: 'mute',
    patterns: [
      /^mute$/i,
      /^(?:be\s+)?quiet$/i,
      /^silence$/i,
      /^shut\s+up$/i,
    ],
    description: 'Mute voice feedback',
    examples: ['mute', 'quiet', 'silence']
  },
  {
    type: 'unmute',
    patterns: [
      /^unmute$/i,
      /^speak$/i,
      /^(?:turn\s+)?(?:sound|voice)\s+on$/i,
    ],
    description: 'Enable voice feedback',
    examples: ['unmute', 'speak']
  }
]

// Arabic command patterns
const ARABIC_PATTERNS: CommandPattern[] = [
  {
    type: 'create_workflow',
    patterns: [
      /^(?:انشئ|اصنع|ابدأ)\s+(?:عمل|سير عمل|أتمتة)(?:\s+(?:باسم|يسمى)\s+(.+))?$/,
      /^(?:جديد)\s+(?:عمل|سير عمل)$/,
    ],
    paramExtractor: (match) => ({ name: match[1]?.trim() || '' }),
    description: 'إنشاء سير عمل جديد',
    examples: ['انشئ عمل', 'اصنع سير عمل جديد']
  },
  {
    type: 'execute_workflow',
    patterns: [
      /^(?:نفذ|شغل|ابدأ)\s+(?:سير )?(?:العمل|الأتمتة)?$/,
      /^(?:اذهب|انطلق)$/,
    ],
    description: 'تنفيذ سير العمل',
    examples: ['نفذ العمل', 'شغل', 'اذهب']
  },
  {
    type: 'cancel_workflow',
    patterns: [
      /^(?:الغي|اوقف|انهي|توقف)\s+(?:سير )?(?:العمل|التنفيذ)?$/,
      /^قف$/,
    ],
    description: 'إلغاء سير العمل',
    examples: ['الغي العمل', 'اوقف', 'قف']
  },
  {
    type: 'stop',
    patterns: [
      /^قف$/,
      /^توقف$/,
    ],
    description: 'توقف',
    examples: ['قف', 'توقف']
  },
  {
    type: 'help',
    patterns: [
      /^(?:مساعدة|ساعدني|ماذا يمكنك)$/,
      /^(?:الأوامر|اظهر الأوامر)$/,
    ],
    description: 'عرض الأوامر المتاحة',
    examples: ['مساعدة', 'ماذا يمكنك', 'الأوامر']
  },
  {
    type: 'navigate',
    patterns: [
      /^(?:اذهب|انتقل|افتح)\s+(?:إلى\s+)?(?:ال)?(لوحة التحكم|المشاريع|القوالب|الإعدادات)$/,
    ],
    paramExtractor: (match) => {
      const arabicToEnglish: Record<string, string> = {
        'لوحة التحكم': 'dashboard',
        'المشاريع': 'projects',
        'القوالب': 'templates',
        'الإعدادات': 'settings'
      }
      return { destination: arabicToEnglish[match[1]] || match[1] }
    },
    description: 'الانتقال إلى صفحة',
    examples: ['اذهب إلى لوحة التحكم', 'افتح المشاريع']
  },
  {
    type: 'status',
    patterns: [
      /^(?:الحالة|ما الحالة|أظهر الحالة)$/,
      /^(?:كيف|ما)\s+(?:هي\s+)?(?:الحالة|التقدم)$/,
    ],
    description: 'التحقق من الحالة',
    examples: ['الحالة', 'ما الحالة']
  },
  {
    type: 'save',
    patterns: [
      /^(?:احفظ|حفظ)$/,
    ],
    description: 'حفظ العمل',
    examples: ['احفظ', 'حفظ']
  },
  {
    type: 'undo',
    patterns: [
      /^(?:تراجع|ارجع)$/,
    ],
    description: 'تراجع',
    examples: ['تراجع', 'ارجع']
  },
  {
    type: 'redo',
    patterns: [
      /^(?:أعد|إعادة)$/,
    ],
    description: 'إعادة',
    examples: ['أعد', 'إعادة']
  },
  {
    type: 'mute',
    patterns: [
      /^(?:صامت|اسكت|صمت)$/,
    ],
    description: 'كتم الصوت',
    examples: ['صامت', 'اسكت']
  },
  {
    type: 'unmute',
    patterns: [
      /^(?:تكلم|فعل الصوت)$/,
    ],
    description: 'تفعيل الصوت',
    examples: ['تكلم']
  }
]

/**
 * Voice Command Parser
 */
export class VoiceCommandParser {
  private handlers: Map<VoiceCommandType, VoiceCommandHandler['handler']> = new Map()
  private language: 'en' | 'ar' = 'en'
  private lastCommand: VoiceCommandMatch | null = null

  constructor(language: 'en' | 'ar' = 'en') {
    this.language = language
  }

  /**
   * Set the command language
   */
  setLanguage(language: 'en' | 'ar'): void {
    this.language = language
  }

  /**
   * Get current language
   */
  getLanguage(): 'en' | 'ar' {
    return this.language
  }

  /**
   * Register a command handler
   */
  registerHandler(type: VoiceCommandType, handler: VoiceCommandHandler['handler']): () => void {
    this.handlers.set(type, handler)
    return () => this.handlers.delete(type)
  }

  /**
   * Register multiple handlers at once
   */
  registerHandlers(handlers: VoiceCommandHandler[]): () => void {
    handlers.forEach(h => this.handlers.set(h.type, h.handler))
    return () => handlers.forEach(h => this.handlers.delete(h.type))
  }

  /**
   * Parse a voice transcript into a command
   */
  parse(transcript: string): VoiceCommandMatch {
    const normalizedText = transcript.trim().toLowerCase()
    const patterns = this.language === 'ar' ? ARABIC_PATTERNS : ENGLISH_PATTERNS

    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        const match = normalizedText.match(regex)
        if (match) {
          const result: VoiceCommandMatch = {
            type: pattern.type,
            confidence: 1.0,
            parameters: pattern.paramExtractor ? pattern.paramExtractor(match) : {},
            originalText: transcript,
            matchedPattern: regex.toString()
          }
          this.lastCommand = result
          return result
        }
      }
    }

    // No match found
    const unknownResult: VoiceCommandMatch = {
      type: 'unknown',
      confidence: 0,
      parameters: { text: transcript },
      originalText: transcript,
      matchedPattern: ''
    }
    this.lastCommand = unknownResult
    return unknownResult
  }

  /**
   * Parse and execute a command
   */
  async execute(transcript: string): Promise<VoiceCommandMatch> {
    const command = this.parse(transcript)

    const handler = this.handlers.get(command.type)
    if (handler) {
      await handler(command.parameters)
    }

    return command
  }

  /**
   * Get the last parsed command
   */
  getLastCommand(): VoiceCommandMatch | null {
    return this.lastCommand
  }

  /**
   * Get all available commands for current language
   */
  getAvailableCommands(): Array<{
    type: VoiceCommandType
    description: string
    examples: string[]
  }> {
    const patterns = this.language === 'ar' ? ARABIC_PATTERNS : ENGLISH_PATTERNS
    return patterns.map(p => ({
      type: p.type,
      description: p.description,
      examples: p.examples
    }))
  }

  /**
   * Check if a handler is registered for a command type
   */
  hasHandler(type: VoiceCommandType): boolean {
    return this.handlers.has(type)
  }
}

// Singleton instance for global access
let globalParser: VoiceCommandParser | null = null

/**
 * Get the global voice command parser instance
 */
export function getVoiceCommandParser(): VoiceCommandParser {
  if (!globalParser) {
    globalParser = new VoiceCommandParser()
  }
  return globalParser
}

/**
 * Parse a voice command using the global parser
 */
export function parseVoiceCommand(transcript: string): VoiceCommandMatch {
  return getVoiceCommandParser().parse(transcript)
}

/**
 * Get help text for all commands
 */
export function getCommandHelpText(language: 'en' | 'ar' = 'en'): string {
  const patterns = language === 'ar' ? ARABIC_PATTERNS : ENGLISH_PATTERNS

  if (language === 'ar') {
    return patterns.map(p => `${p.description}: ${p.examples.join('، ')}`).join('\n')
  }

  return patterns.map(p => `${p.description}: ${p.examples.join(', ')}`).join('\n')
}

export default VoiceCommandParser
