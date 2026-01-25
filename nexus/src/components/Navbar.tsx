import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { useRTL } from './RTLProvider'
import { Breadcrumb } from './Breadcrumb'

// Custom hook for body scroll lock on mobile menu
function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isLocked])
}

// Navigation icons as SVG components for better visual consistency
const NavIcons = {
  chat: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  workflows: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  templates: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  integrations: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  signOut: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

export function Navbar() {
  const { t } = useTranslation()
  const { isRTL } = useRTL()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Touch gesture tracking for swipe-to-close
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Lock body scroll when mobile menu is open
  useBodyScrollLock(mobileMenuOpen)

  // Handle mobile menu open/close with animation
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }
  }, [mobileMenuOpen, closeMobileMenu, openMobileMenu])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      // Don't close mobile menu when clicking hamburger button
      if (mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target as Node) &&
          hamburgerRef.current &&
          !hamburgerRef.current.contains(event.target as Node)) {
        closeMobileMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeMobileMenu])

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu()
    setUserMenuOpen(false)
  }, [location.pathname, closeMobileMenu])

  // Swipe-to-close gesture support for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isDragging.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return

      const touchCurrentX = e.touches[0].clientX
      const touchCurrentY = e.touches[0].clientY
      const deltaX = touchCurrentX - touchStartX.current
      const deltaY = touchCurrentY - touchStartY.current

      // Detect horizontal swipe (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isDragging.current = true
      }

      // If swiping right (closing direction), apply transform with resistance
      if (isDragging.current && deltaX > 0 && mobileMenuRef.current) {
        // Add resistance as user swipes further
        const resistance = Math.min(deltaX * 0.7, 300)
        mobileMenuRef.current.style.transform = `translateX(${resistance}px)`
        mobileMenuRef.current.style.transition = 'none'
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current || !mobileMenuRef.current) {
        touchStartX.current = 0
        touchStartY.current = 0
        return
      }

      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX.current

      // Reset transform with transition
      mobileMenuRef.current.style.transition = ''
      mobileMenuRef.current.style.transform = ''

      // If swiped more than 80px to the right, close menu
      if (deltaX > 80) {
        closeMobileMenu()
      }

      touchStartX.current = 0
      touchStartY.current = 0
      isDragging.current = false
    }

    const menuElement = mobileMenuRef.current
    if (menuElement) {
      menuElement.addEventListener('touchstart', handleTouchStart, { passive: true })
      menuElement.addEventListener('touchmove', handleTouchMove, { passive: true })
      menuElement.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        menuElement.removeEventListener('touchstart', handleTouchStart)
        menuElement.removeEventListener('touchmove', handleTouchMove)
        menuElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [mobileMenuOpen, closeMobileMenu])

  // Check if path is active (exact match or starts with for nested routes)
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (path === '/workflows') {
      return location.pathname === '/workflows' || location.pathname.startsWith('/workflows/')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Primary navigation items (cleaner list per requirements)
  const navLinks = [
    { path: '/chat-demo', label: 'Chat with Nexus', icon: NavIcons.chat },
    { path: '/dashboard', labelKey: 'navigation.dashboard', icon: NavIcons.dashboard },
    { path: '/workflows', label: 'My Workflows', icon: NavIcons.workflows },
    { path: '/templates', labelKey: 'navigation.templates', icon: NavIcons.templates },
    { path: '/integrations', label: 'Connected Apps', icon: NavIcons.integrations },
    { path: '/settings', labelKey: 'navigation.settings', icon: NavIcons.settings },
  ]

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    if (signOut) await signOut()
    navigate('/login')
  }

  const handleBack = () => {
    navigate(-1)
  }

  // Determine if we should show back button (not on dashboard or root-level pages)
  const showBackButton = location.pathname !== '/dashboard' &&
    (location.pathname.includes('/') && location.pathname.split('/').filter(Boolean).length > 1)

  return (
    <>
      <nav
        id="main-navigation"
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className={`flex items-center justify-between h-12 sm:h-14 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Left section: Logo + Back button */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Back button for nested pages - 44px minimum touch target */}
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className={`min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center touch-manipulation active:scale-95 ${isRTL ? 'rotate-180' : ''}`}
                  aria-label={t('common.back')}
                >
                  {NavIcons.back}
                </button>
              )}

              {/* Logo - smaller on mobile */}
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                aria-label="Nexus - Go to dashboard"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <span className="text-white font-bold text-xs sm:text-sm">N</span>
                </div>
                <span className="text-white font-bold text-base sm:text-lg hidden sm:block">{t('app.name')}</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className={`hidden md:flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {navLinks.map(link => {
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${active
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={active ? 'text-cyan-400' : ''}>{link.icon}</span>
                    <span>{link.labelKey ? t(link.labelKey) : link.label}</span>
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right section: User avatar + Mobile menu button */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* User Avatar Dropdown - 44px minimum touch target */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all min-h-[44px] touch-manipulation active:scale-95
                    ${userMenuOpen || isActive('/profile') ? 'bg-slate-800' : 'hover:bg-slate-800'}
                  `}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="relative">
                    <ProfessionalAvatar agentId="nexus" size={32} />
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>
                  <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">
                    {user?.email?.split('@')[0] || t('auth.user')}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className={`
                      absolute top-full mt-2 w-56 py-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl
                      ${isRTL ? 'left-0' : 'right-0'}
                    `}
                    role="menu"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.email?.split('@')[0] || t('auth.user')}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className={`flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors touch-manipulation ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                      role="menuitem"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      className={`flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors touch-manipulation ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                      role="menuitem"
                    >
                      {NavIcons.settings}
                      <span>{t('navigation.settings')}</span>
                    </Link>

                    <div className="border-t border-slate-700 mt-2 pt-2">
                      <button
                        onClick={handleSignOut}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 min-h-[44px] text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors touch-manipulation ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                        role="menuitem"
                      >
                        {NavIcons.signOut}
                        <span>{t('auth.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle - Always accessible hamburger - 44px minimum touch target */}
              <button
                ref={hamburgerRef}
                onClick={toggleMobileMenu}
                className={`
                  md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg transition-all duration-200 z-[60] flex items-center justify-center touch-manipulation active:scale-95
                  ${mobileMenuOpen
                    ? 'text-white bg-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-drawer"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <div className="relative w-5 h-5">
                  {/* Animated hamburger to X */}
                  <span
                    className={`absolute left-0 block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'top-2.5 rotate-45' : 'top-1'
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-2.5 block w-5 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'opacity-0 translate-x-2' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`absolute left-0 block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'top-2.5 -rotate-45' : 'top-4'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb bar - shows on nested pages */}
        {showBackButton && (
          <div className="bg-slate-900/80 border-t border-slate-800 px-4 sm:px-6 py-2">
            <div className="max-w-7xl mx-auto">
              <Breadcrumb />
            </div>
          </div>
        )}

        {/* Mobile Menu Drawer - Slide from right with smooth animation */}
        <div
          id="mobile-menu-drawer"
          ref={mobileMenuRef}
          className={`
            md:hidden fixed inset-y-0 right-0 w-full max-w-sm
            bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/50
            shadow-2xl shadow-black/50
            transform transition-transform duration-300 ease-out
            z-50 overflow-y-auto overscroll-contain
            ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={{
            paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          aria-hidden={!mobileMenuOpen}
        >
          <div className="px-4 py-6 space-y-2">
            {/* User info at top of mobile menu */}
            <div className="flex items-center gap-3 p-4 mb-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="relative">
                <ProfessionalAvatar agentId="nexus" size={48} />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {user?.email?.split('@')[0] || t('auth.user')}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'Not signed in'}</p>
              </div>
            </div>

            {/* Navigation Links with staggered animation */}
            {navLinks.map((link, index) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium
                    transition-all duration-200 active:scale-[0.98]
                    ${active
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700'
                    }
                    ${isRTL ? 'flex-row-reverse text-right border-l-0 border-r-4' : ''}
                  `}
                  style={{
                    transitionDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(20px)'
                  }}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMobileMenu}
                >
                  <span className={`p-2 rounded-lg transition-colors ${active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                    {link.icon}
                  </span>
                  <span>{link.labelKey ? t(link.labelKey) : link.label}</span>
                  {active && (
                    <span className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Create Workflow CTA in mobile menu */}
            <div className="pt-6 border-t border-slate-700/50 mt-6">
              <Link
                to="/workflow-demo"
                className="flex items-center justify-center gap-2 w-full px-4 py-4 rounded-xl text-base font-bold
                  bg-gradient-to-r from-cyan-500 to-purple-500 text-white
                  shadow-lg shadow-cyan-500/30
                  active:scale-[0.98] transition-transform"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('common.create')} Workflow</span>
              </Link>
            </div>

            {/* Sign out button */}
            <div className="pt-4">
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}
              >
                <span className="p-2 rounded-lg bg-red-500/10">
                  {NavIcons.signOut}
                </span>
                <span>{t('auth.signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay with blur for mobile menu */}
      <div
        className={`
          md:hidden fixed inset-0 z-40
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
    </>
  )
}
