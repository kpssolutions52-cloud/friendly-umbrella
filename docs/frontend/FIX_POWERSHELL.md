# Fix PowerShell Execution Policy Error

## The Problem

PowerShell is blocking npm because script execution is disabled for security.

## Quick Fix

### Option 1: Run PowerShell as Administrator

1. **Close this terminal**
2. **Right-click on PowerShell** (or Command Prompt)
3. **Select "Run as Administrator"**
4. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
5. **Type "Y" and press Enter** when asked
6. **Navigate back to your project:**
   ```powershell
   cd C:\Users\kasun\OneDrive\Desktop\Projects\friendly-umbrella
   ```
7. **Now npm will work!**

### Option 2: Use Command Prompt Instead

1. **Open Command Prompt** (cmd.exe) - NOT PowerShell
2. Navigate to your project:
   ```cmd
   cd C:\Users\kasun\OneDrive\Desktop\Projects\friendly-umbrella
   ```
3. **Run npm commands** - they'll work in cmd!

### Option 3: Use npm.cmd Directly

In PowerShell, use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install
npm.cmd run dev
```

## After Fixing - Start Servers

Once execution policy is fixed:

```bash
npm install
npm run dev
```

## Why This Happens

Windows PowerShell restricts script execution by default for security. This is a one-time fix.

## Verify It's Fixed

After fixing, test with:
```powershell
npm --version
```

If it works, you're good to go!

