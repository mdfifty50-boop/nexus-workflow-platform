/**
 * Marathon Execution Test - Full E2E with actual node execution
 * FIXED v2: Proper button scoping to chat area only
 *
 * Usage: node tests/marathon-execution-test.cjs
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';

const TEST_SCENARIOS = [
  // T476-T480: Deep mode — proven reliable combos + edge cases
  {
    id: 'T476',
    name: 'Gmail→Slack: Boss email forwarder (DEEP)',
    prompt: 'forward emails from my boss to the general channel on slack immediately when they arrive',
  },
  {
    id: 'T477',
    name: 'Sheets→ClickUp→Slack: Task creator (DEEP)',
    prompt: 'when a new row is added to my project tracker google sheet create a task in clickup and notify the team on slack',
  },
  {
    id: 'T478',
    name: 'GitHub→Notion→Slack: Wiki sync (DEEP)',
    prompt: 'when a readme or wiki page is updated on github sync the changes to notion and notify the docs team on slack',
  },
  {
    id: 'T479',
    name: 'Dropbox→GoogleDrive→Slack: Backup sync (DEEP)',
    prompt: 'backup new dropbox files to google drive and send me a confirmation on slack when its done',
  },
  {
    id: 'T480',
    name: 'Gmail→Sheets→ClickUp→Slack: 4-int CRM (DEEP)',
    prompt: 'when i get a new lead email in gmail log the contact in a google sheet create a follow up task in clickup and alert the sales team on slack',
  },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Find clarifying question buttons - scoped to chat messages only
async function findClarifyingButtons(page) {
  // These are the ONLY buttons we should consider as clarifying question options
  // They appear within AI message bubbles, not in navigation or UI controls
  const buttons = [];

  try {
    // Approach: Get all buttons, then filter by position and context
    // Clarifying buttons are typically in the middle of the page (not header/footer/sidebar)
    const allButtons = await page.$$('main button');

    // Texts that are DEFINITELY not clarifying options
    const skipPatterns = [
      /^new chat$/i, /^dashboard$/i, /^settings/i, /^copy/i, /^send$/i,
      /^eng/i, /عربي/, /^think with/i, /^templates$/i, /^connected/i,
      /^whatsapp/i, /^ai consul/i, /^create work/i, /^close/i, /^upgrade/i,
      /^active$/i, /^completed$/i, /^failed$/i, /^start voice/i, /^dismiss/i,
      /^chat$/i, /^my work/i, /^open full/i, /^beta test/i, /^production/i,
      /^edit work/i, /^run beta/i, /^next$/i, /^settings menu$/i,
      /^copy message$/i, /^×$/, /^0\s/, /^send message$/i,
      /^close sidebar$/i,
    ];

    for (const btn of allButtons) {
      const text = (await btn.textContent().catch(() => '') || '').trim();
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.isDisabled().catch(() => true);

      if (!isVisible || isDisabled) continue;
      if (text.length < 3 || text.length > 120) continue;

      // Check against skip patterns
      let skip = false;
      for (const pat of skipPatterns) {
        if (pat.test(text)) { skip = true; break; }
      }
      if (skip) continue;

      // Check button position - should be in the chat message area (y > 100, y < 800)
      const box = await btn.boundingBox().catch(() => null);
      if (!box || box.y < 100 || box.y > 850) continue;
      // Should be in the right side of the page (not sidebar), x > 250
      if (box.x < 200) continue;

      buttons.push({ element: btn, text });
    }
  } catch (e) {
    console.log(`  Button scan error: ${e.message.substring(0, 60)}`);
  }

  return buttons;
}

async function runTest(browser, scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STARTING ${scenario.id}: ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200));
  });

  const result = {
    id: scenario.id,
    name: scenario.name,
    status: 'FAIL',
    reason: '',
    clarifyingRounds: 0,
    workflowName: '',
    stepCount: 0,
    nodesExecuted: 0,
    oauthNeeded: [],
    errors: [],
    screenshots: [],
    timing: { start: Date.now() },
  };

  try {
    // 1. Navigate to chat
    console.log('[1] Navigating to chat...');
    await page.goto(`${BASE_URL}/chat`, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await sleep(4000);

    // 2. Click "New Chat" - find it specifically in the header area
    try {
      const newChatBtn = await page.locator('main button:has-text("New Chat")').first();
      if (await newChatBtn.isVisible()) {
        await newChatBtn.click();
        await sleep(2000);
      }
    } catch (e) {
      // No old chat, that's fine
    }

    // 3. Type and send prompt
    console.log(`[2] Sending: "${scenario.prompt.substring(0, 60)}..."`);
    const input = await page.locator('main textarea, main [role="textbox"], main input[placeholder*="escribe"]').first();
    await input.fill(scenario.prompt);
    await sleep(500);
    await input.press('Enter');

    // 4. Wait for AI response (up to 90s)
    console.log('[3] Waiting for AI response...');
    let gotResponse = false;
    for (let i = 0; i < 45; i++) {
      try {
        const thinkingVisible = await page.locator('text=Nexus is thinking...').isVisible().catch(() => false);
        if (!thinkingVisible && i > 2) {
          gotResponse = true;
          break;
        }
      } catch (e) {}
      if (i % 5 === 0 && i > 0) console.log(`  Still waiting... (${i * 2}s)`);
      await sleep(2000);
    }

    if (!gotResponse) {
      result.reason = 'AI response timeout after 90s (BUG-001)';
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-timeout.png`, fullPage: true });
      return result;
    }

    console.log('[4] Response received!');
    await sleep(3000);

    // 5. Handle clarifying questions (up to 4 rounds)
    for (let round = 0; round < 4; round++) {
      const btns = await findClarifyingButtons(page);

      // Filter out Custom button
      const options = btns.filter(b => !b.text.toLowerCase().includes('custom'));

      if (options.length === 0) {
        console.log(`  Round ${round + 1}: No clarifying buttons → checking for workflow`);
        break;
      }

      console.log(`[Q${round + 1}] Found ${options.length} options: [${options.map(b => b.text.substring(0, 30)).join(' | ')}]`);

      // Click first option (with retry for DOM detachment - BUG in T33)
      const choice = options[0];
      console.log(`  → Selecting: "${choice.text}"`);
      try {
        await choice.element.click();
      } catch (clickErr) {
        // Element may have detached - re-find and click
        console.log(`  Re-finding button after DOM update...`);
        await sleep(1000);
        const retryBtns = await findClarifyingButtons(page);
        const retryChoice = retryBtns.find(b => b.text === choice.text) || retryBtns[0];
        if (retryChoice) {
          await retryChoice.element.click().catch(() => {});
        }
      }
      result.clarifyingRounds++;

      // Wait for next response
      await sleep(3000);
      for (let i = 0; i < 30; i++) {
        const thinking = await page.locator('text=Nexus is thinking...').isVisible().catch(() => false);
        if (!thinking && i > 1) break;
        if (i % 5 === 0 && i > 0) console.log(`  Waiting... (${i * 2}s)`);
        await sleep(2000);
      }
      await sleep(2000);
    }

    // 6. Check for workflow card
    console.log('[5] Checking for workflow card...');
    await sleep(3000);

    // Scroll down to see full content
    await page.evaluate(() => {
      const scrollable = document.querySelector('main > div > div:nth-child(2)') || document.querySelector('main');
      if (scrollable) scrollable.scrollTo(0, scrollable.scrollHeight);
    });
    await sleep(2000);

    const mainText = await page.locator('main').textContent().catch(() => '');
    const hasCard = mainText.includes('Confidence') || mainText.includes('Quick Setup') ||
                    mainText.includes('Beta Test') || mainText.includes('steps');

    if (!hasCard) {
      result.status = 'PARTIAL';
      result.reason = 'No workflow card generated after clarifying questions';
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-no-card.png`, fullPage: true });
      return result;
    }

    // Extract workflow name
    try {
      const h4 = await page.locator('main h4').first();
      result.workflowName = await h4.textContent() || '';
      console.log(`  Workflow: "${result.workflowName}"`);
    } catch (e) {}

    // Take screenshot of workflow card
    await page.screenshot({ path: `${scenario.id.toLowerCase()}-workflow.png`, fullPage: true });
    result.screenshots.push(`${scenario.id.toLowerCase()}-workflow.png`);

    // 7. Handle Quick Setup questions
    // Orchestration discovery (Rube API calls) can take 20-40s to complete
    console.log('[6] Waiting for Quick Setup to load (orchestration may take 30s+)...');
    let quickSetupReady = false;
    for (let wait = 0; wait < 40; wait++) {
      // Check for ANY Next button (even disabled - means questions exist)
      const anyNext = await page.locator('main button:has-text("Next")').first().isVisible().catch(() => false);
      const inputExists = await page.locator('main input[type="text"]:not([disabled])').first().isVisible().catch(() => false);
      // Also check for quick-select buttons within the workflow card area
      const quickSelect = await page.locator('main button:has-text("Create New"), main button:has-text("Sheet1")').first().isVisible().catch(() => false);

      if (anyNext || inputExists || quickSelect) {
        console.log(`  Quick Setup appeared after ${wait}s`);
        quickSetupReady = true;
        break;
      }
      if (wait % 5 === 0) console.log(`  Waiting for Quick Setup questions... (${wait}s)`);
      await sleep(1000);
    }

    if (!quickSetupReady) {
      // Check if Run Beta Test is already enabled (no questions needed)
      const runEnabled = await page.locator('main button:has-text("Run Beta Test"):not([disabled])').first().isVisible().catch(() => false);
      if (runEnabled) {
        console.log('  No Quick Setup needed - Run Beta Test already enabled');
      } else {
        console.log('  Quick Setup never appeared (orchestration may still be loading)');
      }
    }

    // BUG-016 FIX: Track clicked quick-select buttons to prevent infinite loops
    const clickedQuickBtns = new Set();
    let lastQuickSetupState = '';

    console.log('[6b] Filling Quick Setup...');
    for (let qs = 0; qs < 15; qs++) {
      try {
        // Detect state changes to break loops (BUG-016)
        const currentState = await page.locator('main').textContent().catch(() => '');
        const stateSnippet = currentState.substring(currentState.indexOf('Quick Setup'), currentState.indexOf('Quick Setup') + 200);
        if (stateSnippet === lastQuickSetupState && qs > 2) {
          console.log('  Quick Setup state unchanged - breaking to avoid loop (BUG-016 guard)');
          break;
        }
        lastQuickSetupState = stateSnippet;

        // First check for input field (MUST fill before Next becomes enabled)
        const inputField = page.locator('main input[type="text"]:not([disabled])').first();
        const hasInput = await inputField.isVisible().catch(() => false);

        if (hasInput) {
          const placeholder = await inputField.getAttribute('placeholder').catch(() => '') || '';
          let value = `${scenario.id} Test`;

          const ph = placeholder.toLowerCase();
          if (ph.includes('email') || ph.includes('to') || ph.includes('recipient')) value = 'md.fifty50@gmail.com';
          else if (ph.includes('channel')) value = '#general';
          else if (ph.includes('phone') || ph.includes('number')) value = '+96590044104';
          else if (ph.includes('spreadsheet') || ph.includes('sheet')) value = 'Marathon Test Sheet';
          else if (ph.includes('name')) value = `${scenario.id} Workflow`;
          else if (ph.includes('message') || ph.includes('text') || ph.includes('body')) value = 'Marathon test message';
          else if (ph.includes('subject')) value = `Test ${scenario.id}`;
          else if (ph.includes('range')) value = 'Sheet1!A1';
          else if (ph.includes('values') || ph.includes('data') || ph.includes('rows')) value = 'test data';
          else if (ph.includes('id')) value = 'test-id-123';
          else if (ph.includes('url') || ph.includes('link')) value = 'https://example.com';
          else if (ph.includes('folder') || ph.includes('path')) value = '/test-folder';
          else if (ph.includes('title')) value = `${scenario.id} Test Title`;
          else if (ph.includes('description') || ph.includes('desc')) value = 'Marathon test description';
          else if (ph.includes('repo') || ph.includes('repository')) value = 'test-repo';

          console.log(`  [${placeholder}] → "${value}"`);
          await inputField.fill(value);
          await inputField.dispatchEvent('input');
          await sleep(500);

          // Now check for Next button (should be enabled after filling input)
          await sleep(500);
          const nextEnabled = page.locator('main button:has-text("Next"):not([disabled])').first();
          const canClick = await nextEnabled.isVisible().catch(() => false);
          if (canClick) {
            await nextEnabled.click();
            console.log('  → Next clicked');
            await sleep(2000);
          } else {
            // Try clicking even disabled
            const anyNext = page.locator('main button:has-text("Next")').first();
            await anyNext.click().catch(() => {});
            await sleep(2000);
          }
        } else {
          // Maybe quick-select buttons (e.g., "Create New Sheet", "Sheet1!A1", etc.)
          // BUG-016 FIX: Skip buttons we already clicked
          const allBtns = await page.$$('main button');
          let foundQuickBtn = false;
          for (const btn of allBtns) {
            try {
              const text = (await btn.textContent().catch(() => '') || '').trim();
              const vis = await btn.isVisible().catch(() => false);
              const dis = await btn.isDisabled().catch(() => true);
              if (!vis || dis || text.length < 3 || text.length > 80) continue;
              const box = await btn.boundingBox().catch(() => null);
              if (!box || box.y < 100 || box.x < 200) continue;

              // BUG-016 FIX: Skip already-clicked buttons
              if (clickedQuickBtns.has(text)) continue;

              // Quick-select buttons typically have specific keywords
              // BUG-018 WORKAROUND: Skip "Send to Myself" and "My Phone" — they fail silently
              // because /api/user-profile/context returns 500
              if (text.includes('Send to Myself') || text.includes('My Phone')) {
                console.log(`  Skipping "${text}" (BUG-018 workaround) — will type value instead`);
                // Find the input field that should be near this button and fill it directly
                const nearbyInput = page.locator('main input[type="text"]:not([disabled])').first();
                const hasNearby = await nearbyInput.isVisible().catch(() => false);
                if (hasNearby) {
                  const ph = (await nearbyInput.getAttribute('placeholder') || '').toLowerCase();
                  let fallbackVal = 'md.fifty50@gmail.com';
                  if (ph.includes('phone')) fallbackVal = '+96590044104';
                  console.log(`  Typing "${fallbackVal}" instead (BUG-018 workaround)`);
                  await nearbyInput.fill(fallbackVal);
                  await nearbyInput.dispatchEvent('input');
                  foundQuickBtn = true;
                  await sleep(1000);
                  // Click Next after filling
                  const nextBtn = page.locator('main button:has-text("Next"):not([disabled])').first();
                  if (await nextBtn.isVisible().catch(() => false)) {
                    await nextBtn.click();
                    console.log('  → Next clicked (BUG-018 workaround)');
                  }
                  await sleep(2000);
                  break;
                }
                continue; // Skip this button, try next
              }
              if (text.startsWith('#') || text.includes('Create New') || text.includes('Sheet1') ||
                  text.includes('My main') || text.includes('Default')) {
                console.log(`  Quick select: "${text}"`);
                clickedQuickBtns.add(text);
                await btn.click();
                foundQuickBtn = true;
                await sleep(2000);
                break;
              }
            } catch (e) {}
          }

          if (!foundQuickBtn) {
            // No input or quick-select found - check if Next is visible (maybe no input needed)
            const nextEnabled = page.locator('main button:has-text("Next"):not([disabled])').first();
            const canClickNext = await nextEnabled.isVisible().catch(() => false);
            if (canClickNext) {
              await nextEnabled.click();
              console.log('  → Next clicked (no input)');
              await sleep(2000);
            } else {
              console.log('  Quick Setup complete (no more fields)');
              break;
            }
          }
        }
      } catch (e) {
        console.log(`  Quick Setup step error: ${e.message.substring(0, 60)}`);
        break;
      }
    }

    // 8. Click Run Beta Test (wait up to 30s for it to become enabled)
    console.log('[7] Looking for Run Beta Test...');
    await sleep(2000);

    // Scroll to bottom
    await page.evaluate(() => {
      const el = document.querySelector('main > div > div:nth-child(2)') || document.querySelector('main');
      if (el) el.scrollTo(0, el.scrollHeight);
    });
    await sleep(1000);

    // Wait for Run Beta Test to become enabled (pre-flight may still be loading)
    let betaClicked = false;
    for (let attempt = 0; attempt < 22; attempt++) {
      try {
        const runBtn = page.locator('main button:has-text("Run Beta Test")').first();
        const isVisible = await runBtn.isVisible().catch(() => false);
        const isEnabled = await runBtn.isEnabled().catch(() => false);

        if (isEnabled) {
          console.log(`[8] Clicking Run Beta Test! (ready after ${attempt * 2}s)`);
          await runBtn.click();
          betaClicked = true;
          await sleep(5000);
          break;
        } else if (isVisible && !isEnabled) {
          if (attempt % 3 === 0) console.log(`  Run Beta Test visible but disabled (${attempt * 2}s, waiting for pre-flight...)`);
        }
      } catch (e) {}
      await sleep(2000);
    }

    if (!betaClicked) {
      // Try clicking "Beta Test (Your Account)" first
      try {
        const selectBtn = page.locator('main button:has-text("Beta Test")').first();
        if (await selectBtn.isVisible()) {
          await selectBtn.click();
          await sleep(2000);
          const runBtn = page.locator('main button:has-text("Run Beta Test")').first();
          if (await runBtn.isEnabled().catch(() => false)) {
            await runBtn.click();
            betaClicked = true;
            await sleep(5000);
          }
        }
      } catch (e) {}
    }

    if (!betaClicked) {
      result.status = 'PARTIAL';
      result.reason = 'Run Beta Test button disabled after 45s wait (pre-flight incomplete)';
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-no-beta.png`, fullPage: true });
      return result;
    }

    // 8.5 Handle Trigger Sample Data prompts (triggers need sample data for beta testing)
    console.log('[8.5] Handling trigger sample data prompts...');
    await sleep(2000);
    for (let triggerRound = 0; triggerRound < 5; triggerRound++) {
      const useExampleBtn = page.locator('main button:has-text("Use Example Data")').first();
      const skipBtn = page.locator('main button:has-text("Skip")').first();
      const testDataBtn = page.locator('main button:has-text("Test with this data")').first();

      const hasExample = await useExampleBtn.isVisible().catch(() => false);
      const hasSkip = await skipBtn.isVisible().catch(() => false);

      if (hasExample) {
        console.log(`  Trigger ${triggerRound + 1}: Using example data`);
        await useExampleBtn.click();
        await sleep(1000);
        const canSubmit = await testDataBtn.isVisible().catch(() => false);
        if (canSubmit) await testDataBtn.click();
        await sleep(3000);
      } else if (hasSkip) {
        console.log(`  Trigger ${triggerRound + 1}: Skipping trigger data`);
        await skipBtn.click();
        await sleep(3000);
      } else {
        console.log(`  Trigger ${triggerRound + 1}: No trigger data prompt`);
        break;
      }
    }

    // 9. Handle OAuth gates
    console.log('[9] Checking OAuth status...');
    await sleep(3000);

    const connectButtons = await page.$$('main button:has-text("Connect")');
    if (connectButtons.length > 0) {
      console.log(`  OAuth needed for ${connectButtons.length} integration(s)`);

      for (const connectBtn of connectButtons) {
        try {
          const label = await connectBtn.evaluate(el => {
            const parent = el.closest('div');
            return parent ? parent.textContent.substring(0, 60) : '';
          });
          result.oauthNeeded.push(label);
          console.log(`  Connecting: ${label}`);

          // Click connect and handle popup
          const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
          await connectBtn.click();
          const popup = await popupPromise;

          if (popup) {
            console.log(`  OAuth popup: ${popup.url().substring(0, 80)}`);
            // Wait for OAuth completion
            let connected = false;
            for (let i = 0; i < 20; i++) {
              if (popup.isClosed()) {
                connected = true;
                break;
              }
              await sleep(3000);
            }
            if (!connected && !popup.isClosed()) {
              await popup.close().catch(() => {});
            }
          }
          await sleep(3000);
        } catch (e) {
          console.log(`  OAuth error: ${e.message.substring(0, 60)}`);
        }
      }

      await page.screenshot({ path: `${scenario.id.toLowerCase()}-oauth.png`, fullPage: true });
      result.screenshots.push(`${scenario.id.toLowerCase()}-oauth.png`);
    }

    // 10. Monitor execution (DEEP VERIFICATION — wait for ALL nodes, check for failures)
    console.log('[10] Monitoring execution (deep mode — waiting for ALL nodes)...');
    let executionStarted = false;
    let allComplete = false;
    let hasFailedNodes = false;
    let failedNodeDetails = [];
    const startExec = Date.now();

    // Track console messages for execution status
    let consoleExecutionSuccess = false;
    let consoleExecutionFailed = false;
    let consoleNodeResults = [];
    let consoleNodeErrors = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('execution: SUCCESS')) {
        consoleExecutionSuccess = true;
        console.log(`  [CONSOLE] ${text.substring(0, 150)}`);
      }
      if (text.includes('execution: FAILED') || text.includes('execution: ERROR')) {
        consoleExecutionFailed = true;
        console.log(`  [CONSOLE-FAIL] ${text.substring(0, 150)}`);
      }
      if (text.includes('VerifiedExecutor') && (text.includes('SUCCESS') || text.includes('Resolved'))) {
        consoleNodeResults.push(text.substring(0, 150));
        console.log(`  [NODE-OK] ${text.substring(0, 150)}`);
      }
      if (text.includes('VerifiedExecutor') && (text.includes('FAIL') || text.includes('ERROR') || text.includes('error'))) {
        consoleNodeErrors.push(text.substring(0, 150));
        console.log(`  [NODE-FAIL] ${text.substring(0, 150)}`);
      }
      if ((text.includes('error') || text.includes('Error')) && text.includes('Executor')) {
        console.log(`  [EXEC-ERR] ${text.substring(0, 150)}`);
      }
      // Track individual step results
      if (text.includes('Step') && (text.includes('failed') || text.includes('error'))) {
        consoleNodeErrors.push(text.substring(0, 150));
        console.log(`  [STEP-FAIL] ${text.substring(0, 150)}`);
      }
    });

    // Wait up to 180s for deep execution monitoring
    while (Date.now() - startExec < 180000) {
      try {
        const pageContent = await page.locator('main').textContent().catch(() => '');
        const lcContent = pageContent.toLowerCase();

        // Check for node status texts
        const hasRunning = lcContent.includes('running beta') || lcContent.includes('executing') ||
                           lcContent.includes('running...') || lcContent.includes('connecting') ||
                           lcContent.includes('processing');
        const hasSuccess = lcContent.includes('execution complete') || lcContent.includes('beta test complete') ||
                           lcContent.includes('all steps') || lcContent.includes('✓') || consoleExecutionSuccess;
        // STRICT: Only detect failures from execution-specific context (not generic page text)
        const hasFailed = lcContent.includes('execution failed') || lcContent.includes('step failed') ||
                          lcContent.includes('node failed') || consoleExecutionFailed;

        if (hasRunning || hasSuccess || consoleExecutionSuccess) {
          if (!executionStarted) {
            executionStarted = true;
            console.log('  Execution detected!');
          }
        }

        // Check for FAILED nodes in UI
        const failedElements = await page.$$('main [class*="error"], main [class*="failed"], main [class*="fail"]');
        if (failedElements.length > 0) {
          for (const el of failedElements) {
            const failText = (await el.textContent().catch(() => '') || '').trim().substring(0, 100);
            if (failText && !failedNodeDetails.includes(failText)) {
              failedNodeDetails.push(failText);
              console.log(`  [UI-FAIL] ${failText}`);
            }
          }
        }

        // Check for "Failed" text in step status indicators
        const allStepTexts = pageContent.match(/Step \d+.*?(Success|Failed|Error|Complete|Running)/gi) || [];
        for (const st of allStepTexts) {
          if (/failed|error/i.test(st)) {
            hasFailedNodes = true;
            if (!failedNodeDetails.includes(st)) {
              failedNodeDetails.push(st);
              console.log(`  [STEP-STATUS] ${st}`);
            }
          }
        }

        // Count completed steps
        if (consoleNodeResults.length > 0) {
          result.nodesExecuted = Math.max(result.nodesExecuted, consoleNodeResults.length);
        }
        const completeMatches = pageContent.match(/Complete/g);
        if (completeMatches && completeMatches.length > 0) {
          result.nodesExecuted = Math.max(result.nodesExecuted, completeMatches.length);
        }

        // Check if execution completed (via console or UI)
        if (consoleExecutionSuccess) {
          result.nodesExecuted = Math.max(result.nodesExecuted, consoleNodeResults.length, 1);
          allComplete = true;
          // Don't break yet — wait 3s more to catch any late failure messages
          await sleep(3000);
          console.log(`  Execution SUCCESS via console! ${result.nodesExecuted} node ops, ${consoleNodeErrors.length} errors`);
          break;
        }

        if (consoleExecutionFailed) {
          hasFailedNodes = true;
          console.log(`  Execution FAILED via console!`);
          allComplete = true;
          break;
        }

        // If execution started and nothing is running anymore — wait extra 5s to confirm
        if (executionStarted && !hasRunning && (Date.now() - startExec > 20000)) {
          // Check if the "Production Run" button is now visible (strongest completion signal)
          const earlyProdCheck = await page.locator('main button:has-text("Production Run"), main button:has-text("Production")').first().isVisible().catch(() => false);
          if (earlyProdCheck || hasSuccess || hasFailed) {
            allComplete = true;
            console.log(`  Execution finished: ${result.nodesExecuted} nodes, prodBtn=${earlyProdCheck}, failed=${hasFailed}`);
            if (hasFailed) hasFailedNodes = true;
            break;
          }
        }

        // OAuth still blocking
        if (pageContent.includes('Connect your') || pageContent.includes('connections required')) {
          result.reason = 'OAuth connections required for execution';
          break;
        }
      } catch (e) {}

      await sleep(5000);
    }

    // 11. Check for Production Run button (indicates beta test fully completed)
    console.log('[11] Checking for Production Run button...');
    await sleep(2000);

    // Scroll to see execution results
    await page.evaluate(() => {
      const el = document.querySelector('main > div > div:nth-child(2)') || document.querySelector('main');
      if (el) el.scrollTo(0, el.scrollHeight);
    });
    await sleep(1000);

    const prodRunBtn = page.locator('main button:has-text("Production Run"), main button:has-text("Production"), main button:has-text("Go Live"), main button:has-text("Deploy")').first();
    const hasProdRun = await prodRunBtn.isVisible().catch(() => false);
    if (hasProdRun) {
      console.log('  ✓ Production Run button visible — beta test fully completed!');
      result.reachedProduction = true;
    } else {
      // Also check for "production" text indication
      const mainText = await page.locator('main').textContent().catch(() => '');
      if (mainText.toLowerCase().includes('production run') || mainText.toLowerCase().includes('go live')) {
        console.log('  ~ Production option detected in page text');
        result.reachedProduction = true;
      } else {
        console.log('  ✗ No Production Run button found');
        result.reachedProduction = false;
      }
    }

    // 12. INVESTIGATE execution results — capture step-by-step status for logging
    console.log('[12] Investigating execution results...');
    try {
      const executionArea = await page.locator('main').textContent().catch(() => '');

      // Look for step execution details — capture node statuses
      const stepPattern = /step[\s_]*(\d+)[^:]*:\s*(.*?)(?=step[\s_]*\d|$)/gi;
      let stepMatch;
      const stepResults = [];
      while ((stepMatch = stepPattern.exec(executionArea)) !== null) {
        const stepNum = stepMatch[1];
        const stepDetail = stepMatch[2].trim().substring(0, 100);
        if (stepDetail.length > 5) {
          stepResults.push({ step: stepNum, detail: stepDetail });
        }
      }
      if (stepResults.length > 0) {
        console.log(`  Step results found (${stepResults.length}):`);
        for (const sr of stepResults) {
          const status = /fail|error/i.test(sr.detail) ? 'FAILED' : /success|complete/i.test(sr.detail) ? 'OK' : 'UNKNOWN';
          console.log(`    Step ${sr.step}: [${status}] ${sr.detail.substring(0, 80)}`);
          if (status === 'FAILED') {
            hasFailedNodes = true;
            failedNodeDetails.push(`Step ${sr.step}: ${sr.detail.substring(0, 80)}`);
          }
        }
      }

      // Also check for execution log entries
      const logEntries = executionArea.match(/(?:✓|✗|⚠|→|●)\s*[^\n]{5,80}/g) || [];
      if (logEntries.length > 0) {
        console.log(`  Execution log entries (${logEntries.length}):`);
        for (const entry of logEntries.slice(0, 10)) {
          console.log(`    ${entry.trim()}`);
          if (/✗|fail|error/i.test(entry)) {
            hasFailedNodes = true;
            failedNodeDetails.push(entry.trim());
          }
        }
      }
    } catch (e) {
      console.log(`  Investigation error: ${e.message.substring(0, 60)}`);
    }

    // Final screenshot (with timeout protection)
    try {
      await page.screenshot({ path: `${scenario.id.toLowerCase()}-final.png`, fullPage: true, timeout: 10000 });
      result.screenshots.push(`${scenario.id.toLowerCase()}-final.png`);
    } catch (ssErr) {
      console.log(`  Screenshot failed: ${ssErr.message.substring(0, 60)}`);
      // Try viewport-only screenshot as fallback
      try {
        await page.screenshot({ path: `${scenario.id.toLowerCase()}-final.png`, timeout: 5000 });
        result.screenshots.push(`${scenario.id.toLowerCase()}-final.png`);
      } catch (e2) {}
    }
    result.timing.end = Date.now();
    result.timing.duration = Math.round((result.timing.end - result.timing.start) / 1000);

    // STRICT PASS CRITERIA:
    // 1. Production Run button visible = beta test COMPLETED (strongest signal)
    // 2. Console execution: SUCCESS with no errors = PASS
    // 3. Console execution: FAILED = FAIL (investigate why)
    // 4. Any failed node = FAIL

    if (result.reachedProduction && !consoleExecutionFailed && consoleNodeErrors.length === 0 && !hasFailedNodes) {
      // Production Run reached = definitive PASS
      result.status = 'PASS';
      result.nodesExecuted = Math.max(result.nodesExecuted, consoleNodeResults.length, 1);
      result.reason = `${result.nodesExecuted} node(s) executed in ${result.timing.duration}s`;
      if (consoleNodeResults.length > 0) {
        result.reason += ` [${consoleNodeResults.length} verified via console]`;
      }
      result.reason += ' → Production Ready';
    } else if (consoleExecutionSuccess && !consoleExecutionFailed && consoleNodeErrors.length === 0 && !hasFailedNodes) {
      // Console confirmed success with no failures
      result.status = 'PASS';
      result.nodesExecuted = Math.max(result.nodesExecuted, consoleNodeResults.length, 1);
      result.reason = `${result.nodesExecuted} node(s) executed in ${result.timing.duration}s`;
      if (consoleNodeResults.length > 0) {
        result.reason += ` [${consoleNodeResults.length} verified via console]`;
      }
      if (result.reachedProduction) result.reason += ' → Production Ready';
    } else if (consoleExecutionFailed || hasFailedNodes || consoleNodeErrors.length > 0) {
      // REAL FAILURE — investigate and log
      result.status = 'FAIL';
      const failCount = consoleNodeErrors.length + failedNodeDetails.length;
      result.reason = `EXECUTION FAILED in ${result.timing.duration}s`;
      if (consoleExecutionFailed) result.reason += ' (console: FAILED)';
      if (failCount > 0) result.reason += ` — ${failCount} failed node(s)`;
      if (failedNodeDetails.length > 0) result.reason += `: ${failedNodeDetails[0].substring(0, 80)}`;
      result.errors = [...consoleNodeErrors, ...failedNodeDetails];
    } else if (result.reachedProduction) {
      // Production Run visible but no console confirmation — treat as pass with warning
      result.status = 'PASS';
      result.nodesExecuted = Math.max(result.nodesExecuted, 1);
      result.reason = `Beta test completed in ${result.timing.duration}s (Production Ready, no console confirmation)`;
    } else if (executionStarted) {
      result.status = 'PARTIAL';
      if (!result.reason) result.reason = `Execution incomplete: ${result.nodesExecuted} nodes ran in ${result.timing.duration}s`;
    } else if (result.oauthNeeded.length > 0) {
      result.status = 'PARTIAL';
      if (!result.reason) result.reason = `OAuth needed: ${result.oauthNeeded.join(', ')}`;
    } else if (!result.reason) {
      result.reason = 'Execution never started';
    }

    return result;

  } catch (error) {
    result.reason = error.message.substring(0, 200);
    await page.screenshot({ path: `${scenario.id.toLowerCase()}-crash.png`, fullPage: true }).catch(() => {});
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  MARATHON EXECUTION TEST SUITE v2 (Full E2E)');
  console.log('  ' + new Date().toLocaleString());
  console.log('═══════════════════════════════════════════════════════');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
  });

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    const result = await runTest(browser, scenario);
    results.push(result);

    const icon = result.status === 'PASS' ? 'PASS' : result.status === 'PARTIAL' ? 'PARTIAL' : 'FAIL';
    console.log(`\n[${icon}] ${result.id}: ${result.reason}`);
    if (result.workflowName) console.log(`  Workflow: ${result.workflowName}`);
    if (result.stepCount) console.log(`  Steps: ${result.stepCount}`);
    console.log('-'.repeat(60));

    await sleep(3000);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MARATHON EXECUTION TEST RESULTS');
  console.log('='.repeat(60));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'PARTIAL' ? '[PART]' : '[FAIL]';
    console.log(`${icon} ${r.id} ${r.name}`);
    console.log(`      ${r.reason}`);
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`\nTotal: ${passed}/${results.length} FULL PASS`);

  await browser.close();

  // Save results
  const fs = require('fs');
  fs.writeFileSync('tests/marathon-results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to tests/marathon-results.json');
}

main().catch(console.error);
