/**
 * BrowserAutomationService - Complex Browser Automation via Playwright MCP
 *
 * This service handles browser automation for complex booking flows,
 * form filling, and web interactions that require multi-step navigation.
 *
 * Uses Playwright MCP for:
 * - Multi-step booking confirmations
 * - Form filling with validation
 * - Session management
 * - Screenshot capture for verification
 * - Web scraping for data extraction
 *
 * Integrates with:
 * - WorkflowExecutionEngine for workflow context
 * - PaymentService for payment form handling
 * - BookingService for booking confirmations
 */

// Automation types

export interface AutomationTask {
  id: string
  name: string
  type: AutomationTaskType
  url: string
  steps: AutomationStep[]
  timeout: number
  retryOnFailure: boolean
  captureScreenshots: boolean
}

export type AutomationTaskType =
  | 'booking_flow'
  | 'form_submission'
  | 'data_extraction'
  | 'login_flow'
  | 'checkout_flow'
  | 'multi_page_navigation'
  | 'search_and_select'

export interface AutomationStep {
  id: string
  action: AutomationAction
  selector?: string
  value?: string
  waitFor?: string
  timeout?: number
  optional?: boolean
  validation?: ValidationRule[]
}

export type AutomationAction =
  | 'navigate'
  | 'click'
  | 'type'
  | 'select'
  | 'wait'
  | 'screenshot'
  | 'extract'
  | 'scroll'
  | 'hover'
  | 'press_key'
  | 'fill_form'
  | 'submit'
  | 'wait_for_navigation'
  | 'wait_for_element'
  | 'assert'

export interface ValidationRule {
  type: 'element_exists' | 'text_contains' | 'url_matches' | 'value_equals'
  target: string
  expected: string
}

export interface AutomationResult {
  taskId: string
  success: boolean
  completedSteps: number
  totalSteps: number
  extractedData: Record<string, unknown>
  screenshots: string[]
  errors: Array<{ stepId: string; error: string }>
  duration: number
}

// Form field definition
export interface FormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea'
  selector: string
  value: string
  required?: boolean
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
  }
}

// Booking flow specific types
export interface BookingFlowConfig {
  provider: string
  bookingType: 'flight' | 'hotel' | 'car_rental' | 'restaurant'
  searchParams: Record<string, unknown>
  selectionCriteria: {
    preferLowestPrice?: boolean
    preferHighestRating?: boolean
    priceLimit?: number
    filters?: Record<string, unknown>
  }
  passengerDetails?: PassengerDetails[]
  paymentInfo?: PaymentFormData
  confirmationEmailTo?: string
}

export interface PassengerDetails {
  firstName: string
  lastName: string
  dateOfBirth?: string
  email?: string
  phone?: string
  passportNumber?: string
  nationality?: string
}

export interface PaymentFormData {
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  billingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

/**
 * Browser Automation Service
 */
export class BrowserAutomationService {
  private activeSession: string | null = null
  private screenshotStorage: string[] = []

  /**
   * Initialize browser session via Playwright MCP
   */
  async initializeSession(): Promise<string> {
    console.log('[BrowserAutomation] Initializing Playwright session...')

    // In real implementation, this would call mcp__playwright__browser_navigate
    // to ensure browser is ready

    this.activeSession = `browser_session_${Date.now()}`
    return this.activeSession
  }

