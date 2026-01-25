/**
 * TemplateService - Verified Workflow Templates (Move 6.7)
 *
 * Loads verified workflow templates and matches user input to templates.
 * When a match is found, the template's execution plan is used directly.
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  requiredIntegrations: string[]
  exampleUserInput: string
  keywords: string[]
  executionPlan: {
    tasks: Array<{
      id: string
      name: string
      type: string
      integrationId: string
      dependencies: string[]
      config: {
        toolSlug: string
        action?: string
        params: Record<string, unknown>
      }
    }>
    requiredIntegrations: string[]
  }
}

export interface TemplateMatch {
  template: WorkflowTemplate
  score: number
  matchedKeywords: string[]
}

class TemplateService {
  private templates: Map<string, WorkflowTemplate> = new Map()
  private initialized = false

  /**
   * Load all templates from the templates directory
   */
  loadTemplates(): void {
    if (this.initialized) return

    try {
      // Get the templates directory path
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)
      const templatesDir = join(__dirname, '../../src/workflows/templates')

      // Read all JSON files
      const files = readdirSync(templatesDir).filter(f => f.endsWith('.json'))

      for (const file of files) {
        try {
          const content = readFileSync(join(templatesDir, file), 'utf-8')
          const template: WorkflowTemplate = JSON.parse(content)
          this.templates.set(template.id, template)
          console.log(`[TemplateService] Loaded template: ${template.id}`)
        } catch (err) {
          console.error(`[TemplateService] Failed to load ${file}:`, err)
        }
      }

      this.initialized = true
      console.log(`[TemplateService] Loaded ${this.templates.size} templates`)
    } catch (err) {
      console.error('[TemplateService] Failed to load templates directory:', err)
    }
  }

  /**
   * Get all loaded templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    if (!this.initialized) this.loadTemplates()
    return Array.from(this.templates.values())
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): WorkflowTemplate | undefined {
    if (!this.initialized) this.loadTemplates()
    return this.templates.get(id)
  }

  /**
   * Match user input against templates using keyword matching
   * Returns the best matching template if score > 0.3
   */
  matchUserInput(userInput: string): TemplateMatch | null {
    if (!this.initialized) this.loadTemplates()

    const input = userInput.toLowerCase()
    let bestMatch: TemplateMatch | null = null

    for (const template of this.templates.values()) {
      const matchedKeywords: string[] = []

      for (const keyword of template.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
        }
      }

      // Score = matched keywords / total keywords
      const score = matchedKeywords.length / template.keywords.length

      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { template, score, matchedKeywords }
      }
    }

    if (bestMatch) {
      console.log(`[TemplateService] Matched template: ${bestMatch.template.id} (score: ${bestMatch.score.toFixed(2)})`)
    }

    return bestMatch
  }

  /**
   * Build a chat response from a template match
   */
  buildTemplateResponse(match: TemplateMatch): {
    message: string
    shouldGenerateWorkflow: boolean
    intent: string
    confidence: number
    workflowSpec: {
      name: string
      description: string
      steps: Array<{ id: string; name: string; tool: string; type: string }>
      requiredIntegrations: string[]
      executionPlan: WorkflowTemplate['executionPlan']
    }
    fromTemplate: string
  } {
    const { template, score } = match

    return {
      message: `I found a verified template for this! "${template.name}" - ${template.description}`,
      shouldGenerateWorkflow: true,
      intent: 'workflow',
      confidence: Math.min(0.95, score + 0.4), // High confidence for templates
      workflowSpec: {
        name: template.name,
        description: template.description,
        steps: template.executionPlan.tasks.map(t => ({
          id: t.id,
          name: t.name,
          tool: t.integrationId,
          type: t.type
        })),
        requiredIntegrations: template.requiredIntegrations,
        executionPlan: template.executionPlan
      },
      fromTemplate: template.id
    }
  }
}

export const templateService = new TemplateService()
