const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src', 'features');
const features = fs.readdirSync(featuresDir).filter(f => fs.statSync(path.join(featuresDir, f)).isDirectory());

let errors = 0;

for (const feature of features) {
  const indexFile = path.join(featuresDir, feature, 'index.ts');
  if (!fs.existsSync(indexFile)) continue;

  const content = fs.readFileSync(indexFile, 'utf-8');
  
  // Extract export statements
  const exportRegex = /export\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const importPath = match[2];
    
    // Resolve relative to index.ts
    const resolvedPath = path.resolve(path.dirname(indexFile), importPath);
    
    // Check if file exists (can be .ts, .tsx, .js, .jsx, or a directory with index.ts)
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '']; // empty string for cases where extension is already in path, but usually it's not. Wait, for exact files it's .ts or .tsx
    
    let exists = false;
    // Check if it's a file with extension already
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        exists = true;
    }
    
    if (!exists) {
        for (const ext of extensions) {
          if (ext && fs.existsSync(resolvedPath + ext)) {
            exists = true;
            break;
          }
        }
    }
    
    if (!exists) {
      console.error(`Missing file in ${feature}: ${importPath} (resolved: ${resolvedPath})`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.log(`\nFound ${errors} missing files!`);
  process.exit(1);
} else {
  console.log("All exported files exist.");
}