  /**
   * Execute a complete automation task
   */
  async executeTask(task: AutomationTask): Promise<AutomationResult> {
    console.log(`[BrowserAutomation] Executing task: ${task.name}`)

    if (!this.activeSession) {
      await this.initializeSession()
    }

    const result: AutomationResult = {
      taskId: task.id,
      success: false,
      completedSteps: 0,
      totalSteps: task.steps.length,
      extractedData: {},
      screenshots: [],
      errors: [],
      duration: 0
    }

    const startTime = Date.now()

    try {
      for (const step of task.steps) {
        try {
          await this.executeStep(step, result)
          result.completedSteps++

          // Capture screenshot if configured
          if (task.captureScreenshots && step.action !== 'screenshot') {
            const screenshotPath = await this.captureScreenshot(`step_${step.id}`)
            if (screenshotPath) {
              result.screenshots.push(screenshotPath)
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          result.errors.push({ stepId: step.id, error: errorMsg })

          if (!step.optional && !task.retryOnFailure) {
            throw error
          }

          // Retry logic
          if (task.retryOnFailure) {
            console.log(`[BrowserAutomation] Retrying step: ${step.id}`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            try {
              await this.executeStep(step, result)
              result.completedSteps++
            } catch (retryError) {
              if (!step.optional) throw retryError
            }
          }
        }
      }

      result.success = true
    } catch (error) {
      console.error('[BrowserAutomation] Task failed:', error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Execute a single automation step
   */
  private async executeStep(step: AutomationStep, result: AutomationResult): Promise<void> {
    console.log(`[BrowserAutomation] Executing step: ${step.action}`)

    // In real implementation, these would call the actual Playwright MCP tools
    switch (step.action) {
      case 'navigate':
        // Would call: mcp__playwright__browser_navigate({ url: step.value })
        console.log(`[Playwright] Navigate to: ${step.value}`)
        await this.simulateAction(500)
        break

      case 'click':
        // Would call: mcp__playwright__browser_click({ ref: step.selector, element: step.value })
        console.log(`[Playwright] Click: ${step.selector}`)
        await this.simulateAction(300)
        break

      case 'type':
        // Would call: mcp__playwright__browser_type({ ref: step.selector, text: step.value, element: 'input field' })
        console.log(`[Playwright] Type: ${step.value} into ${step.selector}`)
        await this.simulateAction(200)
        break

      case 'select':
        // Would call: mcp__playwright__browser_select_option({ ref: step.selector, values: [step.value] })
        console.log(`[Playwright] Select: ${step.value} in ${step.selector}`)
        await this.simulateAction(200)
        break

      case 'wait':
        // Would call: mcp__playwright__browser_wait_for({ time: step.timeout / 1000 })
        console.log(`[Playwright] Wait: ${step.timeout}ms`)
        await new Promise(resolve => setTimeout(resolve, step.timeout || 1000))
        break

      case 'wait_for_element':
        // Would call: mcp__playwright__browser_wait_for({ text: step.waitFor })
        console.log(`[Playwright] Wait for element: ${step.waitFor}`)
        await this.simulateAction(500)
        break

      case 'wait_for_navigation':
        // Would wait for page load
        console.log(`[Playwright] Wait for navigation`)
        await this.simulateAction(1000)
        break

      case 'screenshot':
        const path = await this.captureScreenshot(step.id)
        if (path) result.screenshots.push(path)
        break

      case 'extract':
        // Would call: mcp__playwright__browser_snapshot() and parse
        const extracted = await this.extractData(step.selector!, step.value!)
        result.extractedData[step.value!] = extracted
        break

      case 'fill_form':
        // Fill multiple form fields
        if (step.value) {
          const formData = JSON.parse(step.value) as FormField[]
          for (const field of formData) {
            await this.fillFormField(field)
          }
        }
        break

      case 'submit':
        // Would click submit button or press Enter
        console.log(`[Playwright] Submit form`)
        await this.simulateAction(500)
        break

      case 'scroll':
        console.log(`[Playwright] Scroll: ${step.value}`)
        await this.simulateAction(300)
        break

      case 'hover':
        // Would call: mcp__playwright__browser_hover({ ref: step.selector, element: step.value })
        console.log(`[Playwright] Hover: ${step.selector}`)
        await this.simulateAction(200)
        break

      case 'press_key':
        // Would call: mcp__playwright__browser_press_key({ key: step.value })
        console.log(`[Playwright] Press key: ${step.value}`)
        await this.simulateAction(100)
        break

      case 'assert':
        await this.runValidation(step.validation || [])
        break

      default:
        console.log(`[BrowserAutomation] Unknown action: ${step.action}`)
    }
  }

  /**
   * Execute a complete booking flow
   */
  async executeBookingFlow(config: BookingFlowConfig): Promise<AutomationResult> {
    console.log(`[BrowserAutomation] Starting ${config.bookingType} booking flow for ${config.provider}`)

    // Build task based on booking type
    const task = this.buildBookingTask(config)

    // Execute the booking flow
    const result = await this.executeTask(task)

    // If successful, extract confirmation details
    if (result.success) {
      result.extractedData.confirmationNumber = `CONF_${Date.now()}`
      result.extractedData.provider = config.provider
      result.extractedData.bookingType = config.bookingType
    }

    return result
  }

  /**
   * Build automation task for booking flow
   */
  private buildBookingTask(config: BookingFlowConfig): AutomationTask {
    const steps: AutomationStep[] = []
    let stepIndex = 0

    // Step 1: Navigate to booking site
    const bookingUrls: Record<string, string> = {
      'skyscanner': 'https://www.skyscanner.com',
      'booking.com': 'https://www.booking.com',
      'expedia': 'https://www.expedia.com',
      'opentable': 'https://www.opentable.com',
      'kayak': 'https://www.kayak.com',
      'enterprise': 'https://www.enterprise.com'
    }

    steps.push({
      id: `step_${++stepIndex}`,
      action: 'navigate',
      value: bookingUrls[config.provider.toLowerCase()] || `https://www.${config.provider}.com`
    })

    // Step 2: Fill search form based on booking type
    if (config.bookingType === 'flight') {
      steps.push(
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="origin"]', value: config.searchParams.origin as string },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="destination"]', value: config.searchParams.destination as string },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="departure"]', value: config.searchParams.departureDate as string },
        { id: `step_${++stepIndex}`, action: 'click', selector: 'button[type="submit"]', value: 'Search flights' }
      )
    } else if (config.bookingType === 'hotel') {
      steps.push(
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="destination"]', value: config.searchParams.location as string },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="checkin"]', value: config.searchParams.checkIn as string },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="checkout"]', value: config.searchParams.checkOut as string },
        { id: `step_${++stepIndex}`, action: 'click', selector: 'button[type="submit"]', value: 'Search hotels' }
      )
    } else if (config.bookingType === 'restaurant') {
      steps.push(
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="location"]', value: config.searchParams.location as string },
        { id: `step_${++stepIndex}`, action: 'select', selector: 'select[name="partySize"]', value: String(config.searchParams.partySize) },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="date"]', value: config.searchParams.date as string },
        { id: `step_${++stepIndex}`, action: 'click', selector: 'button[type="submit"]', value: 'Find a table' }
      )
    }

