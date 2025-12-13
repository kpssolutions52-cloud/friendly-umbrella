#!/usr/bin/env node

/**
 * Script to verify logo files are in place
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'public', 'images');
const logoFiles = ['logo.svg', 'logo.png', 'logo-icon.png'];

console.log('🔍 Checking for logo files...\n');

let foundFiles = [];
let missingFiles = [];

logoFiles.forEach(file => {
  const filePath = path.join(imagesDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    foundFiles.push({ file, size: sizeKB });
    console.log(`✅ Found: ${file} (${sizeKB} KB)`);
  } else {
    missingFiles.push(file);
    console.log(`❌ Missing: ${file}`);
  }
});

console.log('\n' + '='.repeat(50));

if (foundFiles.length === 0) {
  console.log('\n⚠️  No logo files found!');
  console.log('\nPlease add your logo to:');
  console.log(`   ${imagesDir}/logo.svg (or logo.png)`);
  console.log(`   ${imagesDir}/logo-icon.png (optional)`);
  process.exit(1);
} else if (foundFiles.length > 0 && missingFiles.length > 0) {
  console.log('\n✅ Logo files found!');
  if (missingFiles.includes('logo-icon.png')) {
    console.log('ℹ️  Note: logo-icon.png is optional (for favicon)');
  }
  process.exit(0);
} else {
  console.log('\n✅ All logo files are in place!');
  process.exit(0);
}

