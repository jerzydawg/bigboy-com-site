/**
 * Design DNA Generator
 * Creates unique visual styling for each site based on domain hash
 * Ensures 500+ sites look completely different to avoid Google penalties
 * 
 * Supports two design modes:
 * - Basic: Dynamic colors, fonts, minor layout variations
 * - Advanced: Completely different layouts, structures, and visual patterns
 */

export type DesignStyle = 'basic' | 'advanced';

export interface DesignDNA {
  designStyle: DesignStyle;
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    textOnPrimary: string
  }
  gradients: {
    primary: string
    hero: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  layout: {
    heroStyle: 'centered' | 'left-aligned' | 'split'
    cardStyle: 'rounded' | 'sharp' | 'minimal'
    ctaStyle: 'pill' | 'square' | 'rounded'
  }
  // Advanced layout configuration (only used when designStyle === 'advanced')
  advancedLayout?: AdvancedLayoutConfig;
}

/**
 * Advanced Layout Configuration
 * Provides significantly different structural variations for advanced mode
 */
export interface AdvancedLayoutConfig {
  // Hero section variations
  heroVariant: 'centered' | 'split-left' | 'split-right' | 'diagonal' | 'wave' | 'gradient-mesh' | 'card-overlay' | 'minimal';
  
  // Section order (randomized for uniqueness)
  sectionOrder: ('howItWorks' | 'features' | 'programs' | 'states' | 'cities' | 'cta')[];
  
  // Card layout variations
  cardLayout: 'grid-3' | 'grid-2' | 'grid-4' | 'masonry' | 'carousel' | 'accordion' | 'list' | 'alternating';
  
  // Navigation style
  navStyle: 'standard' | 'centered-logo' | 'minimal' | 'transparent' | 'dark' | 'floating';
  
  // Footer style
  footerStyle: 'mega' | 'simple' | 'minimal' | 'centered' | 'dark' | 'gradient';
  
  // Spacing scale
  spacingScale: 'compact' | 'balanced' | 'generous' | 'dramatic';
  
  // Animation style
  animationStyle: 'none' | 'subtle' | 'moderate' | 'playful';
  
  // Border radius scale
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  
  // Shadow intensity
  shadowStyle: 'none' | 'subtle' | 'medium' | 'strong' | 'colored';
  
  // Background pattern
  backgroundPattern: 'none' | 'dots' | 'grid' | 'waves' | 'gradient-mesh' | 'noise';
  
  // CTA placement
  ctaPlacement: 'inline' | 'floating' | 'sidebar' | 'bottom-bar' | 'modal-trigger';
  
  // Typography scale
  typographyScale: 'compact' | 'standard' | 'large' | 'dramatic';
  
  // Image style
  imageStyle: 'rounded' | 'sharp' | 'circular' | 'masked' | 'shadowed';
  
  // Button style
  buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient' | '3d' | 'glow';
}

