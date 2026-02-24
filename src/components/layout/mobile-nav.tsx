'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  TrendingUp,
  BarChart3,
  Menu,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// Items shown in the Sheet menu (all sections)
const sheetNavItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/finances', label: 'Finanzas', icon: TrendingUp },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
]

// Items shown in the bottom tab bar (max 4 for spacing)
const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/finances', label: 'Finanzas', icon: TrendingUp },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header - Safe area support for notch devices */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 glass md:hidden safe-area-inset-top">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 no-select">
            NelaGlow
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú" className="touch-target">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 glass border-l border-white/20">
              <SheetHeader className="border-b border-white/20">
                <SheetTitle className="text-lg text-foreground">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navegación principal para dispositivos móviles
                </SheetDescription>
              </SheetHeader>
              <nav className="space-y-1 p-2">
                {sheetNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-muted-foreground hover:bg-white/50 hover:text-primary'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Safe area support for notch devices */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 glass md:hidden safe-area-inset-bottom">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] px-2 py-1 rounded-lg text-xs transition-all touch-active no-select',
                  isActive
                    ? 'text-primary font-bold scale-105'
                    : 'text-muted-foreground active:bg-white/20'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110 drop-shadow-[0_0_8px_var(--primary)]')} />
                <span className={cn(isActive && 'font-bold')}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
