/**
 * Marathon Execution Test - Full E2E with actual node execution
 *
 * Requirements:
 * - Dev server running on localhost:5173
 * - Backend running on localhost:4567
 * - Proxy running on localhost:4568
 * - Composio connections active (Gmail, Sheets, Slack, etc.)
 *
 * Usage: npx playwright test tests/marathon-execution-test.js --headed
 * Or:    node tests/marathon-execution-test.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 120000; // 2 min for slow operations

// Test scenarios using ONLY integrations we have connected:
// Gmail, Google Sheets, Slack, Discord, Notion, GitHub, Dropbox, Google Drive, Google Calendar, ClickUp, FreshBooks
const TEST_SCENARIOS = [
  {
    id: 'T26',
    name: 'Banker: Wire Transfer Compliance',
    prompt: 'wire transfers take forever to get approved and compliance keeps sending things back because the documentation is always wrong',
    expectedIntegrations: ['gmail', 'googlesheets'],
  },
  {
    id: 'T27',
    name: 'Banker: Suspicious Transaction Alerts',
    prompt: 'we keep missing suspicious transactions because nobody reviews the alerts fast enough',
    expectedIntegrations: ['gmail', 'slack'],
  },
  {
    id: 'T28',
    name: 'Banker: Monthly Reporting',
    prompt: 'every month end i spend 2 days pulling data from different systems to create the board report and its always late',
    expectedIntegrations: ['gmail', 'googlesheets'],
  },
  {
    id: 'T29',
    name: 'Banker: Client Onboarding',
    prompt: 'new client onboarding takes weeks because documents keep getting lost between departments',
    expectedIntegrations: ['gmail', 'googlesheets', 'slack'],
  },
  {
    id: 'T30',
    name: 'Professor: Student Grade Notifications',
    prompt: 'i forget to notify students when their grades are posted and they keep emailing me asking about it',
    expectedIntegrations: ['gmail', 'googlesheets'],
  },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForResponse(page, maxWait = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const thinking = await page.$('text=Nexus is thinking...');
    if (!thinking) {
      // Check if there's new content
      const messages = await page.$$('[class*="message"], [class*="Message"]');
      if (messages.length > 0) return true;
    }
    await sleep(2000);
  }
  return false;
}

async function runTest(browser, scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STARTING ${scenario.id}: ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: undefined, // Fresh context
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    consoleLogs.push(`[${msg.type()}] ${msg.text().substring(0, 200)}`);
  });

  try {
    // 1. Navigate to chat
    console.log('[1] Navigating to chat...');
    await page.goto(`${BASE_URL}/chat`, { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await sleep(3000);

    // 2. Click "New Chat" if old chat is loaded
    const newChatBtn = await page.$('button:has-text("New Chat")');
    if (newChatBtn) {
      await newChatBtn.click();
      await sleep(1000);
    }

    // 3. Type and send prompt
    console.log(`[2] Sending prompt: "${scenario.prompt.substring(0, 60)}..."`);
    const input = await page.waitForSelector('textarea, input[type="text"], [role="textbox"]', { timeout: 10000 });
    await input.fill(scenario.prompt);
    await input.press('Enter');

    // 4. Wait for AI response
    console.log('[3] Waiting for AI response...');
    await sleep(5000); // Initial wait for SSE

    // Wait up to 60 seconds for response
    let responseReceived = false;
    for (let i = 0; i < 30; i++) {
      const thinkingEl = await page.$('text=Nexus is thinking...');
      if (!thinkingEl) {
        responseReceived = true;
        break;
      }
      await sleep(2000);
      if (i % 5 === 0) console.log(`  Still waiting... (${i * 2}s)`);
    }

    if (!responseReceived) {
      console.log(`[FAIL] ${scenario.id}: Response timeout after 60s`);
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-timeout.png`, fullPage: true });
      return { id: scenario.id, status: 'FAIL', reason: 'Response timeout' };
    }

    console.log('[4] Response received! Checking for clarifying questions...');
    await sleep(2000);

    // 5. Handle clarifying questions (up to 4 rounds)
    for (let round = 0; round < 4; round++) {
      // Look for button options
      const buttons = await page.$$('button');
      let clarifyButtons = [];

      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        const isVisible = await btn.isVisible().catch(() => false);
        // Filter for clarifying question buttons (not navigation/UI buttons)
        if (isVisible && text &&
            !text.match(/^(New Chat|Dashboard|Settings|Copy|Send|ENG|عربي|Think with me|Templates|Connected Apps|WhatsApp|AI Consultancy|Create Workflow|Close|Upgrade|Active|Completed|Failed|Start voice|Dismiss|Chat|My Workflows|Open full|Beta Test|Production|Edit Workflow|Run Beta|Next|Custom\.\.\.)$/i) &&
            text.length > 3 && text.length < 100) {
          clarifyButtons.push({ element: btn, text: text.trim() });
        }
      }

      if (clarifyButtons.length > 0) {
        // Pick the first non-Custom option
        const choice = clarifyButtons.find(b => !b.text.includes('Custom')) || clarifyButtons[0];
        console.log(`[Q${round + 1}] Clicking: "${choice.text}"`);
        await choice.element.click();
        await sleep(8000); // Wait for next response

        // Check if still thinking
        for (let i = 0; i < 20; i++) {
          const thinking = await page.$('text=Nexus is thinking...');
          if (!thinking) break;
          await sleep(2000);
        }
      } else {
        // No clarifying buttons found - might be workflow card
        console.log(`[Q${round + 1}] No clarifying buttons found - checking for workflow card...`);
        break;
      }
    }

    await sleep(3000);

    // 6. Look for workflow card
    const workflowCard = await page.$('[class*="workflow"], [class*="Workflow"]');
    const betaTestBtn = await page.$('button:has-text("Beta Test"), button:has-text("Run Beta Test")');

    if (!betaTestBtn) {
      console.log(`[INFO] Looking for workflow card indicators...`);
      const pageContent = await page.textContent('body');
      const hasSteps = pageContent.includes('step') || pageContent.includes('Step');
      const hasConfidence = pageContent.includes('Confidence');

      if (hasSteps || hasConfidence) {
        console.log('[5] Workflow card detected! Looking for Quick Setup...');
      } else {
        console.log(`[PARTIAL] ${scenario.id}: No workflow card generated after clarifying questions`);
        await page.screenshot({ path: `${scenario.id.toLowerCase()}-no-workflow.png`, fullPage: true });
        return { id: scenario.id, status: 'PARTIAL', reason: 'No workflow card after clarifying' };
      }
    }

    // 7. Handle Quick Setup questions
    console.log('[6] Handling Quick Setup questions...');
    for (let qs = 0; qs < 10; qs++) {
      const nextBtn = await page.$('button:has-text("Next"):not([disabled])');
      const inputField = await page.$('input[type="text"]:not([disabled]), textarea:not([disabled])');

      if (nextBtn && inputField) {
        const placeholder = await inputField.getAttribute('placeholder') || '';
        const label = placeholder || 'test-value';

        // Smart defaults based on field type
        let value = 'Test Value';
        if (label.toLowerCase().includes('email') || label.toLowerCase().includes('to')) {
          value = 'md.fifty50@gmail.com';
        } else if (label.toLowerCase().includes('channel')) {
          value = '#general';
        } else if (label.toLowerCase().includes('phone') || label.toLowerCase().includes('number')) {
          value = '+96590044104';
        } else if (label.toLowerCase().includes('spreadsheet') || label.toLowerCase().includes('sheet')) {
          value = 'Marathon Test Sheet';
        } else if (label.toLowerCase().includes('name')) {
          value = `${scenario.id} Test`;
        } else if (label.toLowerCase().includes('message') || label.toLowerCase().includes('text')) {
          value = 'Marathon test message - automated testing';
        }

        console.log(`  Quick Setup: "${label}" → "${value}"`);
        await inputField.fill(value);
        await sleep(500);
        await nextBtn.click();
        await sleep(1500);
      } else if (!nextBtn) {
        console.log('  Quick Setup complete (no more Next buttons)');
        break;
      }
    }

    await sleep(2000);

    // 8. Click "Run Beta Test"
    console.log('[7] Looking for Run Beta Test button...');
    const runBetaBtn = await page.$('button:has-text("Run Beta Test"):not([disabled])');

    if (!runBetaBtn) {
      console.log('[INFO] Run Beta Test button not found or disabled. Taking screenshot...');
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-no-beta-btn.png`, fullPage: true });
      return { id: scenario.id, status: 'PARTIAL', reason: 'Run Beta Test button not available' };
    }

    console.log('[8] Clicking Run Beta Test...');
    await runBetaBtn.click();
    await sleep(5000);

    // 9. Check for OAuth gates
    const connectBtn = await page.$('button:has-text("Connect")');
    if (connectBtn) {
      console.log('[9] OAuth gate detected - checking which integrations need connection...');
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-oauth-gate.png`, fullPage: true });

      // Try clicking Connect for each needed integration
      const connectButtons = await page.$$('button:has-text("Connect")');
      for (const btn of connectButtons) {
        const parentText = await btn.evaluate(el => el.closest('[class*="integration"], [class*="connection"], div')?.textContent || '');
        console.log(`  OAuth needed: ${parentText.substring(0, 50)}`);
      }
    }

    // 10. Watch execution
    console.log('[10] Monitoring execution...');
    let executionComplete = false;
    const executionStart = Date.now();
    const maxExecutionWait = 120000; // 2 min

    while (Date.now() - executionStart < maxExecutionWait) {
      // Check for node statuses
      const pageText = await page.textContent('body');

      // Check for success indicators
      if (pageText.includes('completed') || pageText.includes('Completed') ||
          pageText.includes('success') || pageText.includes('✓')) {
        // Count completed vs total nodes
        const completedNodes = (pageText.match(/success|completed|✓/gi) || []).length;
        console.log(`  Execution progress: ~${completedNodes} nodes completed`);
      }

      // Check for error indicators
      if (pageText.includes('error') || pageText.includes('Error') || pageText.includes('failed')) {
        console.log('  Execution error detected');
        await page.screenshot({ path: `${scenario.id.toLowerCase()}-execution-error.png`, fullPage: true });
      }

      // Check if all nodes are done (green)
      const allDone = await page.$$('[class*="success"], [class*="completed"], [class*="green"]');
      const anyRunning = await page.$('[class*="running"], [class*="pending"], [class*="executing"]');

      if (allDone.length > 0 && !anyRunning) {
        executionComplete = true;
        console.log(`  All ${allDone.length} nodes completed!`);
        break;
      }

      await sleep(3000);
    }

    // 11. Final screenshot
    await page.screenshot({ path: `${scenario.id.toLowerCase()}-final.png`, fullPage: true });

    if (executionComplete) {
      console.log(`[PASS] ${scenario.id}: All nodes executed successfully!`);
      return { id: scenario.id, status: 'PASS', reason: 'Full execution completed' };
    } else {
      console.log(`[PARTIAL] ${scenario.id}: Execution did not complete within timeout`);
      return { id: scenario.id, status: 'PARTIAL', reason: 'Execution timeout or incomplete' };
    }

  } catch (error) {
    console.log(`[FAIL] ${scenario.id}: ${error.message}`);
    await page.screenshot({ path: `${scenario.id.toLowerCase()}-error.png`, fullPage: true }).catch(() => {});
    return { id: scenario.id, status: 'FAIL', reason: error.message };
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('Marathon Execution Test Suite');
  console.log('Starting at:', new Date().toLocaleString());
  console.log(`Running ${TEST_SCENARIOS.length} test scenarios\n`);

  const browser = await chromium.launch({
    headless: false, // Visible browser for monitoring
    slowMo: 500, // Slow down for readability
  });

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    const result = await runTest(browser, scenario);
    results.push(result);

    console.log(`\nResult: ${result.id} = ${result.status} (${result.reason})`);
    console.log('-'.repeat(60));

    // Brief pause between tests
    await sleep(3000);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MARATHON TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${icon} ${r.id}: ${r.status} — ${r.reason}`);
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  console.log(`\nTotal: ${passed}/${total} PASSED`);

  await browser.close();
}

main().catch(console.error);
