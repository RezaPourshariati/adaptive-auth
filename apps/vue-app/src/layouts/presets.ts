import type { LayoutConfig, LayoutPreset } from './types'

/** Product-area presets — prefer these over per-page showcase variants. */
export const layoutPresets: Record<string, LayoutPreset> = {
  auth: {
    name: 'Auth Layout',
    description: 'Minimal chrome for authentication flows',
    config: {
      // `config.name` identifies the resolved config object (debugging / overrides).
      // The preset *key* (`auth`) is what routes use in `meta.layout`.
      name: 'auth',
      header: {
        type: 'minimal',
        showNavigation: false,
        height: '3rem',
      },
      container: {
        maxWidth: '480px',
        centered: true,
        padding: '2rem',
      },
      footer: {
        show: false,
      },
    },
  },

  marketing: {
    name: 'Marketing Layout',
    description: 'Public pages with shared header and footer',
    config: {
      name: 'marketing',
      header: {
        type: 'standard',
        showNavigation: true,
        height: '4rem',
      },
      container: {
        maxWidth: '1200px',
        centered: true,
        padding: '2rem',
      },
      footer: {
        show: true,
        variant: 'standard',
      },
    },
  },

  app: {
    name: 'App Layout',
    description: 'Authenticated app chrome with navigation sidebar',
    config: {
      name: 'app',
      header: {
        type: 'minimal',
        showNavigation: true,
        title: 'AdaptiveAuth',
        height: '4rem',
      },
      sidebar: {
        position: 'left',
        width: '250px',
        collapsible: true,
        content: ['navigation'],
        variant: 'navigation',
      },
      container: {
        fullHeight: true,
        padding: '1.5rem',
      },
      footer: {
        show: false,
      },
    },
  },

  admin: {
    name: 'Admin Layout',
    description: 'Privileged areas with admin sidebar',
    config: {
      name: 'admin',
      header: {
        type: 'standard',
        color: '#6c757d',
        showNavigation: true,
        title: 'Admin',
        height: '4rem',
      },
      sidebar: {
        position: 'left',
        width: '280px',
        collapsible: true,
        content: ['navigation', 'filters'],
        variant: 'filters',
      },
      container: {
        fullHeight: true,
        padding: '1rem',
      },
      footer: {
        show: true,
        variant: 'minimal',
      },
    },
  },
}

export function getLayoutConfig(layoutName: string): LayoutConfig {
  const preset = layoutPresets[layoutName]
  if (preset)
    return preset.config

  console.warn(`Layout preset "${layoutName}" not found. Using marketing layout.`)
  return layoutPresets.marketing!.config
}

export function createLayoutConfig(overrides: Partial<LayoutConfig>): LayoutConfig {
  const baseConfig = getLayoutConfig('marketing')
  return {
    ...baseConfig,
    ...overrides,
    header: overrides.header ? { ...baseConfig.header, ...overrides.header } : baseConfig.header,
    sidebar: overrides.sidebar ? { ...overrides.sidebar } : undefined,
    container: overrides.container ? { ...baseConfig.container, ...overrides.container } : baseConfig.container,
    footer: overrides.footer ? { ...baseConfig.footer, ...overrides.footer } : baseConfig.footer,
  }
}
