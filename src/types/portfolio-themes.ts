// src/types/portfolio-themes.ts

export const PORTFOLIO_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean lines, ample whitespace, professional feel.',
    // previewImage: '...' (Add later)
  },
  
  {
    id: 'modern_bright',
    name: 'Modern Bright',
    description: 'Clean lines, bright colors, professional feel.',
  },
  
  {
    id: 'cinematic', // <-- This ID matches the registry key
    name: 'Cinematic Dark',
    description: 'Immersive 3D sliders and dark mode.',
  },

  {
    id: 'classic',
    name: 'Classic Elegant',
    description: 'Serif fonts, soft colors, timeless look.',
  }
];

export const FONT_OPTIONS = [
  { id: 'sans', name: 'Inter (Clean Sans)', value: 'font-sans' },
  { id: 'serif', name: 'Playfair (Elegant Serif)', value: 'font-serif' },
  { id: 'mono', name: 'Roboto (Technical Mono)', value: 'font-mono' },
];

export const COLOR_PALETTES = [
  { id: 'violet', name: 'Creative Violet', value: '#8b5cf6' },
  { id: 'blue', name: 'Professional Blue', value: '#3b82f6' },
  { id: 'emerald', name: 'Nature Green', value: '#10b981' },
  { id: 'rose', name: 'Warm Rose', value: '#f43f5e' },
  { id: 'amber', name: 'Energetic Amber', value: '#f59e0b' },
  { id: 'slate', name: 'Neutral Slate', value: '#64748b' },
];