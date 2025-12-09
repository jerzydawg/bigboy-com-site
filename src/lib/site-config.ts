/**
 * Site Configuration Loader
 * Loads site-specific customizations embedded at build time
 * This file is generated during deployment with unique values per site
 */

import { generateDesignDNA, type DesignDNA, type DesignStyle } from './design-dna'

export interface SiteConfig {
  domain: string
  siteName: string
  keyword: string
  ownerEmail: string
  designStyle: DesignStyle  // 'basic' or 'advanced'
  designDNA?: Partial<DesignDNA>
  content?: {
    homepage?: {
      h1?: string
      description?: string
    }
  }
  environment: 'staging' | 'production'
  createdAt: string
  version: string
}

// ===== SITE CONFIG - REPLACED AT BUILD TIME =====
// DO NOT MODIFY THIS SECTION MANUALLY - IT IS AUTO-GENERATED
const SITE_CONFIG_DATA = {
  domain: "bigboy.com",
  siteName: "big boy",
  keyword: "my gov phone",
  ownerEmail: "bigboy@gmail.ocm",
  designStyle: "advanced" as DesignStyle,
  environment: "staging" as const,
  createdAt: "2025-12-09T00:12:20.171Z",
  version: "1.0.0"
};
// ===== END SITE CONFIG =====

// Default configuration (fallback)
const DEFAULT_CONFIG: SiteConfig = {
  domain: 'example.com',
  siteName: 'Free Phone Service',
  keyword: 'Free Government Phone',
  ownerEmail: 'admin@example.com',
  designStyle: 'basic',
  environment: 'staging',
  createdAt: new Date().toISOString(),
  version: '1.0.0'
}

let cachedConfig: SiteConfig | null = null
let cachedDesignDNA: DesignDNA | null = null

/**
 * Load site configuration
 */
export function getSiteConfig(): SiteConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  // Use embedded config data
  cachedConfig = {
    domain: SITE_CONFIG_DATA.domain || DEFAULT_CONFIG.domain,
    siteName: SITE_CONFIG_DATA.siteName || DEFAULT_CONFIG.siteName,
    keyword: SITE_CONFIG_DATA.keyword || DEFAULT_CONFIG.keyword,
    ownerEmail: SITE_CONFIG_DATA.ownerEmail || DEFAULT_CONFIG.ownerEmail,
    designStyle: SITE_CONFIG_DATA.designStyle || DEFAULT_CONFIG.designStyle,
    designDNA: (SITE_CONFIG_DATA as any).designDNA || undefined, // Custom design from Claude
    environment: SITE_CONFIG_DATA.environment || DEFAULT_CONFIG.environment,
    createdAt: SITE_CONFIG_DATA.createdAt || DEFAULT_CONFIG.createdAt,
    version: SITE_CONFIG_DATA.version || DEFAULT_CONFIG.version
  }
  
  return cachedConfig
}

/**
 * Get the site's Design DNA
 * Uses custom designDNA if set by Claude, otherwise generates from domain hash
 */
export function getDesignDNA(): DesignDNA {
  if (cachedDesignDNA) {
    return cachedDesignDNA
  }

  const config = getSiteConfig()
  
  // Start with the base generated DNA
  const baseDNA = generateDesignDNA(config.domain, config.keyword, config.designStyle)
  
  // If we have custom designDNA from Claude, merge it in
  if (config.designDNA && config.designDNA.colors) {
    const customColors = config.designDNA.colors
    
    // Override colors with Claude-generated ones
    cachedDesignDNA = {
      ...baseDNA,
      colors: {
        primary: customColors.primary || baseDNA.colors.primary,
        secondary: customColors.secondary || baseDNA.colors.secondary,
        accent: customColors.accent || baseDNA.colors.accent,
        background: customColors.background || baseDNA.colors.background,
        text: customColors.text || baseDNA.colors.text,
        textOnPrimary: customColors.textOnPrimary || baseDNA.colors.textOnPrimary,
      },
      // Regenerate gradients using the new custom colors
      gradients: {
        primary: `linear-gradient(135deg, ${customColors.primary || baseDNA.colors.primary}, ${customColors.secondary || baseDNA.colors.secondary})`,
        hero: `linear-gradient(180deg, ${customColors.primary || baseDNA.colors.primary}15 0%, ${customColors.background || baseDNA.colors.background} 100%)`,
        accent: `linear-gradient(135deg, ${customColors.accent || baseDNA.colors.accent}, ${customColors.primary || baseDNA.colors.primary})`,
      },
      // Override fonts if provided
      fonts: config.designDNA.fonts ? {
        heading: config.designDNA.fonts.heading || baseDNA.fonts.heading,
        body: config.designDNA.fonts.body || baseDNA.fonts.body,
      } : baseDNA.fonts,
    }
  } else {
    cachedDesignDNA = baseDNA
  }
  
  return cachedDesignDNA
}

/**
 * Get design style
 */
export function getDesignStyle(): DesignStyle {
  return getSiteConfig().designStyle
}

/**
 * Get site name
 */
export function getSiteName(): string {
  return getSiteConfig().siteName
}

/**
 * Get target keyword
 */
export function getKeyword(): string {
  return getSiteConfig().keyword
}

/**
 * Get domain
 */
export function getDomain(): string {
  return getSiteConfig().domain
}

/**
 * Get site URL
 */
export function getSiteURL(): string {
  return `https://${getDomain()}`
}

