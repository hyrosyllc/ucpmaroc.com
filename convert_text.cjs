const fs = require('fs');
const path = require('path');

const dir = '/workspaces/voice/src/themes/modern-bright';

const mappings = [
  { from: 'text-white/90', to: 'text-neutral-800' },
  { from: 'text-white/50', to: 'text-neutral-500' },
  { from: 'text-white/70', to: 'text-neutral-600' },
  { from: 'text-white/60', to: 'text-neutral-500' },
  { from: 'text-white/80', to: 'text-neutral-700' },
  { from: 'text-white', to: 'text-neutral-900' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      mappings.forEach(({from, to}) => {
        const escapedFrom = from.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        let regexStr = `(?<![a-zA-Z0-9-])` + escapedFrom + `(?![a-zA-Z0-9-/${from.includes('/') ? '' : '/'}])`;
        const regex = new RegExp(regexStr, 'g');
        newContent = newContent.replace(regex, to);
      });
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
