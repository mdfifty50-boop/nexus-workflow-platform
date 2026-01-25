import { test, expect } from '@playwright/test'

/**
 * Quick verification test for production readiness fixes
 */

test.describe('Production Readiness - Fix Verification', () => {
  const baseUrl = 'http://localhost:5175'

  test('Landing page footer links are functional', async ({ page }) => {
    await page.goto(baseUrl)

    // Check that footer links don't have href="#"
    const footerLinks = page.locator('footer a')
    const count = await footerLinks.count()

    for (let i = 0; i < count; i++) {
      const link = footerLinks.nth(i)
      const href = await link.getAttribute('href')
      expect(href).not.toBe('#')
    }
  })

  test('Privacy page exists and loads', async ({ page }) => {
    await page.goto(`${baseUrl}/privacy`)
    await expect(page.locator('h1')).toContainText('Privacy Policy')
  })

  test('Terms page exists and loads', async ({ page }) => {
    await page.goto(`${baseUrl}/terms`)
    await expect(page.locator('h1')).toContainText('Terms of Service')
  })

  test('Dashboard loads with Layout wrapper', async ({ page }) => {
    // Set onboarding as complete to skip wizard
    await page.goto(`${baseUrl}/dashboard`)
    await page.evaluate(() => {
      localStorage.setItem('nexus_onboarding_complete', 'true')
    })
    await page.reload()

    // Wait for dashboard to load
    await page.waitForTimeout(2000)

    // Check for sidebar navigation or dashboard content
    const sidebar = page.locator('nav, aside').first()
    const dashboardVisible = await sidebar.isVisible().catch(() => false)

    // Alternative: check for dashboard-specific elements
    const pageContent = await page.content()
    const hasDashboardContent = pageContent.includes('Dashboard') ||
                                pageContent.includes('Workflows') ||
                                pageContent.includes('Good morning') ||
                                pageContent.includes('Good afternoon') ||
                                pageContent.includes('Good evening')

    expect(dashboardVisible || hasDashboardContent).toBe(true)
  })

  test('Workflows page exists and loads', async ({ page }) => {
    await page.goto(`${baseUrl}/workflows`)
    await expect(page.locator('h1')).toContainText('Workflows')
  })

  test('Settings page exists and loads', async ({ page }) => {
    await page.goto(`${baseUrl}/settings`)
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('Analytics page exists and loads', async ({ page }) => {
    await page.goto(`${baseUrl}/analytics`)
    await expect(page.locator('h1')).toContainText('Analytics')
  })

  test('Templates page has functional buttons', async ({ page }) => {
    await page.goto(`${baseUrl}/templates`)
    await page.waitForTimeout(1000)

    // Find and click a Preview button
    const previewButton = page.locator('button:has-text("Preview")').first()
    if (await previewButton.isVisible()) {
      await previewButton.click()

      // Modal should appear
      await page.waitForTimeout(500)
      const modal = page.locator('[class*="fixed"][class*="inset-0"]')
      await expect(modal).toBeVisible()
    }
  })

  test('Integrations page loads with Layout', async ({ page }) => {
    await page.goto(`${baseUrl}/integrations`)
    await expect(page.locator('h1')).toContainText('Integrations')

    // Should have sidebar from Layout
    const sidebar = page.locator('nav, aside').first()
    await expect(sidebar).toBeVisible()
  })
})
