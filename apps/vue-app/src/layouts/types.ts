import type { Component } from 'vue'

export type NavGroup = 'public' | 'guest' | 'app' | 'admin'

export interface HeaderConfig {
  type: 'minimal' | 'standard' | 'hero'
  color?: string
  height?: string
  showNavigation?: boolean
  title?: string
  transparent?: boolean
}

export interface SidebarConfig {
  position: 'left' | 'right'
  width?: string
  collapsible?: boolean
  content: string[]
  variant?: 'navigation' | 'filters' | 'info'
}

export interface ContainerConfig {
  maxWidth?: string
  padding?: string
  centered?: boolean
  fullHeight?: boolean
  className?: string
}

export interface FooterConfig {
  show: boolean
  variant?: 'minimal' | 'standard' | 'extended'
  color?: string
}

export interface LayoutConfig {
  name: string
  header?: HeaderConfig
  sidebar?: SidebarConfig
  container?: ContainerConfig
  footer?: FooterConfig
  className?: string
}

export interface LayoutPreset {
  name: string
  config: LayoutConfig
  description?: string
}

export interface ResolvedLayouts {
  component?: Component
  config?: LayoutConfig
}

export interface NavLink {
  name: string
  path: string
  navGroup: NavGroup
  navOrder: number
}

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string | LayoutConfig
    requiresAuth?: boolean
    guestOnly?: boolean
    roles?: string[]
    title?: string
    showInNav?: boolean
    navGroup?: NavGroup
    navOrder?: number
  }
}