// 50 unique color palettes - each completely different
const COLOR_PALETTES = [
  // Blues
  { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', background: '#eff6ff', text: '#1e293b', textOnPrimary: '#ffffff' },
  { primary: '#0ea5e9', secondary: '#0284c7', accent: '#f97316', background: '#f0f9ff', text: '#0f172a', textOnPrimary: '#ffffff' },
  { primary: '#3b82f6', secondary: '#2563eb', accent: '#eab308', background: '#dbeafe', text: '#1e293b', textOnPrimary: '#ffffff' },
  
  // Greens
  { primary: '#16a34a', secondary: '#15803d', accent: '#f59e0b', background: '#f0fdf4', text: '#14532d', textOnPrimary: '#ffffff' },
  { primary: '#22c55e', secondary: '#16a34a', accent: '#ef4444', background: '#dcfce7', text: '#166534', textOnPrimary: '#ffffff' },
  { primary: '#10b981', secondary: '#059669', accent: '#8b5cf6', background: '#ecfdf5', text: '#064e3b', textOnPrimary: '#ffffff' },
  
  // Purples
  { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#f59e0b', background: '#f5f3ff', text: '#4c1d95', textOnPrimary: '#ffffff' },
  { primary: '#a855f7', secondary: '#9333ea', accent: '#22c55e', background: '#faf5ff', text: '#581c87', textOnPrimary: '#ffffff' },
  { primary: '#6366f1', secondary: '#4f46e5', accent: '#f97316', background: '#eef2ff', text: '#3730a3', textOnPrimary: '#ffffff' },
  
  // Oranges
  { primary: '#f97316', secondary: '#ea580c', accent: '#3b82f6', background: '#fff7ed', text: '#7c2d12', textOnPrimary: '#ffffff' },
  { primary: '#fb923c', secondary: '#f97316', accent: '#8b5cf6', background: '#ffedd5', text: '#9a3412', textOnPrimary: '#1e293b' },
  { primary: '#f59e0b', secondary: '#d97706', accent: '#2563eb', background: '#fffbeb', text: '#78350f', textOnPrimary: '#1e293b' },
  
  // Reds
  { primary: '#ef4444', secondary: '#dc2626', accent: '#22c55e', background: '#fef2f2', text: '#7f1d1d', textOnPrimary: '#ffffff' },
  { primary: '#f43f5e', secondary: '#e11d48', accent: '#3b82f6', background: '#fff1f2', text: '#881337', textOnPrimary: '#ffffff' },
  
  // Teals
  { primary: '#14b8a6', secondary: '#0d9488', accent: '#f59e0b', background: '#f0fdfa', text: '#134e4a', textOnPrimary: '#ffffff' },
  { primary: '#06b6d4', secondary: '#0891b2', accent: '#f97316', background: '#ecfeff', text: '#164e63', textOnPrimary: '#ffffff' },
  
  // Pinks
  { primary: '#ec4899', secondary: '#db2777', accent: '#22c55e', background: '#fdf2f8', text: '#831843', textOnPrimary: '#ffffff' },
  { primary: '#d946ef', secondary: '#c026d3', accent: '#f59e0b', background: '#fdf4ff', text: '#701a75', textOnPrimary: '#ffffff' },
  
  // Cyans
  { primary: '#22d3ee', secondary: '#06b6d4', accent: '#f43f5e', background: '#cffafe', text: '#155e75', textOnPrimary: '#1e293b' },
  
  // Indigos
  { primary: '#4f46e5', secondary: '#4338ca', accent: '#f59e0b', background: '#e0e7ff', text: '#312e81', textOnPrimary: '#ffffff' },
  
  // Slates (professional)
  { primary: '#475569', secondary: '#334155', accent: '#3b82f6', background: '#f8fafc', text: '#0f172a', textOnPrimary: '#ffffff' },
  { primary: '#64748b', secondary: '#475569', accent: '#22c55e', background: '#f1f5f9', text: '#1e293b', textOnPrimary: '#ffffff' },
  
  // Warm combinations
  { primary: '#dc2626', secondary: '#b91c1c', accent: '#fbbf24', background: '#fef9f9', text: '#450a0a', textOnPrimary: '#ffffff' },
  { primary: '#ea580c', secondary: '#c2410c', accent: '#84cc16', background: '#fffaf5', text: '#431407', textOnPrimary: '#ffffff' },
  
  // Cool combinations
  { primary: '#0369a1', secondary: '#075985', accent: '#fbbf24', background: '#f0f9ff', text: '#0c4a6e', textOnPrimary: '#ffffff' },
  { primary: '#0891b2', secondary: '#0e7490', accent: '#f97316', background: '#ecfeff', text: '#155e75', textOnPrimary: '#ffffff' },
  
  // Nature inspired
  { primary: '#65a30d', secondary: '#4d7c0f', accent: '#f59e0b', background: '#f7fee7', text: '#365314', textOnPrimary: '#ffffff' },
  { primary: '#059669', secondary: '#047857', accent: '#ec4899', background: '#ecfdf5', text: '#064e3b', textOnPrimary: '#ffffff' },
  
  // More variations
  { primary: '#7c3aed', secondary: '#6d28d9', accent: '#10b981', background: '#f5f3ff', text: '#4c1d95', textOnPrimary: '#ffffff' },
  { primary: '#2dd4bf', secondary: '#14b8a6', accent: '#f43f5e', background: '#f0fdfa', text: '#115e59', textOnPrimary: '#1e293b' },
  { primary: '#818cf8', secondary: '#6366f1', accent: '#fbbf24', background: '#eef2ff', text: '#3730a3', textOnPrimary: '#ffffff' },
  { primary: '#34d399', secondary: '#10b981', accent: '#8b5cf6', background: '#d1fae5', text: '#065f46', textOnPrimary: '#1e293b' },
  { primary: '#fbbf24', secondary: '#f59e0b', accent: '#6366f1', background: '#fefce8', text: '#713f12', textOnPrimary: '#1e293b' },
  { primary: '#38bdf8', secondary: '#0ea5e9', accent: '#f43f5e', background: '#e0f2fe', text: '#0c4a6e', textOnPrimary: '#1e293b' },
  { primary: '#c084fc', secondary: '#a855f7', accent: '#22c55e', background: '#faf5ff', text: '#6b21a8', textOnPrimary: '#ffffff' },
  { primary: '#fb7185', secondary: '#f43f5e', accent: '#14b8a6', background: '#fff1f2', text: '#9f1239', textOnPrimary: '#ffffff' },
  { primary: '#a3e635', secondary: '#84cc16', accent: '#8b5cf6', background: '#f7fee7', text: '#3f6212', textOnPrimary: '#1e293b' },
  { primary: '#facc15', secondary: '#eab308', accent: '#7c3aed', background: '#fefce8', text: '#854d0e', textOnPrimary: '#1e293b' },
  { primary: '#4ade80', secondary: '#22c55e', accent: '#f43f5e', background: '#dcfce7', text: '#166534', textOnPrimary: '#1e293b' },
  { primary: '#60a5fa', secondary: '#3b82f6', accent: '#f97316', background: '#dbeafe', text: '#1e40af', textOnPrimary: '#ffffff' },
  
  // Additional unique palettes
  { primary: '#0d9488', secondary: '#0f766e', accent: '#fbbf24', background: '#ccfbf1', text: '#134e4a', textOnPrimary: '#ffffff' },
  { primary: '#7e22ce', secondary: '#6b21a8', accent: '#22c55e', background: '#f3e8ff', text: '#581c87', textOnPrimary: '#ffffff' },
  { primary: '#be123c', secondary: '#9f1239', accent: '#fbbf24', background: '#ffe4e6', text: '#881337', textOnPrimary: '#ffffff' },
  { primary: '#15803d', secondary: '#166534', accent: '#f97316', background: '#bbf7d0', text: '#14532d', textOnPrimary: '#ffffff' },
  { primary: '#1d4ed8', secondary: '#1e40af', accent: '#fbbf24', background: '#bfdbfe', text: '#1e3a8a', textOnPrimary: '#ffffff' },
  { primary: '#b45309', secondary: '#92400e', accent: '#3b82f6', background: '#fef3c7', text: '#78350f', textOnPrimary: '#ffffff' },
  { primary: '#0f766e', secondary: '#115e59', accent: '#f43f5e', background: '#99f6e4', text: '#134e4a', textOnPrimary: '#ffffff' },
  { primary: '#9333ea', secondary: '#7e22ce', accent: '#f59e0b', background: '#e9d5ff', text: '#6b21a8', textOnPrimary: '#ffffff' },
  { primary: '#dc2626', secondary: '#b91c1c', accent: '#14b8a6', background: '#fecaca', text: '#7f1d1d', textOnPrimary: '#ffffff' },
  { primary: '#ca8a04', secondary: '#a16207', accent: '#8b5cf6', background: '#fef08a', text: '#713f12', textOnPrimary: '#1e293b' },
]

// 30 font combinations
const FONT_COMBINATIONS = [
  { heading: 'Inter', body: 'Inter' },
  { heading: 'Poppins', body: 'Open Sans' },
  { heading: 'Montserrat', body: 'Lato' },
  { heading: 'Playfair Display', body: 'Source Sans Pro' },
  { heading: 'Raleway', body: 'Roboto' },
  { heading: 'Oswald', body: 'Merriweather' },
  { heading: 'Nunito', body: 'Nunito Sans' },
  { heading: 'DM Sans', body: 'DM Sans' },
  { heading: 'Work Sans', body: 'Work Sans' },
  { heading: 'Rubik', body: 'Karla' },
  { heading: 'Quicksand', body: 'Quicksand' },
  { heading: 'Josefin Sans', body: 'Lora' },
  { heading: 'Cabin', body: 'Cabin' },
  { heading: 'Mulish', body: 'Mulish' },
  { heading: 'Barlow', body: 'Barlow' },
  { heading: 'Manrope', body: 'Manrope' },
  { heading: 'Outfit', body: 'Outfit' },
  { heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans' },
  { heading: 'Sora', body: 'Sora' },
  { heading: 'Urbanist', body: 'Urbanist' },
  { heading: 'Figtree', body: 'Figtree' },
  { heading: 'Lexend', body: 'Lexend' },
  { heading: 'Be Vietnam Pro', body: 'Be Vietnam Pro' },
  { heading: 'Red Hat Display', body: 'Red Hat Text' },
  { heading: 'Space Grotesk', body: 'Space Grotesk' },
  { heading: 'Albert Sans', body: 'Albert Sans' },
  { heading: 'Epilogue', body: 'Epilogue' },
  { heading: 'General Sans', body: 'General Sans' },
  { heading: 'Satoshi', body: 'Satoshi' },
  { heading: 'Clash Display', body: 'Clash Grotesk' },
]

// Layout variations for Basic mode
const LAYOUT_OPTIONS = {
  heroStyles: ['centered', 'left-aligned', 'split'] as const,
  cardStyles: ['rounded', 'sharp', 'minimal'] as const,
  ctaStyles: ['pill', 'square', 'rounded'] as const,
}

// Advanced layout options - significantly more variations
const ADVANCED_LAYOUT_OPTIONS = {
  heroVariants: ['centered', 'split-left', 'split-right', 'diagonal', 'wave', 'gradient-mesh', 'card-overlay', 'minimal'] as const,
  cardLayouts: ['grid-3', 'grid-2', 'grid-4', 'masonry', 'carousel', 'accordion', 'list', 'alternating'] as const,
  navStyles: ['standard', 'centered-logo', 'minimal', 'transparent', 'dark', 'floating'] as const,
  footerStyles: ['mega', 'simple', 'minimal', 'centered', 'dark', 'gradient'] as const,
  spacingScales: ['compact', 'balanced', 'generous', 'dramatic'] as const,
  animationStyles: ['none', 'subtle', 'moderate', 'playful'] as const,
  borderRadii: ['none', 'small', 'medium', 'large', 'full'] as const,
  shadowStyles: ['none', 'subtle', 'medium', 'strong', 'colored'] as const,
  backgroundPatterns: ['none', 'dots', 'grid', 'waves', 'gradient-mesh', 'noise'] as const,
  ctaPlacements: ['inline', 'floating', 'sidebar', 'bottom-bar', 'modal-trigger'] as const,
  typographyScales: ['compact', 'standard', 'large', 'dramatic'] as const,
  imageStyles: ['rounded', 'sharp', 'circular', 'masked', 'shadowed'] as const,
  buttonStyles: ['solid', 'outline', 'ghost', 'gradient', '3d', 'glow'] as const,
}

// Section order variations for Advanced mode
const SECTION_ORDER_VARIATIONS = [
  ['howItWorks', 'features', 'programs', 'states', 'cities', 'cta'],
  ['features', 'howItWorks', 'programs', 'cities', 'states', 'cta'],
  ['programs', 'features', 'howItWorks', 'states', 'cta', 'cities'],
  ['howItWorks', 'programs', 'features', 'cta', 'states', 'cities'],
  ['features', 'programs', 'howItWorks', 'cities', 'cta', 'states'],
  ['programs', 'howItWorks', 'features', 'states', 'cities', 'cta'],
  ['cta', 'features', 'howItWorks', 'programs', 'states', 'cities'],
  ['features', 'cta', 'howItWorks', 'programs', 'cities', 'states'],
] as const;

/**
 * Generate a hash from a string
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
  }
  hash = hash ^ (hash >>> 16);
  hash = Math.imul(hash, 0x85ebca6b);
  hash = hash ^ (hash >>> 13);
  return Math.abs(hash);
}

/**
 * Generate Advanced Layout Configuration
 */
function generateAdvancedLayout(domain: string, keyword: string): AdvancedLayoutConfig {
  const seed1 = hashString(domain);
  const seed2 = hashString(keyword + domain);
  const seed3 = hashString(domain.split('').reverse().join(''));
  const seed4 = hashString(domain + keyword + 'layout');
  const seed5 = hashString(keyword.split('').reverse().join('') + domain);
  
  return {
    heroVariant: ADVANCED_LAYOUT_OPTIONS.heroVariants[seed1 % ADVANCED_LAYOUT_OPTIONS.heroVariants.length],
    sectionOrder: [...SECTION_ORDER_VARIATIONS[seed2 % SECTION_ORDER_VARIATIONS.length]],
    cardLayout: ADVANCED_LAYOUT_OPTIONS.cardLayouts[seed3 % ADVANCED_LAYOUT_OPTIONS.cardLayouts.length],
    navStyle: ADVANCED_LAYOUT_OPTIONS.navStyles[seed4 % ADVANCED_LAYOUT_OPTIONS.navStyles.length],
    footerStyle: ADVANCED_LAYOUT_OPTIONS.footerStyles[(seed1 + seed2) % ADVANCED_LAYOUT_OPTIONS.footerStyles.length],
    spacingScale: ADVANCED_LAYOUT_OPTIONS.spacingScales[seed5 % ADVANCED_LAYOUT_OPTIONS.spacingScales.length],
    animationStyle: ADVANCED_LAYOUT_OPTIONS.animationStyles[(seed3 + seed4) % ADVANCED_LAYOUT_OPTIONS.animationStyles.length],
    borderRadius: ADVANCED_LAYOUT_OPTIONS.borderRadii[(seed1 + seed3) % ADVANCED_LAYOUT_OPTIONS.borderRadii.length],
    shadowStyle: ADVANCED_LAYOUT_OPTIONS.shadowStyles[(seed2 + seed4) % ADVANCED_LAYOUT_OPTIONS.shadowStyles.length],
    backgroundPattern: ADVANCED_LAYOUT_OPTIONS.backgroundPatterns[(seed1 + seed5) % ADVANCED_LAYOUT_OPTIONS.backgroundPatterns.length],
    ctaPlacement: ADVANCED_LAYOUT_OPTIONS.ctaPlacements[(seed2 + seed5) % ADVANCED_LAYOUT_OPTIONS.ctaPlacements.length],
    typographyScale: ADVANCED_LAYOUT_OPTIONS.typographyScales[(seed3 + seed5) % ADVANCED_LAYOUT_OPTIONS.typographyScales.length],
    imageStyle: ADVANCED_LAYOUT_OPTIONS.imageStyles[(seed4 + seed5) % ADVANCED_LAYOUT_OPTIONS.imageStyles.length],
    buttonStyle: ADVANCED_LAYOUT_OPTIONS.buttonStyles[(seed1 + seed4) % ADVANCED_LAYOUT_OPTIONS.buttonStyles.length],
  };
}

/**
 * Generate unique Design DNA based on domain
 */
export function generateDesignDNA(domain: string, keyword: string = '', designStyle: DesignStyle = 'basic'): DesignDNA {
  const seed = hashString(domain + keyword)
  
  // Select palette based on hash
  const paletteIndex = seed % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[paletteIndex]
  
  // Select fonts based on different hash
  const fontIndex = hashString(domain.split('').reverse().join('')) % FONT_COMBINATIONS.length
  const fonts = FONT_COMBINATIONS[fontIndex]
  
  // Select layout options
  const layoutSeed = hashString(keyword + domain)
  const heroStyle = LAYOUT_OPTIONS.heroStyles[layoutSeed % LAYOUT_OPTIONS.heroStyles.length]
  const cardStyle = LAYOUT_OPTIONS.cardStyles[(layoutSeed >> 2) % LAYOUT_OPTIONS.cardStyles.length]
  const ctaStyle = LAYOUT_OPTIONS.ctaStyles[(layoutSeed >> 4) % LAYOUT_OPTIONS.ctaStyles.length]
  
  const baseDNA: DesignDNA = {
    designStyle,
    colors: palette,
    gradients: {
      primary: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
      hero: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.accent} 100%)`,
      accent: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.primary} 100%)`,
    },
    fonts,
    layout: {
      heroStyle,
      cardStyle,
      ctaStyle
    }
  };
  
  // Add advanced layout configuration if in advanced mode
  if (designStyle === 'advanced') {
    baseDNA.advancedLayout = generateAdvancedLayout(domain, keyword);
  }
  
  return baseDNA;
}

/**
 * Generate CSS variables from Design DNA
 */
// Helper to generate a light version of a color for hover states
function generateLightColor(hex: string): string {
  // Convert hex to RGB, mix with white, return as rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.1)`;
}

export function generateCSSVariables(dna: DesignDNA): string {
  let css = `
    --color-primary: ${dna.colors.primary};
    --color-primary-light: ${generateLightColor(dna.colors.primary)};
    --color-secondary: ${dna.colors.secondary};
    --color-accent: ${dna.colors.accent};
    --color-background: ${dna.colors.background};
    --color-text: ${dna.colors.text};
    --color-text-on-primary: ${dna.colors.textOnPrimary};
    --gradient-primary: ${dna.gradients.primary};
    --gradient-hero: ${dna.gradients.hero};
    --gradient-accent: ${dna.gradients.accent};
    --font-heading: '${dna.fonts.heading}', sans-serif;
    --font-body: '${dna.fonts.body}', sans-serif;
  `;
  
  // Add advanced CSS variables if in advanced mode
  if (dna.designStyle === 'advanced' && dna.advancedLayout) {
    const adv = dna.advancedLayout;
    
    // Border radius
    const borderRadiusMap = { none: '0', small: '4px', medium: '8px', large: '16px', full: '9999px' };
    css += `--border-radius: ${borderRadiusMap[adv.borderRadius]};`;
    
    // Spacing scale
    const spacingMap = { compact: '0.75', balanced: '1', generous: '1.25', dramatic: '1.5' };
    css += `--spacing-scale: ${spacingMap[adv.spacingScale]};`;
    
    // Typography scale
    const typoMap = { compact: '0.9', standard: '1', large: '1.1', dramatic: '1.25' };
    css += `--typography-scale: ${typoMap[adv.typographyScale]};`;
    
    // Shadow style
    const shadowMap = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      strong: '0 10px 25px rgba(0,0,0,0.15)',
      colored: `0 10px 25px ${dna.colors.primary}30`,
    };
    css += `--shadow: ${shadowMap[adv.shadowStyle]};`;
  }
  
  return css;
}

