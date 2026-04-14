/**
 * Collapsible SaaS sidebar — expands to 15rem, collapses to 3rem (icon-only).
 * State is persisted to localStorage. Tooltips appear automatically when collapsed.
 *
 * NOTE: We bypass @blinkdotnew/ui <Sidebar> because it wraps all children in a
 * single overflow-y-auto div, making flex-1/shrink-0 on children no-ops.
 * This native flex-col implementation gives full layout control.
 */
import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  PanelLeft,
  Rocket,
  Plus,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { blink } from '../lib/blink'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
}

const NAV_ITEMS: NavItemDef[] = [
  { href: '/?view=dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
  { href: '/?view=campaigns', icon: <FileText className="h-4 w-4" />, label: 'Campaigns' },
  { href: '/?view=analytics', icon: <BarChart3 className="h-4 w-4" />, label: 'Analytics' },
  { href: '/?view=order', icon: <Rocket className="h-4 w-4" />, label: 'New Campaign' },
]

function NavItem({ item, collapsed, onClick }: { item: NavItemDef; collapsed: boolean; onClick?: () => void }) {
  const link = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors cursor-pointer',
        collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
        item.active
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function AppSidebarShell() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [blinkReady, setBlinkReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure blink is initialized
    const timer = setTimeout(() => {
      setBlinkReady(true)
      blink.auth.me().then(user => {
        setCurrentUser(user)
      }).catch(() => {
        // Not logged in
      }).finally(() => setLoading(false))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSignOut = useCallback(() => {
    if (!blinkReady) return
    blink.auth.logout()
  }, [blinkReady])

  const navigateTo = useCallback((href: string) => {
    // Navigate using query params that App.tsx uses
    window.location.href = href
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-background border-r border-border overflow-hidden',
          'transition-[width] duration-200 ease-linear shrink-0',
          collapsed ? 'w-[3rem]' : 'w-[15rem]'
        )}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-2 shrink-0 border-b border-border h-[52px] px-3',
            collapsed && 'justify-center px-2'
          )}
        >
          {!collapsed && (
            <>
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                A
              </div>
              <span className="flex-1 font-semibold text-sm truncate">App</span>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={toggle}
              >
                <PanelLeft
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    collapsed && 'rotate-180'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Nav (only this section scrolls) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          {!collapsed && (
            <p className="px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </p>
          )}
          {NAV_ITEMS.map(item => (
            <NavItem 
              key={item.href} 
              item={item} 
              collapsed={collapsed} 
              onClick={() => navigateTo(item.href)} 
            />
          ))}
        </div>

        {/* ── Footer (always pinned to bottom) ──────────── */}
        <div
          className={cn(
            'shrink-0 border-t border-border',
            collapsed ? 'flex flex-col items-center gap-1 p-2' : 'p-3 space-y-1'
          )}
        >
          {/* User row */}
          {loading && (
            <div className={cn('flex items-center justify-center', collapsed ? 'h-8' : 'px-2 py-1.5')}>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && currentUser && collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors cursor-pointer">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                      {currentUser.display_name?.[0] || currentUser.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{currentUser.display_name || currentUser.email}</TooltipContent>
            </Tooltip>
          )}
          {!loading && currentUser && !collapsed && (
            <button className="flex items-center gap-2 rounded-md hover:bg-accent transition-colors cursor-pointer w-full px-2 py-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {currentUser.display_name?.[0] || currentUser.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium leading-tight truncate">
                  {currentUser.display_name || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                  {currentUser.email}
                </p>
              </div>
            </button>
          )}
          {!loading && !currentUser && (
            <button 
              onClick={() => navigateTo('#/order')}
              className={cn(
                'flex items-center gap-2 rounded-md hover:bg-accent transition-colors cursor-pointer w-full',
                collapsed ? 'justify-center h-8 w-8 mx-auto' : 'px-2 py-1.5'
              )}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-muted">?</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium leading-tight truncate">Sign In</p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">
                    Click to login
                  </p>
                </div>
              )}
            </button>
          )}

          {/* Sign out */}
          {currentUser && collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          )}
          {currentUser && !collapsed && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </Button>
          )}
          {!currentUser && !collapsed && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('/?view=order')}
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-foreground"
            >
              <Rocket className="h-4 w-4 shrink-0" />
              Get Started
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
