# Auto-Claude Setup Instructions

## Current Status

✅ **Completed:**
- Cloned Auto-Claude repository
- Installed CMake 4.2.1
- Installed Visual Studio 2022 Build Tools with C++ support

⏳ **Requires System Restart:**
- Backend dependencies installation
- Frontend dependencies installation

---

## Next Steps After Restart

### Method 1: Automated Setup (Recommended)

1. **Restart your computer**

2. **Navigate to this folder:**
   ```
   C:\Users\PC\Documents\Autoclaude 2D workflow office\Auto-Claude
   ```

3. **Double-click the file:**
   ```
   setup-after-restart.bat
   ```

4. **Follow the on-screen prompts**
   - The script will check your environment
   - Install all dependencies automatically
   - Ask if you want to run the app

---

### Method 2: Manual Setup

If you prefer to run commands manually:

1. **Restart your computer**

2. **Open PowerShell or Command Prompt**

3. **Navigate to the Auto-Claude directory:**
   ```bash
   cd "C:\Users\PC\Documents\Autoclaude 2D workflow office\Auto-Claude"
   ```

4. **Verify CMake is installed:**
   ```bash
   cmake --version
   # Should show: cmake version 4.2.1
   ```

5. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   This will install both backend (Python) and frontend (Node.js) dependencies.

6. **Run the application:**
   ```bash
   npm run dev
   ```

---

## Environment Configuration (Optional)

Before running the app, you may want to configure environment variables:

1. **Navigate to the backend folder:**
   ```bash
   cd apps/backend
   ```

2. **Copy the example env file:**
   ```bash
   copy .env.example .env
   ```

3. **Edit `.env` and add your API tokens:**
   - `CLAUDE_CODE_OAUTH_TOKEN` - Get via: `claude setup-token`

---

## Available Commands

After installation completes, you can use:

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production build |
| `npm run test` | Run tests |
| `npm run test:backend` | Run backend tests only |
| `npm run package` | Create distribution package |

---

## Troubleshooting

### If Installation Fails:

1. **Make sure you restarted your computer** after installing build tools

2. **Run as Administrator:**
   - Right-click PowerShell → "Run as Administrator"
   - Navigate to the Auto-Claude folder
   - Run `npm run install:all`

3. **Check Python version:**
   ```bash
   python --version
   # Should show: Python 3.14.1
   ```

4. **Check Node version:**
   ```bash
   node --version
   # Should show: v25.2.1 or higher
   ```

5. **Verify Visual Studio Build Tools:**
   - Open "Add or Remove Programs"
   - Search for "Visual Studio Build Tools 2022"
   - Should show as installed

### If Backend Installation Fails:

The backend requires building native Python packages. If it fails:

1. Open a fresh **Developer Command Prompt for VS 2022**
2. Navigate to: `C:\Users\PC\Documents\Autoclaude 2D workflow office\Auto-Claude`
3. Run: `npm run install:backend`

### If Frontend Installation Fails:

1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

---

## System Requirements Met

✅ Python 3.14.1 (requires 3.12+)
✅ Node.js v25.2.1 (requires 24+)
✅ npm 11.6.2 (requires 10+)
✅ CMake 4.2.1
✅ Visual Studio Build Tools 2022 with C++

---

## Quick Reference

**Project Location:**
```
C:\Users\PC\Documents\Autoclaude 2D workflow office\Auto-Claude
```

**After Restart, Run:**
```
setup-after-restart.bat
```

**Or Manually:**
```bash
cd "C:\Users\PC\Documents\Autoclaude 2D workflow office\Auto-Claude"
npm run install:all
npm run dev
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/AndyMik90/Auto-Claude/issues
- Contributing Guide: https://github.com/AndyMik90/Auto-Claude/blob/develop/CONTRIBUTING.md

---

**Created:** 2026-01-03
**Status:** Ready for restart and final installation
