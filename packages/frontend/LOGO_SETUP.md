# Logo Setup Guide

The logo integration has been set up in the system. Follow these steps to add your company logo.

## Step 1: Add Logo Files

Place your logo files in the `public/images/` directory:

### Required Files:
- **`logo.svg`** (recommended) or **`logo.png`** - Main logo file
  - Preferred format: SVG for best quality and scalability
  - Recommended size: At least 200x200px for PNG, or vector format for SVG
  - The logo should include the stylized 'K' graphic with orange arc and company name

- **`logo-icon.png`** (optional but recommended) - Icon version for favicon
  - Size: 32x32px or 64x64px
  - Square format
  - Used for browser tab icon

### File Locations:
```
packages/frontend/
└── public/
    └── images/
        ├── logo.svg (or logo.png)
        └── logo-icon.png (optional)
```

## Step 2: Logo Specifications

Based on your ALLIED DIGITAL & EVENTS logo:
- **Colors**: Blue (#0066CC or similar) and Orange (#FF6600 or similar)
- **Elements**: Stylized 'K' graphic with circuit board traces and orange arc
- **Text**: "ALLIED DIGITAL & EVENTS PTE. LTD."

## Step 3: Where the Logo Appears

The logo has been integrated into:

1. **Home Page Header** (`/`)
   - Appears in the top navigation bar
   - Links back to home page
   - Shows company name on larger screens

2. **Documentation Pages** (`/docs`)
   - Appears in the documentation navigation bar
   - Maintains consistent branding across documentation

3. **Browser Tab Icon** (Favicon)
   - Uses `logo-icon.png` if available
   - Falls back to main logo if icon not provided

4. **Page Title**
   - Updated to "ALLIED DIGITAL & EVENTS - Construction Pricing Platform"

## Step 4: Testing

After adding your logo files:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check the following pages:
   - Home page (`http://localhost:3000`)
   - Documentation page (`http://localhost:3000/docs`)
   - Browser tab icon

3. The logo should:
   - Display correctly on all screen sizes
   - Fall back gracefully if SVG is not available (uses PNG)
   - Show company name text if image fails to load

## Troubleshooting

### Logo Not Showing
- Verify the file is in `public/images/` directory
- Check file name matches exactly: `logo.svg` or `logo.png`
- Ensure file permissions allow reading
- Check browser console for image loading errors

### Logo Looks Blurry
- Use SVG format for best quality
- For PNG, ensure high resolution (at least 200x200px, preferably 400x400px or higher)

### Logo Too Large/Small
- The logo is sized responsively (48x48px on desktop, 40x40px on mobile)
- Adjust the `width` and `height` props in `Header.tsx` if needed

## Customization

To customize the logo display, edit:
- `packages/frontend/src/components/Header.tsx` - Main header component
- `packages/frontend/src/app/docs/layout.tsx` - Documentation header

## Notes

- The system automatically tries SVG first, then falls back to PNG
- If both image formats fail, the company name text is displayed
- Logo is optimized using Next.js Image component for performance

