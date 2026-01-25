#!/usr/bin/env node
/**
 * GLM 4.7 Query Script
 * Use for coding tasks via Claude Code's Bash tool
 *
 * Usage: node .claude/scripts/glm-query.js "Your prompt here"
 * Or:    node .claude/scripts/glm-query.js --file prompt.txt
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env from nexus folder
const envPath = path.join(__dirname, '../../nexus/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const API_KEY = process.env.ZAI_API_KEY;
const API_URL = process.env.ZAI_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions';

if (!API_KEY) {
  console.error('Error: ZAI_API_KEY not found in nexus/.env');
  process.exit(1);
}

async function queryGLM(prompt, options = {}) {
  const url = new URL(API_URL);

  const requestBody = {
    model: options.model || 'glm-4.7',
    messages: [
      { role: 'system', content: options.system || 'You are a helpful coding assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 4096
  };

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept-Language': 'en-US,en'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else if (json.error) {
            reject(new Error(json.error.message || 'API Error'));
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node glm-query.js "Your prompt"');
    console.log('       node glm-query.js --file prompt.txt');
    console.log('       node glm-query.js --system "System prompt" "User prompt"');
    process.exit(0);
  }

  let prompt = '';
  let system = 'You are a helpful coding assistant. Provide concise, working code.';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      prompt = fs.readFileSync(args[i + 1], 'utf8');
      i++;
    } else if (args[i] === '--system' && args[i + 1]) {
      system = args[i + 1];
      i++;
    } else {
      prompt = args[i];
    }
  }

  if (!prompt) {
    console.error('No prompt provided');
    process.exit(1);
  }

  try {
    const response = await queryGLM(prompt, { system });
    console.log(response);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