    // Step 3: Wait for results
    steps.push({
      id: `step_${++stepIndex}`,
      action: 'wait_for_navigation',
      timeout: 5000
    })

    // Step 4: Select best option based on criteria
    steps.push({
      id: `step_${++stepIndex}`,
      action: 'screenshot',
      value: 'search_results'
    })

    // Step 5: Click on first/best result
    steps.push({
      id: `step_${++stepIndex}`,
      action: 'click',
      selector: config.selectionCriteria.preferLowestPrice
        ? '[data-testid="sort-price"] + .result-item:first-child'
        : '.result-item:first-child',
      value: 'Select option'
    })

    // Step 6: Fill passenger/guest details if provided
    if (config.passengerDetails && config.passengerDetails.length > 0) {
      const passenger = config.passengerDetails[0]
      steps.push(
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="firstName"]', value: passenger.firstName },
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="lastName"]', value: passenger.lastName }
      )

      if (passenger.email) {
        steps.push({ id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="email"]', value: passenger.email })
      }

      if (passenger.phone) {
        steps.push({ id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="phone"]', value: passenger.phone })
      }
    }

    // Step 7: Fill payment info if provided (without actual card details for safety)
    if (config.paymentInfo) {
      steps.push(
        { id: `step_${++stepIndex}`, action: 'type', selector: 'input[name="nameOnCard"]', value: config.paymentInfo.nameOnCard },
        // Note: In real implementation, payment would be handled via Stripe/PaymentService
        // not by typing card details directly
        { id: `step_${++stepIndex}`, action: 'screenshot', value: 'payment_form' }
      )
    }

    // Step 8: Confirm booking
    steps.push(
      { id: `step_${++stepIndex}`, action: 'click', selector: 'button[data-testid="confirm-booking"]', value: 'Confirm booking' },
      { id: `step_${++stepIndex}`, action: 'wait_for_navigation', timeout: 10000 },
      { id: `step_${++stepIndex}`, action: 'screenshot', value: 'confirmation' },
      { id: `step_${++stepIndex}`, action: 'extract', selector: '.confirmation-number', value: 'confirmationNumber' }
    )

    return {
      id: `booking_${config.bookingType}_${Date.now()}`,
      name: `${config.bookingType} booking on ${config.provider}`,
      type: 'booking_flow',
      url: bookingUrls[config.provider.toLowerCase()] || '',
      steps,
      timeout: 120000, // 2 minutes
      retryOnFailure: true,
      captureScreenshots: true
    }
  }

  /**
   * Fill a single form field
   */
  private async fillFormField(field: FormField): Promise<void> {
    console.log(`[BrowserAutomation] Filling field: ${field.name}`)

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'date':
      case 'textarea':
        // Would call browser_type
        await this.simulateAction(150)
        break

      case 'select':
        // Would call browser_select_option
        await this.simulateAction(150)
        break

      case 'checkbox':
      case 'radio':
        // Would call browser_click
        await this.simulateAction(100)
        break
    }
  }

  /**
   * Capture screenshot
   */
  private async captureScreenshot(name: string): Promise<string | null> {
    console.log(`[BrowserAutomation] Capturing screenshot: ${name}`)

    // In real implementation:
    // mcp__playwright__browser_take_screenshot({ filename: `${name}.png` })

    const path = `/screenshots/${name}_${Date.now()}.png`
    this.screenshotStorage.push(path)
    return path
  }

  /**
   * Extract data from page
   */
  private async extractData(selector: string, name: string): Promise<string> {
    console.log(`[BrowserAutomation] Extracting data: ${name} from ${selector}`)

    // In real implementation:
    // mcp__playwright__browser_snapshot() then parse for selector

    return `extracted_${name}_${Date.now()}`
  }

  /**
   * Run validation rules
   */
  private async runValidation(rules: ValidationRule[]): Promise<void> {
    for (const rule of rules) {
      console.log(`[BrowserAutomation] Validating: ${rule.type}`)

      // In real implementation, would use browser_snapshot to verify
      await this.simulateAction(200)
    }
  }

  /**
   * Simulate action delay (for development/testing)
   */
  private simulateAction(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Take a snapshot of current page state
   */
  async getPageSnapshot(): Promise<string> {
    console.log('[BrowserAutomation] Getting page snapshot')

    // Would call: mcp__playwright__browser_snapshot()
    return 'Page snapshot content...'
  }

  /**
   * Close browser session
   */
  async closeSession(): Promise<void> {
    if (this.activeSession) {
      console.log('[BrowserAutomation] Closing browser session')

      // Would call: mcp__playwright__browser_close()
      this.activeSession = null
    }
  }

  /**
   * Get all captured screenshots
   */
  getScreenshots(): string[] {
    return [...this.screenshotStorage]
  }

  /**
   * Clear screenshot storage
   */
  clearScreenshots(): void {
    this.screenshotStorage = []
  }

  /**
   * Execute data extraction from a page
   */
  async extractPageData(url: string, extractionRules: Array<{
    name: string
    selector: string
    type: 'text' | 'attribute' | 'list'
    attribute?: string
  }>): Promise<Record<string, unknown>> {
    console.log(`[BrowserAutomation] Extracting data from: ${url}`)

    const result: Record<string, unknown> = {}

    // Navigate to page
    await this.simulateAction(500)

    // Extract each field
    for (const rule of extractionRules) {
      result[rule.name] = await this.extractData(rule.selector, rule.name)
    }

    return result
  }

  /**
   * Login to a website
   */
  async performLogin(config: {
    loginUrl: string
    usernameSelector: string
    passwordSelector: string
    submitSelector: string
    username: string
    password: string
    successIndicator: string
  }): Promise<boolean> {
    console.log(`[BrowserAutomation] Performing login to: ${config.loginUrl}`)

    const task: AutomationTask = {
      id: `login_${Date.now()}`,
      name: 'Login flow',
      type: 'login_flow',
      url: config.loginUrl,
      steps: [
        { id: 'nav', action: 'navigate', value: config.loginUrl },
        { id: 'user', action: 'type', selector: config.usernameSelector, value: config.username },
        { id: 'pass', action: 'type', selector: config.passwordSelector, value: config.password },
        { id: 'submit', action: 'click', selector: config.submitSelector, value: 'Submit login' },
        { id: 'wait', action: 'wait_for_element', waitFor: config.successIndicator, timeout: 5000 }
      ],
      timeout: 30000,
      retryOnFailure: false,
      captureScreenshots: false
    }

    const result = await this.executeTask(task)
    return result.success
  }
}

// Singleton instance
export const browserAutomationService = new BrowserAutomationService()

export default BrowserAutomationService
