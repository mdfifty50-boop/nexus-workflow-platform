import { test } from '@playwright/test'
import * as fs from 'fs'

/**
 * Visual Audit - Captures screenshots and tests every button
 */

const baseUrl = 'http://localhost:5175'
const screenshotDir = 'test-results/visual-audit'

// Ensure screenshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
})

test.describe('Visual Audit - Full Button Functionality Test', () => {

  test('Dashboard - capture and test all buttons', async ({ page }) => {
    // Skip onboarding
    await page.goto(baseUrl)
    await page.evaluate(() => {
      localStorage.setItem('nexus_onboarding_complete', 'true')
    })

    await page.goto(`${baseUrl}/dashboard`)
    await page.waitForTimeout(2000)

    // Screenshot the page
    await page.screenshot({ path: `${screenshotDir}/01-dashboard.png`, fullPage: true })

    // Find all buttons and log them
    const buttons = await page.locator('button').all()
    const buttonInfo: string[] = []

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      const text = await btn.textContent().catch(() => '')
      const isVisible = await btn.isVisible().catch(() => false)
      const isDisabled = await btn.isDisabled().catch(() => true)
      buttonInfo.push(`Button ${i}: "${text?.trim()}" - visible: ${isVisible}, disabled: ${isDisabled}`)
    }

    // Find all links
    const links = await page.locator('a').all()
    const linkInfo: string[] = []

    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const text = await link.textContent().catch(() => '')
      const href = await link.getAttribute('href').catch(() => '')
      const isVisible = await link.isVisible().catch(() => false)
      linkInfo.push(`Link ${i}: "${text?.trim()}" -> ${href} - visible: ${isVisible}`)
    }

    // Write audit report
    fs.writeFileSync(`${screenshotDir}/01-dashboard-audit.txt`,
      `DASHBOARD AUDIT\n${'='.repeat(50)}\n\nBUTTONS:\n${buttonInfo.join('\n')}\n\nLINKS:\n${linkInfo.join('\n')}`)

    // Click the main CTA button if exists
    const newWorkflowBtn = page.locator('a:has-text("New"), button:has-text("New")').first()
    if (await newWorkflowBtn.isVisible()) {
      await newWorkflowBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/01-dashboard-after-new-click.png`, fullPage: true })
    }
  })

  test('Workflows page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/workflows`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/02-workflows.png`, fullPage: true })

    // Find all interactive elements
    const buttons = await page.locator('button').all()
    const buttonInfo: string[] = []

    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      const btn = buttons[i]
      const text = await btn.textContent().catch(() => '')
      const isVisible = await btn.isVisible().catch(() => false)
      buttonInfo.push(`Button ${i}: "${text?.trim().substring(0, 50)}" - visible: ${isVisible}`)
    }

    fs.writeFileSync(`${screenshotDir}/02-workflows-audit.txt`,
      `WORKFLOWS AUDIT\n${'='.repeat(50)}\n\nBUTTONS:\n${buttonInfo.join('\n')}`)

    // Try clicking Create Workflow button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Workflow")').first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/02-workflows-after-create-click.png`, fullPage: true })
    }
  })

  test('Templates page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/templates`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/03-templates.png`, fullPage: true })

    // Test Preview button
    const previewBtn = page.locator('button:has-text("Preview")').first()
    if (await previewBtn.isVisible()) {
      await previewBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${screenshotDir}/03-templates-preview-modal.png`, fullPage: true })

      // Close modal if open
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("×")').first()
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
      }
    }

    // Test Use Template button
    const useBtn = page.locator('button:has-text("Use Template"), button:has-text("Use")').first()
    if (await useBtn.isVisible()) {
      await useBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/03-templates-after-use-click.png`, fullPage: true })
    }
  })

  test('Integrations page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/integrations`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/04-integrations.png`, fullPage: true })

    // Find all Connect buttons
    const connectBtns = await page.locator('button:has-text("Connect")').all()
    const buttonInfo: string[] = [`Found ${connectBtns.length} Connect buttons`]

    // Click first Connect button
    if (connectBtns.length > 0 && await connectBtns[0].isVisible()) {
      await connectBtns[0].click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/04-integrations-after-connect-click.png`, fullPage: true })
    }

    fs.writeFileSync(`${screenshotDir}/04-integrations-audit.txt`,
      `INTEGRATIONS AUDIT\n${'='.repeat(50)}\n\n${buttonInfo.join('\n')}`)
  })

  test('Settings page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/settings`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/05-settings.png`, fullPage: true })

    // Find all tabs and buttons
    const tabs = await page.locator('[role="tab"], button').all()
    const tabInfo: string[] = []

    for (let i = 0; i < Math.min(tabs.length, 15); i++) {
      const tab = tabs[i]
      const text = await tab.textContent().catch(() => '')
      tabInfo.push(`Tab/Button ${i}: "${text?.trim()}"`)
    }

    fs.writeFileSync(`${screenshotDir}/05-settings-audit.txt`,
      `SETTINGS AUDIT\n${'='.repeat(50)}\n\n${tabInfo.join('\n')}`)

    // Click on different tabs
    const notificationsTab = page.locator('button:has-text("Notifications")').first()
    if (await notificationsTab.isVisible()) {
      await notificationsTab.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${screenshotDir}/05-settings-notifications-tab.png`, fullPage: true })
    }

    // Try Save button
    const saveBtn = page.locator('button:has-text("Save")').first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/05-settings-after-save.png`, fullPage: true })
    }
  })

  test('Projects page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/projects`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/06-projects.png`, fullPage: true })

    // Test New Project button
    const newProjectBtn = page.locator('button:has-text("New Project"), button:has-text("Create Project")').first()
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/06-projects-after-new-click.png`, fullPage: true })
    }
  })

  test('Landing page - capture and test all buttons', async ({ page }) => {
    await page.goto(baseUrl)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${screenshotDir}/07-landing.png`, fullPage: true })

    // Find all CTA buttons
    const ctaButtons = await page.locator('button, a[href]').all()
    const buttonInfo: string[] = []

    for (let i = 0; i < Math.min(ctaButtons.length, 30); i++) {
      const btn = ctaButtons[i]
      const text = await btn.textContent().catch(() => '')
      const href = await btn.getAttribute('href').catch(() => null)
      const isVisible = await btn.isVisible().catch(() => false)
      if (isVisible && text?.trim()) {
        buttonInfo.push(`Element ${i}: "${text?.trim().substring(0, 40)}" ${href ? `-> ${href}` : '(button)'}`)
      }
    }

    fs.writeFileSync(`${screenshotDir}/07-landing-audit.txt`,
      `LANDING PAGE AUDIT\n${'='.repeat(50)}\n\n${buttonInfo.join('\n')}`)

    // Click Get Started
    const getStartedBtn = page.locator('button:has-text("Get Started"), a:has-text("Get Started")').first()
    if (await getStartedBtn.isVisible()) {
      await getStartedBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${screenshotDir}/07-landing-after-getstarted.png`, fullPage: true })
    }
  })

  test('Sidebar navigation - test all nav items', async ({ page }) => {
    await page.goto(baseUrl)
    await page.evaluate(() => localStorage.setItem('nexus_onboarding_complete', 'true'))

    await page.goto(`${baseUrl}/dashboard`)
    await page.waitForTimeout(1500)

    // Find sidebar nav items
    const navItems = await page.locator('nav a, aside a').all()
    const navInfo: string[] = []

    for (let i = 0; i < navItems.length; i++) {
      const nav = navItems[i]
      const text = await nav.textContent().catch(() => '')
      const href = await nav.getAttribute('href').catch(() => '')
      navInfo.push(`Nav ${i}: "${text?.trim()}" -> ${href}`)
    }

    fs.writeFileSync(`${screenshotDir}/08-sidebar-nav-audit.txt`,
      `SIDEBAR NAVIGATION AUDIT\n${'='.repeat(50)}\n\n${navInfo.join('\n')}`)
  })
})
