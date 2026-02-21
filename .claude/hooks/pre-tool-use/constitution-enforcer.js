#!/usr/bin/env node
/**
 * Constitution Enforcer Hook (PreToolUse)
 * Sampling-based code style enforcement.
 * Checks 100% of security patterns, 5% of general patterns.
 * Exit 0 = allow with warnings, Exit 2 = block on security violations
 */
const path = require('path');

const SECURITY_PATTERNS = [
  { pattern: /eval\s*\(/, message: 'eval() is forbidden - use safer alternatives' },
  { pattern: /innerHTML\s*=/, message: 'innerHTML assignment risks XSS - use textContent or React JSX' },
  { pattern: /dangerouslySetInnerHTML/, message: 'dangerouslySetInnerHTML requires sanitization - ensure DOMPurify is used' },
  { pattern: /document\.write/, message: 'document.write is forbidden' },
  { pattern: /\bexec\s*\(.*\+/, message: 'String concatenation in exec() risks injection - use parameterized queries' },
  { pattern: /password.*=.*['"][^'"]{3,}['"]/, message: 'Possible hardcoded password detected' },
];

const STYLE_PATTERNS = [
  {
    pattern: /: any\b/,
    message: 'Avoid `any` type - use proper TypeScript types',
    severity: 'warning',
    selfHeal: 'SELF-HEAL: Replace `any` with a specific type (e.g., `unknown`, `string`, or create an interface)',
  },
  {
    pattern: /\.forEach\s*\(\s*async/,
    message: 'forEach with async callback does not await - use for...of loop',
    severity: 'warning',
    selfHeal: 'SELF-HEAL: Replace `.forEach(async ...)` with `for...of` loop or `Promise.all(arr.map(...))`',
  },
  {
    pattern: /console\.log\(/,
    message: 'Remove console.log before commit - use proper logger',
    severity: 'info',
    selfHeal: 'SELF-HEAL: Replace `console.log` with `logger.info()` or `logger.debug()` from server/utils/logger',
  },
  {
    pattern: /\/\/ @ts-ignore/,
    message: '@ts-ignore suppresses TypeScript checking - fix the type instead',
    severity: 'warning',
    selfHeal: 'SELF-HEAL: Remove @ts-ignore and fix the underlying type error',
  },
  {
    pattern: /\/\/ @ts-expect-error/,
    message: '@ts-expect-error - consider fixing the underlying type',
    severity: 'info',
    selfHeal: 'SELF-HEAL: Remove @ts-expect-error and fix the underlying type error, or add a descriptive reason comment',
  },
];

const GENERAL_SAMPLE_RATE = 0.05; // 5%

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const data = JSON.parse(input);

  if (!['Edit', 'Write'].includes(data.tool_name)) process.exit(0);

  const content = data.tool_input?.content || data.tool_input?.new_string || '';
  const filePath = data.tool_input?.file_path || '';

  // Skip non-code files
  if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) process.exit(0);

  const violations = [];

  // ALWAYS check security patterns (100%)
  for (const rule of SECURITY_PATTERNS) {
    if (rule.pattern.test(content)) {
      violations.push({ ...rule, severity: 'critical' });
    }
  }

  // Block on critical security violations
  if (violations.some(v => v.severity === 'critical')) {
    const critical = violations.filter(v => v.severity === 'critical');
    process.stderr.write(
      `SECURITY VIOLATION in ${path.basename(filePath)}:\n` +
      critical.map(v => `  - ${v.message}`).join('\n') +
      `\nFix these before proceeding.`
    );
    process.exit(2);
  }

  // Sample check style patterns (5%)
  if (Math.random() < GENERAL_SAMPLE_RATE) {
    const warnings = [];
    for (const rule of STYLE_PATTERNS) {
      if (rule.pattern.test(content)) {
        warnings.push(rule);
      }
    }
    if (warnings.length > 0) {
      console.log(
        `[CONSTITUTION] Style check (sampled) for ${path.basename(filePath)}:\n` +
        warnings.map(w =>
          `  ${w.severity}: ${w.message}` + (w.selfHeal ? `\n    -> ${w.selfHeal}` : '')
        ).join('\n')
      );
    }
  }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
