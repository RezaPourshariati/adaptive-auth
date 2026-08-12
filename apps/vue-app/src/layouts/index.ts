import type { LayoutConfig, ResolvedLayouts } from './types'
import { defineAsyncComponent } from 'vue'
import { getLayoutConfig, layoutPresets } from './presets'

export const defaultLayout: string = 'marketing'

export const BaseLayout = defineAsyncComponent(() => import('./BaseLayout.vue'))

export function resolveLayout(layoutIdentifier: string | LayoutConfig | undefined): ResolvedLayouts {
  if (!layoutIdentifier) {
    return {
      component: BaseLayout,
      config: getLayoutConfig(defaultLayout),
    }
  }

  if (typeof layoutIdentifier === 'object') {
    return {
      component: BaseLayout,
      config: layoutIdentifier,
    }
  }

  if (layoutPresets[layoutIdentifier]) {
    return {
      component: BaseLayout,
      config: getLayoutConfig(layoutIdentifier),
    }
  }

  console.warn(`Layout "${layoutIdentifier}" not found. Using default layout.`)
  return {
    component: BaseLayout,
    config: getLayoutConfig(defaultLayout),
  }
}

export { buildNavLinks } from './nav-from-routes'
export { createLayoutConfig, getLayoutConfig, layoutPresets } from './presets'
export type { LayoutConfig, NavGroup, NavLink } from './types'
