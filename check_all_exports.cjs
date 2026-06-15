const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src', 'features');
const features = fs.readdirSync(featuresDir).filter(f => fs.statSync(path.join(featuresDir, f)).isDirectory());

let missingExports = 0;

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

for (const feature of features) {
  const indexFile = path.join(featuresDir, feature, 'index.ts');
  const allFiles = getAllFiles(path.join(featuresDir, feature)).filter(f => f !== indexFile);
  
  if (!fs.existsSync(indexFile)) {
    if (allFiles.length > 0) {
      console.log(`Feature ${feature} is missing index.ts entirely`);
      missingExports += allFiles.length;
    }
    continue;
  }

  const content = fs.readFileSync(indexFile, 'utf-8');
  
  for (const file of allFiles) {
    const ext = path.extname(file);
    const relPath = path.relative(path.join(featuresDir, feature), file);
    const relPathWithoutExt = relPath.replace(/\.(ts|tsx)$/, '');
    
    // Convert path to module path (forward slashes)
    let modulePath = './' + relPathWithoutExt.replace(/\\/g, '/');
    let modulePathIndex = modulePath.endsWith('/index') ? modulePath.slice(0, -6) : null;
    if (modulePathIndex === '.') modulePathIndex = './';
    
    // Check if the file is exported in index.ts
    // Looking for export ... from './path' or export * from './path'
    const isExported = content.includes(`from '${modulePath}'`) || content.includes(`from "${modulePath}"`) || 
                       (modulePathIndex && (content.includes(`from '${modulePathIndex}'`) || content.includes(`from "${modulePathIndex}"`)));
    
    if (!isExported && !file.endsWith('.d.ts') && !file.includes('.test.') && !file.includes('__tests__')) {
      console.log(`Missing export in ${feature}/index.ts for: ${modulePath}`);
      missingExports++;
    }
  }
}

if (missingExports > 0) {
  console.log(`\nFound ${missingExports} files not exported in their feature index!`);
  process.exit(1);
} else {
  console.log("All files are exported in their feature index.");
}
