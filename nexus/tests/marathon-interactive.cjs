/**
 * Interactive Marathon Test - Keeps browser open for user visibility
 * Runs ONE test at a time with pauses for observation
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const prompt = process.argv[2] || 'save my latest gmail emails to a google sheet';
  const testId = process.argv[3] || 'T26';

  console.log(`\n[${testId}] Starting interactive test`);
  console.log(`Prompt: "${prompt}"\n`);

  // Launch browser - visible, not headed
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  // Track console
  let executionStarted = false;
  page.on('console', msg => {
    const text = msg.text();
    // After execution starts, capture ALL console messages
    if (executionStarted) {
      console.log(`[EXEC] ${text.substring(0, 300)}`);
      return;
    }
    if (text.includes('Pre-flight') || text.includes('isPreFlightComplete') ||
        text.includes('Quick Setup') || text.includes('questions') ||
        text.includes('FIX-202') || text.includes('connection') || text.includes('executing') ||
        text.includes('Executing') || text.includes('Starting workflow') ||
        text.includes('OAuth') || text.includes('connected') || text.includes('Rube') ||
        text.includes('node') || text.includes('status') || text.includes('error') ||
        text.includes('Error') || text.includes('success') || text.includes('phase')) {
      console.log(`[CONSOLE] ${text.substring(0, 300)}`);
    }
  });

  try {
    // Navigate
    console.log('[1] Navigating to chat...');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
    await sleep(4000);

    // New Chat
    try {
      await page.locator('main button:has-text("New Chat")').first().click();
      await sleep(2000);
    } catch (e) {}

    // Send prompt
    console.log('[2] Sending prompt...');
    const input = await page.locator('main textarea, main [role="textbox"]').first();
    await input.fill(prompt);
    await input.press('Enter');

    // Wait for response
    console.log('[3] Waiting for AI response...');
    for (let i = 0; i < 45; i++) {
      const thinking = await page.locator('text=Nexus is thinking...').isVisible().catch(() => false);
      if (!thinking && i > 3) {
        console.log(`[4] Response received after ${i * 2}s`);
        break;
      }
      if (i % 5 === 0) console.log(`  Waiting... (${i * 2}s)`);
      await sleep(2000);
    }

    await sleep(3000);

    // Auto-click clarifying questions
    for (let round = 0; round < 5; round++) {
      // Find buttons in the main chat area that look like clarifying options
      const allBtns = await page.$$('main button');
      const skipPats = [
        /^new chat$/i, /^dashboard$/i, /^settings/i, /^copy/i, /^send$/i,
        /^eng/i, /عربي/, /^think with/i, /^templates$/i, /^connected/i,
        /^whatsapp/i, /^ai consul/i, /^create work/i, /^close/i, /^upgrade/i,
        /^active$/i, /^completed$/i, /^failed$/i, /^start voice/i, /^dismiss/i,
        /^chat$/i, /^my work/i, /^open full/i, /^beta test/i, /^production/i,
        /^edit work/i, /^run beta/i, /^next$/i, /^settings menu$/i,
        /^copy message$/i, /^×$/, /^0\s/, /^send message$/i, /^close sidebar$/i,
        /custom/i, /^get deeper/i, /specialist/i,
      ];

      const options = [];
      for (const btn of allBtns) {
        try {
          const text = (await btn.textContent() || '').trim();
          const vis = await btn.isVisible();
          const dis = await btn.isDisabled();
          if (!vis || dis || text.length < 3 || text.length > 120) continue;
          let skip = false;
          for (const p of skipPats) { if (p.test(text)) { skip = true; break; } }
          if (skip) continue;
          const box = await btn.boundingBox();
          if (!box || box.y < 100 || box.y > 850 || box.x < 200) continue;
          options.push({ el: btn, text });
        } catch (e) {}
      }

      if (options.length === 0) {
        console.log(`  Round ${round + 1}: No clarifying options found`);
        break;
      }

      console.log(`[Q${round + 1}] Options: [${options.map(o => o.text.substring(0, 35)).join(' | ')}]`);
      const pick = options[0];
      console.log(`  → Selecting: "${pick.text}"`);
      await pick.el.click();

      // Wait for next response
      await sleep(4000);
      for (let i = 0; i < 25; i++) {
        const thinking = await page.locator('text=Nexus is thinking...').isVisible().catch(() => false);
        if (!thinking) break;
        if (i % 5 === 0) console.log(`  Waiting... (${i * 2}s)`);
        await sleep(2000);
      }
      await sleep(2000);
    }

    // Check for workflow card
    console.log('[5] Checking for workflow card...');
    await sleep(3000);
    await page.evaluate(() => {
      const el = document.querySelector('main > div > div:nth-child(2)') || document.querySelector('main');
      if (el) el.scrollTo(0, el.scrollHeight);
    });
    await sleep(2000);

    const mainText = await page.locator('main').textContent().catch(() => '');
    if (mainText.includes('Quick Setup') || mainText.includes('Confidence') || mainText.includes('Beta Test')) {
      console.log('[6] Workflow card found!');

      // Handle Quick Setup - IMPORTANT: Next button starts DISABLED until input is filled
      // Wait for Quick Setup questions to fully render (orchestration may still be loading)
      console.log('[7] Waiting for Quick Setup questions to appear...');
      for (let wait = 0; wait < 10; wait++) {
        const nextBtnExists = await page.locator('main button:has-text("Next")').first().isVisible().catch(() => false);
        const inputExists = await page.locator('main input[type="text"]:not([disabled])').first().isVisible().catch(() => false);
        if (nextBtnExists || inputExists) {
          console.log(`  Quick Setup appeared after ${wait}s`);
          break;
        }
        if (wait % 3 === 0) console.log(`  Waiting for Quick Setup... (${wait}s)`);
        await sleep(1000);
      }
      console.log('[7b] Filling Quick Setup...');
      for (let i = 0; i < 15; i++) {
        try {
          // First check if any Next button exists at all (even disabled)
          const anyNextBtn = page.locator('main button:has-text("Next")').first();
          const nextExists = await anyNextBtn.isVisible().catch(() => false);
          if (!nextExists) {
            console.log('  Quick Setup complete (no Next button found)');
            break;
          }

          // Find and fill input field FIRST (this enables the Next button)
          const inputEl = page.locator('main input[type="text"]:not([disabled])').first();
          const hasInput = await inputEl.isVisible().catch(() => false);

          if (hasInput) {
            const ph = (await inputEl.getAttribute('placeholder') || '').toLowerCase();
            let val = 'Test Value';
            if (ph.includes('email') || ph.includes('to') || ph.includes('recipient')) val = 'md.fifty50@gmail.com';
            else if (ph.includes('channel')) val = '#general';
            else if (ph.includes('phone')) val = '+96590044104';
            else if (ph.includes('sheet') || ph.includes('spread')) val = 'Marathon Test Sheet';
            else if (ph.includes('name')) val = `${testId} Workflow`;
            else if (ph.includes('message') || ph.includes('text') || ph.includes('body')) val = 'Marathon test message';
            else if (ph.includes('subject')) val = `Test ${testId}`;
            else if (ph.includes('range')) val = 'Sheet1!A1';
            else if (ph.includes('values') || ph.includes('data')) val = 'test data';
            else if (ph.includes('id')) val = 'test-id-123';

            console.log(`  [${ph || 'field'}] → "${val}"`);
            await inputEl.fill(val);
            await sleep(500);

            // Also try dispatching input event to trigger React state update
            await inputEl.dispatchEvent('input');
            await sleep(500);
          } else {
            // No input field but Next exists — check for quick select buttons
            console.log('  No input field found, checking for select buttons...');
            // Look for quick-select buttons within the Quick Setup area
            const allBtns = await page.$$('main button');
            let foundQuickBtn = false;
            for (const btn of allBtns) {
              const text = (await btn.textContent().catch(() => '') || '').trim();
              const box = await btn.boundingBox().catch(() => null);
              if (!box || box.y < 100 || box.x < 200) continue;
              if (text.startsWith('#') || text.includes('My ') || text.includes('Send to')) {
                console.log(`  Quick select: "${text}"`);
                await btn.click();
                foundQuickBtn = true;
                await sleep(1000);
                break;
              }
            }
            if (!foundQuickBtn) {
              console.log('  No quick select found, moving on');
              break;
            }
          }

          // Now wait for Next button to become enabled
          await sleep(1000);
          const nextEnabled = page.locator('main button:has-text("Next"):not([disabled])').first();
          const canClick = await nextEnabled.isVisible().catch(() => false);

          if (canClick) {
            await nextEnabled.click();
            console.log('  → Next clicked');
            await sleep(2000);
          } else {
            console.log('  Next still disabled after fill — trying click anyway');
            await anyNextBtn.click().catch(() => {});
            await sleep(2000);
          }
        } catch (e) {
          console.log(`  Quick Setup error: ${e.message.substring(0, 80)}`);
          break;
        }
      }

      // Check button state
      await sleep(3000);
      console.log('\n[8] Checking Run Beta Test button state...');

      const runBtn = page.locator('main button:has-text("Run Beta Test")').first();
      const isVisible = await runBtn.isVisible().catch(() => false);
      const isEnabled = await runBtn.isEnabled().catch(() => false);

      console.log(`  Button visible: ${isVisible}`);
      console.log(`  Button enabled: ${isEnabled}`);

      if (isEnabled) {
        console.log('[9] Clicking Run Beta Test!');
        executionStarted = true; // Start capturing ALL console output
        await runBtn.click();

        // Handle Trigger Sample Data prompts (triggers need sample data for beta testing)
        console.log('[10] Handling trigger sample data prompts...');
        await sleep(3000);
        for (let triggerRound = 0; triggerRound < 5; triggerRound++) {
          // Look for "Use Example Data" or "Skip" buttons in the trigger prompt
          const useExampleBtn = page.locator('main button:has-text("Use Example Data")').first();
          const skipBtn = page.locator('main button:has-text("Skip")').first();
          const testDataBtn = page.locator('main button:has-text("Test with this data")').first();

          const hasExample = await useExampleBtn.isVisible().catch(() => false);
          const hasSkip = await skipBtn.isVisible().catch(() => false);

          if (hasExample) {
            console.log(`  Trigger ${triggerRound + 1}: Clicking "Use Example Data"`);
            await useExampleBtn.click();
            await sleep(1000);
            // Now click "Test with this data" to submit
            const canSubmit = await testDataBtn.isVisible().catch(() => false);
            if (canSubmit) {
              await testDataBtn.click();
              console.log('  → Submitted example data');
            }
            await sleep(3000);
          } else if (hasSkip) {
            console.log(`  Trigger ${triggerRound + 1}: Clicking "Skip (Use Defaults)"`);
            await skipBtn.click();
            await sleep(3000);
          } else {
            console.log(`  Trigger ${triggerRound + 1}: No trigger data prompt found`);
            break;
          }
        }

        // Monitor execution with detailed progress tracking
        console.log('[11] Monitoring execution...');
        let lastNodeStatus = '';
        for (let i = 0; i < 40; i++) {
          await sleep(5000);
          const text = await page.locator('main').textContent().catch(() => '');

          // Check for various execution states
          const isExecuting = text.includes('Running beta test') || text.includes('Executing');
          const hasSuccess = text.includes('✓') || text.includes('success');
          const hasError = text.includes('Error') || text.includes('error') || text.includes('failed');
          const hasConnecting = text.includes('Connecting') || text.includes('connecting');
          const hasComplete = text.includes('complete') || text.includes('Completed');
          const hasOAuth = text.includes('Connect') && text.includes('OAuth');
          const hasNeedsAuth = text.includes('needs_auth') || text.includes('Need to connect');

          const nodeStatus = `exec=${isExecuting} succ=${hasSuccess} err=${hasError} conn=${hasConnecting} done=${hasComplete} oauth=${hasOAuth} auth=${hasNeedsAuth}`;

          if (nodeStatus !== lastNodeStatus || i % 4 === 0) {
            console.log(`  [${i * 5}s] ${nodeStatus}`);
            lastNodeStatus = nodeStatus;
          }

          // Check for execution log entries
          const logEntries = await page.$$eval('[class*="log"], [class*="Log"]', els => els.map(e => e.textContent?.substring(0, 100))).catch(() => []);
          if (logEntries.length > 0 && i % 3 === 0) {
            console.log(`  Logs: ${logEntries.slice(-3).join(' | ')}`);
          }

          // Take intermediate screenshots
          if (i === 5 || i === 15 || i === 30) {
            await page.screenshot({ path: `${testId.toLowerCase()}-exec-${i * 5}s.png`, fullPage: true });
            console.log(`  Screenshot: ${testId.toLowerCase()}-exec-${i * 5}s.png`);
          }

          // Check if execution is done
          if (hasComplete && !isExecuting) {
            console.log(`  EXECUTION COMPLETE at ${i * 5}s!`);
            break;
          }

          // Check if OAuth gate appeared
          if (hasOAuth || hasNeedsAuth) {
            console.log(`  OAuth gate detected! Checking for Connect buttons...`);
            // Try to click Connect buttons
            const connectBtns = await page.$$('main button:has-text("Connect")');
            for (const btn of connectBtns) {
              const btnText = (await btn.textContent().catch(() => '') || '').trim();
              if (btnText.includes('Connect') && !btnText.includes('Connected')) {
                console.log(`  Clicking: "${btnText}"`);
                await btn.click().catch(() => {});
                await sleep(3000);
              }
            }
          }
        }
      } else {
        console.log('  Button is DISABLED - investigating...');

        // Check the page state
        const hasQuickSetup = mainText.includes('Quick Setup');
        const hasPreFlight = mainText.includes('of ');
        console.log(`  Quick Setup visible: ${hasQuickSetup}`);
        console.log(`  Pre-flight indicator: ${hasPreFlight}`);
      }
    } else {
      console.log('  No workflow card found');
    }

    // Take final screenshot
    await page.screenshot({ path: `${testId.toLowerCase()}-interactive-final.png`, fullPage: true });
    console.log(`\nScreenshot: ${testId.toLowerCase()}-interactive-final.png`);

    // Keep browser open for 5 minutes for user to inspect
    console.log('\n>>> Browser will stay open for 5 minutes for inspection <<<');
    console.log('>>> Press Ctrl+C to close earlier <<<');
    await sleep(300000); // 5 minutes

  } catch (error) {
    console.log(`ERROR: ${error.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
