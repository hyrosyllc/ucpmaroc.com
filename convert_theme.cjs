const fs = require('fs');
const path = require('path');

const dir = '/workspaces/voice/src/themes/modern-bright';

const mappings = [
  // Backgrounds
  { from: 'bg-neutral-950', to: 'bg-white' },
  { from: 'bg-neutral-900', to: 'bg-neutral-50' },
  { from: 'bg-neutral-800', to: 'bg-neutral-100' },
  { from: 'bg-neutral-700', to: 'bg-neutral-200' },
  // bg-neutral-200 in dark mode is used for bright elements, so in light mode it should be dark
  { from: 'bg-neutral-200', to: 'bg-neutral-800' },
  { from: 'bg-white/10', to: 'bg-black/5' },
  { from: 'bg-white/5', to: 'bg-black/5' },
  { from: 'bg-white/20', to: 'bg-black/10' },
  { from: 'bg-black/50', to: 'bg-white/50' },

  // Text
  { from: 'text-white/70', to: 'text-neutral-600' },
  { from: 'text-white/60', to: 'text-neutral-500' },
  { from: 'text-white/80', to: 'text-neutral-700' },
  { from: 'text-white', to: 'text-neutral-900' },
  { from: 'text-neutral-300', to: 'text-neutral-700' },
  { from: 'text-neutral-400', to: 'text-neutral-600' },
  { from: 'text-neutral-500', to: 'text-neutral-500' },
  { from: 'text-neutral-200', to: 'text-neutral-800' },
  
  // Borders
  { from: 'border-white/10', to: 'border-black/10' },
  { from: 'border-white/20', to: 'border-black/20' },
  { from: 'border-white/30', to: 'border-black/30' },
  { from: 'border-white/5', to: 'border-black/5' },
  { from: 'border-neutral-800', to: 'border-neutral-200' },
  { from: 'border-neutral-700', to: 'border-neutral-300' },

  // Rings and Divides
  { from: 'ring-white/10', to: 'ring-black/10' },
  { from: 'divide-white/10', to: 'divide-black/10' },
  
  // Hover Backgrounds
  { from: 'hover:bg-neutral-800', to: 'hover:bg-neutral-200' },
  { from: 'hover:bg-neutral-900', to: 'hover:bg-neutral-100' },
  { from: 'hover:bg-white/10', to: 'hover:bg-black/5' },
  { from: 'hover:bg-white/20', to: 'hover:bg-black/10' },

  // Gradients
  { from: 'from-neutral-950', to: 'from-white' },
  { from: 'to-neutral-950', to: 'to-white' },
  { from: 'via-neutral-950', to: 'via-white' },
  { from: 'from-neutral-900', to: 'from-neutral-50' },
  { from: 'to-neutral-900', to: 'to-neutral-50' },
  { from: 'via-neutral-900', to: 'via-neutral-50' },

  // Black backgrounds
  { from: 'bg-black', to: 'bg-white' },
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
      
      // Need to be careful with word boundaries, but tailwind classes often have prefixes/suffixes.
      // We will do straightforward string replace using regex for word boundaries where appropriate,
      // or just direct replacement if we match exactly.
      
      mappings.forEach(({from, to}) => {
        // Regex to match the exact class (must not be preceded or followed by a word character or hyphen)
        // e.g. text-white shouldn't match text-white/50
        // We handle slash separated values by including / in the word characters if it's part of the 'from'
        
        // Escape special chars in 'from'
        const escapedFrom = from.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // If 'from' doesn't have a slash, ensure it's not followed by a slash
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