/**
 * Get Google Fonts URL for the design DNA fonts
 */
export function getGoogleFontsURL(dna: DesignDNA): string {
  const fonts = [dna.fonts.heading]
  if (dna.fonts.body !== dna.fonts.heading) {
    fonts.push(dna.fonts.body)
  }
  const fontParams = fonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`).join('&')
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`
}

/**
 * Get CSS classes for advanced layout elements
 */
export function getAdvancedLayoutClasses(dna: DesignDNA): Record<string, string> {
  if (dna.designStyle !== 'advanced' || !dna.advancedLayout) {
    return {};
  }
  
  const adv = dna.advancedLayout;
  
  return {
    // Hero classes
    heroClass: `hero-${adv.heroVariant}`,
    
    // Card layout classes
    cardContainerClass: `cards-${adv.cardLayout}`,
    
    // Navigation classes
    navClass: `nav-${adv.navStyle}`,
    
    // Footer classes
    footerClass: `footer-${adv.footerStyle}`,
    
    // Animation classes
    animationClass: `animate-${adv.animationStyle}`,
    
    // Background pattern classes
    backgroundClass: `bg-pattern-${adv.backgroundPattern}`,
    
    // Button classes
    buttonClass: `btn-${adv.buttonStyle}`,
    
    // Image classes
    imageClass: `img-${adv.imageStyle}`,
    
    // CTA placement
    ctaClass: `cta-${adv.ctaPlacement}`,
  };
}

