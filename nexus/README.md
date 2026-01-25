# Nexus AI Workflow Platform

AI-powered workflow automation platform built with React, TypeScript, and Vite.

## Quick Start

```bash
cd nexus
npm install
npm run dev
```

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm run build         # Type-check and build
```

## CI/CD Setup

### GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:
1. **Test job**: Installs deps, runs tests with coverage, builds
2. **SonarCloud job**: Static analysis for bugs/vulnerabilities

### Required GitHub Secrets

Configure these in your repository settings (`Settings > Secrets and variables > Actions`):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `SONAR_TOKEN` | SonarCloud authentication token | [SonarCloud > My Account > Security](https://sonarcloud.io/account/security) |
| `SONAR_ORGANIZATION` | Your SonarCloud organization key | SonarCloud organization settings (e.g., `my-org`) |
| `SONAR_PROJECT_KEY` | Unique project identifier | Create project in SonarCloud (e.g., `my-org_nexus`) |

### SonarCloud Setup

1. **Create account**: Sign up at [sonarcloud.io](https://sonarcloud.io) with GitHub
2. **Import project**: Click "+" > "Analyze new project" > Select this repo
3. **Get credentials**:
   - Organization key: From your organization URL (`sonarcloud.io/organizations/YOUR_ORG`)
   - Project key: Auto-generated or custom (e.g., `your-org_nexus`)
   - Token: My Account > Security > Generate Token
4. **Add secrets**: Add all three to GitHub repository secrets
5. **Configure Quality Gate** (recommended):
   - Go to project > Administration > Quality Gate
   - Create custom gate that only fails on HIGH severity Bugs/Vulnerabilities
   - Recommended settings:
     - New Bugs > 0 (severity >= HIGH) → Fail
     - New Vulnerabilities > 0 (severity >= HIGH) → Fail
     - Code Smells → Warning only (don't fail)

### PR Integration

SonarCloud automatically:
- Comments on PRs with analysis results
- Adds status check that blocks merge on critical issues
- Shows inline code annotations for issues

## Project Structure

```
nexus/
├── src/
│   ├── components/     # React components
│   ├── services/       # API clients & business logic
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
├── server/             # Backend API
├── tests/              # Test setup & integration tests
└── sonar-project.properties  # SonarCloud config
```

## License

Proprietary - All rights reserved
