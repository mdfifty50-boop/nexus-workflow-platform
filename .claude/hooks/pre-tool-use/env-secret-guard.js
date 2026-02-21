#!/usr/bin/env node
/**
 * Environment Secret Guard Hook (PreToolUse)
 * Blocks git add/commit of .env files and credential files.
 * Blocks Write/Edit to files containing API keys.
 * Exit 0 = allow, Exit 2 = block
 */
const path = require('path');

const SENSITIVE_PATTERNS = [
  /\.env$/,
  /\.env\.local$/,
  /\.env\.production$/,
  /\.env\.vercel/,
  /credentials\.json$/,
  /secrets?\.(json|yaml|yml)$/,
  /\.pem$/,
  /\.key$/,
  /service-account.*\.json$/,
];

const API_KEY_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /ANTHROPIC_API_KEY\s*=\s*["']?sk-/,
  /OPENAI_API_KEY\s*=\s*["']?sk-/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
];

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const data = JSON.parse(input);
  const toolName = data.tool_name;
  const toolInput = data.tool_input || {};

  // Check Bash commands for git add of sensitive files
  if (toolName === 'Bash') {
    const cmd = toolInput.command || '';
    if (cmd.includes('git add')) {
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(cmd)) {
          process.stderr.write(
            `BLOCKED: Attempting to git add a sensitive file matching ${pattern}. ` +
            `Add it to .gitignore instead.`
          );
          process.exit(2);
        }
      }
    }
    process.exit(0);
  }

  // Check Write/Edit for sensitive file paths
  if (['Write', 'Edit'].includes(toolName)) {
    const filePath = toolInput.file_path || '';

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(filePath)) {
        // Allow .env.example files
        if (/\.example$/.test(filePath)) process.exit(0);
        process.stderr.write(
          `WARNING: Modifying sensitive file: ${path.basename(filePath)}. ` +
          `Ensure no real credentials are committed to git.`
        );
        process.exit(0); // Warn but allow
      }
    }

    // Check content for hardcoded API keys
    const content = toolInput.content || toolInput.new_string || '';
    for (const pattern of API_KEY_PATTERNS) {
      if (pattern.test(content)) {
        process.stderr.write(
          `BLOCKED: Content appears to contain a hardcoded API key or private key. ` +
          `Use environment variables instead.`
        );
        process.exit(2);
      }
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(0); });
