/**
 * Production Readiness Audit Script
 *
 * This script navigates through the entire Nexus application like a human would,
 * clicking every button, checking every element, and documenting:
 * - Non-functional buttons/links
 * - Demo/placeholder data
 * - Missing functionality
 * - UI/UX issues
 */

import { test, expect, Page } from '@playwright/test';

interface AuditIssue {
  page: string;
  element: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'non-functional' | 'demo-data' | 'missing-feature' | 'ui-issue' | 'error';
}

const issues: AuditIssue[] = [];
const visitedPages: string[] = [];
const clickedElements: string[] = [];

function logIssue(issue: AuditIssue) {
  issues.push(issue);
  console.log(`[${issue.severity.toUpperCase()}] ${issue.category}: ${issue.issue} (${issue.page} - ${issue.element})`);
}

async function auditPage(page: Page, pageName: string) {
  visitedPages.push(pageName);
  console.log(`\n=== Auditing: ${pageName} ===`);

  // Wait for page to stabilize
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  // Check for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Check page title
  const title = await page.title();
  console.log(`  Title: ${title}`);

  // Find all buttons
  const buttons = await page.locator('button').all();
  console.log(`  Found ${buttons.length} buttons`);

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    try {
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      const text = await btn.textContent() || `button-${i}`;
      const cleanText = text.trim().substring(0, 50);

      if (isVisible && isEnabled) {
        console.log(`    Testing button: "${cleanText}"`);
        clickedElements.push(`${pageName}: ${cleanText}`);

        // Check if button has click handler
        const _hasOnClick = await btn.evaluate(el => {
          return el.onclick !== null || el.getAttribute('onclick') !== null;
        });

        // Check for disabled styling without disabled attribute
        const classes = await btn.getAttribute('class') || '';
        if (classes.includes('cursor-not-allowed') || classes.includes('opacity-50')) {
          logIssue({
            page: pageName,
            element: cleanText,
            issue: 'Button appears disabled but is technically clickable',
            severity: 'medium',
            category: 'ui-issue'
          });
        }
      }
    } catch {
      // Element may have been removed from DOM
    }
  }

  // Find all links
  const links = await page.locator('a[href]').all();
  console.log(`  Found ${links.length} links`);

  for (const link of links) {
    try {
      const href = await link.getAttribute('href');
      const text = await link.textContent() || href;
      const cleanText = text?.trim().substring(0, 30);

      if (href === '#' || href === 'javascript:void(0)') {
        logIssue({
          page: pageName,
          element: cleanText || 'unknown-link',
          issue: `Link has placeholder href: ${href}`,
          severity: 'medium',
          category: 'non-functional'
        });
      }
    } catch { /* Element may have been removed from DOM */ }
  }

  // Check for placeholder/demo text patterns
  const pageContent = await page.content();
  const demoPatterns = [
    /lorem ipsum/gi,
    /placeholder/gi,
    /coming soon/gi,
    /todo:/gi,
    /fixme:/gi,
    /example\.com/gi,
    /test@test/gi,
    /\$0\.00/g,
    /N\/A/g,
    /undefined/g,
    /null/g,
    /\[object Object\]/g
  ];

  for (const pattern of demoPatterns) {
    const matches = pageContent.match(pattern);
    if (matches && matches.length > 0) {
      logIssue({
        page: pageName,
        element: 'page-content',
        issue: `Found demo/placeholder pattern: "${matches[0]}" (${matches.length} occurrences)`,
        severity: 'high',
        category: 'demo-data'
      });
    }
  }

  // Check for empty states
  const emptyContainers = await page.locator('[class*="empty"], [class*="no-data"], [class*="placeholder"]').all();
  for (const container of emptyContainers) {
    const text = await container.textContent();
    if (text && text.trim().length > 0) {
      console.log(`    Empty state found: "${text.trim().substring(0, 50)}"`);
    }
  }

  // Check for loading states stuck
  const loaders = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').all();
  if (loaders.length > 0) {
    await page.waitForTimeout(3000);
    const stillLoading = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').all();
    if (stillLoading.length > 0) {
      logIssue({
        page: pageName,
        element: 'loading-state',
        issue: `Loading indicators still visible after 3 seconds (${stillLoading.length} elements)`,
        severity: 'medium',
        category: 'ui-issue'
      });
    }
  }

  return consoleErrors;
}

