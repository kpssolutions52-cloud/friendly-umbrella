# How to Add Your Company Logo

## Quick Steps

1. **Get your logo file** (PNG, SVG, or JPG format)
   - If you have the logo file on your computer, copy it
   - If you need to download it, save it from your design source

2. **Place the file in the correct location:**
   ```
   packages/frontend/public/images/logo.png
   ```
   Or if you have SVG format (recommended):
   ```
   packages/frontend/public/images/logo.svg
   ```

3. **Optional - Add favicon:**
   ```
   packages/frontend/public/images/logo-icon.png
   ```
   (Square format, 32x32px or 64x64px recommended)

## File Naming

The system looks for files in this order:
- `logo.svg` (preferred - best quality)
- `logo.png` (fallback if SVG not found)
- `logo-icon.png` (for browser tab icon)

## Verify Logo is Added

After adding your logo file, run:
```bash
cd packages/frontend
npm run verify-logo
```

Or check manually:
- Navigate to: `packages/frontend/public/images/`
- You should see your `logo.svg` or `logo.png` file there

## Test the Logo

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000`
   - The logo should appear in the header
   - Check the browser tab for the favicon

## Troubleshooting

**Logo not showing?**
- ✅ Check file is named exactly: `logo.svg` or `logo.png`
- ✅ Check file is in: `packages/frontend/public/images/`
- ✅ Check file size is reasonable (< 5MB)
- ✅ Try refreshing the browser (Ctrl+F5 or Cmd+Shift+R)

**Logo looks blurry?**
- Use SVG format for best quality
- For PNG, use high resolution (at least 400x400px)

**Need to resize?**
- The logo automatically scales, but for best results:
  - Main logo: 200x200px minimum
  - Favicon: 32x32px or 64x64px

## Current Logo Specifications

Based on your ALLIED DIGITAL & EVENTS logo:
- **Colors**: Blue (#0066CC) and Orange (#FF6600)
- **Elements**: Stylized 'K' with circuit traces and orange arc
- **Text**: "ALLIED DIGITAL & EVENTS PTE. LTD."

Once you add the file, the logo will automatically appear throughout the application!