/**
 * Generate background pattern CSS
 */
export function getBackgroundPatternCSS(pattern: AdvancedLayoutConfig['backgroundPattern'], primaryColor: string): string {
  switch (pattern) {
    case 'dots':
      return `background-image: radial-gradient(${primaryColor}20 1px, transparent 1px); background-size: 20px 20px;`;
    case 'grid':
      return `background-image: linear-gradient(${primaryColor}10 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}10 1px, transparent 1px); background-size: 40px 40px;`;
    case 'waves':
      return `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${encodeURIComponent(primaryColor)}' fill-opacity='0.1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");`;
    case 'gradient-mesh':
      return `background: radial-gradient(at 40% 20%, ${primaryColor}30 0px, transparent 50%), radial-gradient(at 80% 0%, ${primaryColor}20 0px, transparent 50%), radial-gradient(at 0% 50%, ${primaryColor}25 0px, transparent 50%);`;
    case 'noise':
      return `background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); opacity: 0.05;`;
    default:
      return '';
  }
}

/**
 * Calculate total unique combinations for verification
 */
export function calculateUniqueCombinations(designStyle: DesignStyle): number {
  const colorCount = COLOR_PALETTES.length; // 50
  const fontCount = FONT_COMBINATIONS.length; // 30
  
  if (designStyle === 'basic') {
    const heroCount = LAYOUT_OPTIONS.heroStyles.length; // 3
    const cardCount = LAYOUT_OPTIONS.cardStyles.length; // 3
    const ctaCount = LAYOUT_OPTIONS.ctaStyles.length; // 3
    return colorCount * fontCount * heroCount * cardCount * ctaCount;
  } else {
    // Advanced mode has many more combinations
    const heroCount = ADVANCED_LAYOUT_OPTIONS.heroVariants.length; // 8
    const cardCount = ADVANCED_LAYOUT_OPTIONS.cardLayouts.length; // 8
    const navCount = ADVANCED_LAYOUT_OPTIONS.navStyles.length; // 6
    const footerCount = ADVANCED_LAYOUT_OPTIONS.footerStyles.length; // 6
    const spacingCount = ADVANCED_LAYOUT_OPTIONS.spacingScales.length; // 4
    const animCount = ADVANCED_LAYOUT_OPTIONS.animationStyles.length; // 4
    const borderCount = ADVANCED_LAYOUT_OPTIONS.borderRadii.length; // 5
    const shadowCount = ADVANCED_LAYOUT_OPTIONS.shadowStyles.length; // 5
    const bgCount = ADVANCED_LAYOUT_OPTIONS.backgroundPatterns.length; // 6
    const ctaCount = ADVANCED_LAYOUT_OPTIONS.ctaPlacements.length; // 5
    const typoCount = ADVANCED_LAYOUT_OPTIONS.typographyScales.length; // 4
    const imgCount = ADVANCED_LAYOUT_OPTIONS.imageStyles.length; // 5
    const btnCount = ADVANCED_LAYOUT_OPTIONS.buttonStyles.length; // 6
    const sectionCount = SECTION_ORDER_VARIATIONS.length; // 8
    
    return colorCount * fontCount * heroCount * cardCount * navCount * footerCount * 
           spacingCount * animCount * borderCount * shadowCount * bgCount * 
           ctaCount * typoCount * imgCount * btnCount * sectionCount;
  }
}

// Export for testing
export { COLOR_PALETTES, FONT_COMBINATIONS, ADVANCED_LAYOUT_OPTIONS, SECTION_ORDER_VARIATIONS };
