#!/usr/bin/env node
/**
 * Protected File Guard Hook (PreToolUse)
 * Blocks Write (full overwrite) on protected files. Edit (targeted) is allowed.
 * Exit 0 = allow, Exit 2 = block
 */
const path = require('path');

const PROTECTED_FILES = [
  'WorkflowPreviewCard.tsx',
  'ChatContainer.tsx',
  'agents/index.ts',
  'RubeClient.ts',
  'CustomIntegrationService.ts',
  'ComposioService.ts',
  'WhatsAppBaileysService.ts',
  'whatsapp-web.ts',
  'rube.ts',
  'WhatsAppConnectionPrompt.tsx',
  'useWhatsAppWeb.ts',
];

async function main() {
  let input = '';
  try {
    input = require('fs').readFileSync(0, 'utf8');
  } catch (_) {
    process.exit(0);
  }

  const data = JSON.parse(input);

  if (data.tool_name !== 'Write') process.exit(0);

  const filePath = data.tool_input?.file_path || '';
  const fileName = path.basename(filePath);
  const relativePath = filePath.replace(/\\/g, '/');

  // Case-insensitive comparison for Windows filesystem compatibility
  const fileNameLower = fileName.toLowerCase();
  const relativePathLower = relativePath.toLowerCase();
  const isProtected = PROTECTED_FILES.some(pf => {
    const pfLower = pf.toLowerCase();
    return fileNameLower === pfLower || relativePathLower.endsWith(pfLower);
  });

  if (isProtected) {
    process.stderr.write(
      `BLOCKED: Cannot use Write (full overwrite) on protected file: ${fileName}. ` +
      `This file contains critical @NEXUS-FIX markers. ` +
      `Use the Edit tool with targeted old_string → new_string changes instead.`
    );
    process.exit(2);
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(0); });