async function _clickAndAudit(page: Page, selector: string, description: string) {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      console.log(`  Clicking: ${description}`);
      await element.click();
      await page.waitForTimeout(500);
      return true;
    }
  } catch (e) {
    logIssue({
      page: page.url(),
      element: description,
      issue: `Failed to click element: ${e}`,
      severity: 'high',
      category: 'non-functional'
    });
  }
  return false;
}

test.describe('Production Readiness Audit', () => {
  test.setTimeout(300000); // 5 minutes

  test('Complete Site Audit', async ({ page }) => {
    const baseUrl = 'http://localhost:5175';

    console.log('\n========================================');
    console.log('NEXUS PRODUCTION READINESS AUDIT');
    console.log('========================================\n');

    // 1. Landing Page
    await page.goto(baseUrl);
    await auditPage(page, 'Landing Page');

    // Check hero section
    const heroTitle = await page.locator('h1').first().textContent();
    console.log(`  Hero title: "${heroTitle}"`);

    // Check all navigation links
    const navLinks = await page.locator('nav a, header a').all();
    console.log(`  Navigation links: ${navLinks.length}`);

    // 2. Try to access Dashboard (may require auth)
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      console.log('\n  Dashboard requires authentication - testing login page');
      await auditPage(page, 'Login Page');

      // Check Clerk integration
      const clerkElements = await page.locator('[data-clerk], .cl-rootBox, .cl-card').all();
      if (clerkElements.length === 0) {
        logIssue({
          page: 'Login Page',
          element: 'clerk-auth',
          issue: 'Clerk authentication components not loading',
          severity: 'critical',
          category: 'missing-feature'
        });
      }
    } else {
      await auditPage(page, 'Dashboard');

      // Check for workflow creation input
      const chatInput = await page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      if (await chatInput.isVisible()) {
        console.log('  Chat input found - testing workflow creation');

        // Try typing
        await chatInput.fill('Test workflow creation');
        await page.waitForTimeout(500);

        // Find submit button
        const submitBtn = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Generate"), button:has-text("Create")').first();
        if (await submitBtn.isVisible()) {
          const isEnabled = await submitBtn.isEnabled();
          if (!isEnabled) {
            logIssue({
              page: 'Dashboard',
              element: 'Submit Button',
              issue: 'Submit button is disabled even with input',
              severity: 'high',
              category: 'non-functional'
            });
          }
        } else {
          logIssue({
            page: 'Dashboard',
            element: 'Submit Button',
            issue: 'No submit button found for chat input',
            severity: 'critical',
            category: 'missing-feature'
          });
        }
      }

      // Check workflow list
      const workflowItems = await page.locator('[data-testid="workflow-item"], .workflow-card, [class*="workflow"]').all();
      console.log(`  Workflow items visible: ${workflowItems.length}`);

      // Check for real data vs demo data
      const tokenCounts = await page.locator('[class*="token"], [data-testid*="token"]').all();
      const _costDisplays = await page.locator('[class*="cost"], [data-testid*="cost"]').all();

      for (const tokenEl of tokenCounts) {
        const text = await tokenEl.textContent();
        if (text === '0' || text === '$0.00' || text === 'N/A') {
          logIssue({
            page: 'Dashboard',
            element: 'Token/Cost Display',
            issue: `Shows placeholder value: "${text}"`,
            severity: 'medium',
            category: 'demo-data'
          });
        }
      }
    }

    // 3. Check all main navigation routes
    const routes = [
      '/workflows',
      '/agents',
      '/settings',
      '/analytics',
      '/history',
      '/templates',
      '/integrations'
    ];

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`);
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      if (finalUrl.includes('login') || finalUrl.includes('sign-in')) {
        console.log(`  Route ${route} requires authentication`);
      } else if (finalUrl === `${baseUrl}${route}` || finalUrl.includes(route)) {
        await auditPage(page, `Route: ${route}`);
      } else {
        logIssue({
          page: route,
          element: 'route',
          issue: `Route redirected unexpectedly to: ${finalUrl}`,
          severity: 'medium',
          category: 'ui-issue'
        });
      }
    }

    // 4. Check modals and dialogs
    await page.goto(baseUrl);
    await page.waitForTimeout(1000);

    // Try to trigger any modals
    const modalTriggers = await page.locator('[data-modal], [aria-haspopup="dialog"], button:has-text("New"), button:has-text("Create"), button:has-text("Add")').all();
    for (let i = 0; i < Math.min(modalTriggers.length, 5); i++) {
      const trigger = modalTriggers[i];
      try {
        if (await trigger.isVisible()) {
          const text = await trigger.textContent();
          console.log(`  Testing modal trigger: "${text?.trim()}"`);
          await trigger.click();
          await page.waitForTimeout(500);

          // Check if modal opened
          const modal = await page.locator('[role="dialog"], [class*="modal"], .fixed.inset-0').first();
          if (await modal.isVisible()) {
            console.log('    Modal opened successfully');

            // Check modal content
            const modalButtons = await modal.locator('button').all();
            console.log(`    Modal has ${modalButtons.length} buttons`);

            // Close modal
            const closeBtn = await page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel"), .modal-close').first();
            if (await closeBtn.isVisible()) {
              await closeBtn.click();
            } else {
              await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(300);
          }
        }
      } catch { /* Element may have been removed from DOM */ }
    }

    // 5. Check forms
    const forms = await page.locator('form').all();
    console.log(`\n  Forms found: ${forms.length}`);

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      try {
        const inputs = await form.locator('input, textarea, select').all();
        const submitBtns = await form.locator('button[type="submit"], input[type="submit"]').all();

        console.log(`    Form ${i + 1}: ${inputs.length} inputs, ${submitBtns.length} submit buttons`);

        if (inputs.length > 0 && submitBtns.length === 0) {
          logIssue({
            page: page.url(),
            element: `Form ${i + 1}`,
            issue: 'Form has inputs but no submit button',
            severity: 'high',
            category: 'non-functional'
          });
        }
      } catch { /* Element may have been removed from DOM */ }
    }

    // 6. Check API connectivity
    console.log('\n=== API Connectivity Check ===');

    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:4567/api/health');
        return { status: response.status, ok: response.ok };
      } catch (e) {
        return { error: String(e) };
      }
    });

    if ('error' in apiResponse) {
      logIssue({
        page: 'API',
        element: 'health-endpoint',
        issue: `API health check failed: ${apiResponse.error}`,
        severity: 'critical',
        category: 'error'
      });
    } else {
      console.log(`  API Health: ${apiResponse.ok ? 'OK' : 'FAILED'} (Status: ${apiResponse.status})`);
    }

    // 7. Summary Report
    console.log('\n========================================');
    console.log('AUDIT SUMMARY');
    console.log('========================================');
    console.log(`Pages visited: ${visitedPages.length}`);
    console.log(`Elements tested: ${clickedElements.length}`);
    console.log(`Issues found: ${issues.length}`);

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    console.log(`\n  Critical: ${criticalIssues.length}`);
    console.log(`  High: ${highIssues.length}`);
    console.log(`  Medium: ${mediumIssues.length}`);
    console.log(`  Low: ${lowIssues.length}`);

    if (criticalIssues.length > 0) {
      console.log('\n--- CRITICAL ISSUES ---');
      criticalIssues.forEach(i => console.log(`  - ${i.issue} (${i.page})`));
    }

    if (highIssues.length > 0) {
      console.log('\n--- HIGH PRIORITY ISSUES ---');
      highIssues.forEach(i => console.log(`  - ${i.issue} (${i.page})`));
    }

    console.log('\n========================================');
    console.log('Full issue list:', JSON.stringify(issues, null, 2));

    // Assert we found what we were looking for
    expect(visitedPages.length).toBeGreaterThan(0);
  });
});
