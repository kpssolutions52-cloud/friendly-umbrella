const fs = require('fs');
const path = require('path');

// Source: project root docs folder
const sourceDir = path.join(__dirname, '../../../docs');
// Destination: frontend package docs folder
const destDir = path.join(__dirname, '../docs');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (fs.existsSync(sourceDir)) {
    copyRecursive(sourceDir, destDir);
    
    // Verify key files were copied
    const keyFiles = [
      'QS_AI_AGENT_ARCHITECTURE.md',
      'PRODUCT_OVERVIEW.md',
      'QUICK_START.md',
      'DATABASE_SCHEMA.md',
      'IMPLEMENTATION_GUIDE.md',
      'README.md'
    ];
    
    const copied = keyFiles.filter(file => 
      fs.existsSync(path.join(destDir, file))
    );
    
    console.log(`✓ Documentation files copied successfully (${copied.length}/${keyFiles.length} key files)`);
    
    if (copied.length < keyFiles.length) {
      console.warn('⚠ Some key documentation files may be missing');
    }
  } else {
    console.warn('⚠ Docs directory not found at:', sourceDir);
  }
} catch (error) {
  console.error('✗ Error copying docs:', error);
  // Don't fail the build if docs copy fails
  process.exit(0);
}
