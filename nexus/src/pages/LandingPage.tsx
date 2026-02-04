import { Link } from 'react-router-dom'
import { useRef, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { PricingSection } from '@/components/PricingSection'
// @NEXUS-FIX-090: Role-based avatar integration
import { Avatar } from '@/components/Avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Lazy load 3D background for performance
const BackgroundCube = lazy(() => import('@/components/BackgroundCube').then(m => ({ default: m.BackgroundCube })))
import {
  Zap,
  ArrowRight,
  Sparkles,
  Workflow,
  Bot,
  Shield,
  Globe,
  Play,
  Check,
  Star,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Database,
  Cloud,
  Users,
  BarChart3,
  Bell,
  Cpu,
  Layers,
  Menu,
  X,
} from 'lucide-react'

// Real App Logo Components - Accurate brand logos
function GmailLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Gmail M envelope icon */}
      <path d="M2 6C2 4.9 2.9 4 4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="0.5"/>
      <path d="M2 6L12 13L22 6" stroke="#EA4335" strokeWidth="0"/>
      <path d="M4 4L12 10.5L20 4" fill="#EA4335"/>
      <path d="M4 4V8L12 14L20 8V4" fill="#EA4335"/>
      <path d="M4 8V18H6V10L12 14.5L18 10V18H20V8L12 14L4 8Z" fill="#EA4335"/>
      <path d="M4 4H6V10L4 8V4Z" fill="#C5221F"/>
      <path d="M18 10V4H20V8L18 10Z" fill="#C5221F"/>
      <path d="M4 18V8L12 14L20 8V18H4Z" fill="#FBBC04" fillOpacity="0"/>
      <rect x="4" y="16" width="2" height="4" fill="#4285F4"/>
      <rect x="18" y="16" width="2" height="4" fill="#34A853"/>
    </svg>
  )
}

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Slack official logo */}
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.164 0a2.528 2.528 0 0 1 2.521 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.164 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.164 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.314A2.528 2.528 0 0 1 24 15.164a2.527 2.527 0 0 1-2.522 2.521h-6.314z" fill="#ECB22E"/>
    </svg>
  )
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Notion official logo - black on transparent */}
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#ffffff"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.11 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000000"/>
    </svg>
  )
}

function NexusAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#EC4899"/>
        </linearGradient>
      </defs>
      {/* Hexagon AI brain icon */}
      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="url(#nexusGradient)" fillOpacity="0.15"/>
      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="url(#nexusGradient)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* AI sparkle/brain nodes */}
      <circle cx="12" cy="9" r="1.5" fill="url(#nexusGradient)"/>
      <circle cx="9" cy="13" r="1.5" fill="url(#nexusGradient)"/>
      <circle cx="15" cy="13" r="1.5" fill="url(#nexusGradient)"/>
      <path d="M12 9L9 13M12 9L15 13M9 13L15 13" stroke="url(#nexusGradient)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

// App icons data for the floating animation
const floatingApps = [
  { icon: Mail, color: '#EA4335', name: 'Gmail', delay: 0 },
  { icon: MessageSquare, color: '#4A154B', name: 'Slack', delay: 0.5 },
  { icon: FileText, color: '#0066FF', name: 'Notion', delay: 1 },
  { icon: Calendar, color: '#4285F4', name: 'Calendar', delay: 1.5 },
  { icon: Database, color: '#FF9900', name: 'Database', delay: 2 },
  { icon: Cloud, color: '#00A4EF', name: 'Cloud', delay: 2.5 },
  { icon: Users, color: '#7C3AED', name: 'CRM', delay: 3 },
  { icon: BarChart3, color: '#10B981', name: 'Analytics', delay: 3.5 },
]

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Automation',
    description: 'Describe what you want in natural language and watch Nexus build your workflows automatically.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Workflow,
    title: '800+ Integrations',
    description: 'Connect to all your favorite apps including Gmail, Slack, Notion, Salesforce, and more.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance with SOC 2, GDPR, and regional data requirements.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Regional Intelligence',
    description: 'Built-in knowledge of regional business practices, currencies, and work schedules.',
    color: 'from-orange-500 to-red-500',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Operations Manager',
    company: 'TechFlow Inc',
    content: 'Nexus cut our manual processes by 80%. The AI understands exactly what we need.',
    avatar: 'SC',
    rating: 5,
  },
  {
    name: 'Ahmed Al-Rashid',
    role: 'CEO',
    company: 'Gulf Ventures',
    content: 'Finally, a platform that understands Kuwait business requirements out of the box.',
    avatar: 'AR',
    rating: 5,
  },
  {
    name: 'Maria Garcia',
    role: 'Product Lead',
    company: 'Innovate Labs',
    content: 'The workflow builder is intuitive, but the AI chat is where the magic happens.',
    avatar: 'MG',
    rating: 5,
  },
]

const stats = [
  { value: '800+', label: 'Integrations' },
  { value: '10M+', label: 'Workflows Run' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<1s', label: 'Avg Response' },
]

// Workflow steps for the hero visualization - using real app logos
const workflowSteps = [
  { id: 1, Logo: GmailLogo, label: 'New Email', app: 'Gmail', type: 'trigger', color: '#EA4335', bgColor: '#FEF3F2' },
  { id: 2, Logo: NexusAILogo, label: 'AI Analysis', app: 'Nexus AI', type: 'ai', color: '#8B5CF6', bgColor: '#F3E8FF' },
  { id: 3, Logo: NotionLogo, label: 'Create Doc', app: 'Notion', type: 'action', color: '#191919', bgColor: '#FFFFFF' },
  { id: 4, Logo: SlackLogo, label: 'Notify Team', app: 'Slack', type: 'action', color: '#4A154B', bgColor: '#F9F5FF' },
]

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

// Scroll-reveal section component
function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Workflow Node Component
function WorkflowNode({
  step,
  index,
  isActive,
}: {
  step: typeof workflowSteps[0]
  index: number
  isActive: boolean
}) {
  const Logo = step.Logo

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center"
    >
      {/* Connection line - hidden on mobile (2x2 grid) */}
      {index > 0 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7 + index * 0.15, duration: 0.4 }}
          className="hidden md:block absolute right-full top-10 -translate-y-1/2 w-16 h-0.5 origin-right"
          style={{
            background: `linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.8))`,
          }}
        >
          {/* Animated pulse on the line */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          />
        </motion.div>
      )}

      {/* Node - with real app logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isActive ? 'shadow-2xl' : ''
        }`}
        style={{
          backgroundColor: step.bgColor,
          borderColor: `${step.color}40`,
          borderWidth: '2px',
          boxShadow: isActive ? `0 0 40px ${step.color}40` : undefined,
        }}
      >
        {/* Glow ring when active */}
        {isActive && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
            style={{ borderColor: step.color, borderWidth: '2px' }}
          />
        )}

        {/* Real App Logo */}
        <Logo className="w-8 h-8 md:w-10 md:h-10" />
      </motion.div>

      {/* Label */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-white">{step.label}</p>
        <p className="text-xs text-surface-400">{step.app}</p>
      </div>

      {/* Type badge - positioned below label for cleaner look */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 + index * 0.15, duration: 0.3 }}
        className={`mt-2 px-3 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm ${
          step.type === 'trigger'
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 shadow-sm shadow-blue-500/10'
            : step.type === 'ai'
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 shadow-sm shadow-purple-500/10'
            : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10'
        }`}
      >
        {step.type}
      </motion.div>
    </motion.div>
  )
}

// Floating App Icon
function FloatingAppIcon({ app, index }: { app: typeof floatingApps[0]; index: number }) {
  const Icon = app.icon
  const positions = [
    { top: '10%', left: '5%' },
    { top: '20%', right: '8%' },
    { top: '40%', left: '3%' },
    { top: '60%', right: '5%' },
    { top: '75%', left: '8%' },
    { top: '85%', right: '10%' },
    { top: '30%', left: '92%' },
    { top: '55%', left: '95%' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ delay: 1 + app.delay * 0.2, duration: 0.5 }}
      className="absolute hidden lg:flex items-center justify-center w-12 h-12 rounded-xl backdrop-blur-sm border border-white/10 pointer-events-none"
      style={{
        ...positions[index],
        backgroundColor: `${app.color}20`,
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-6 h-6" style={{ color: app.color }} />
      </motion.div>
    </motion.div>
  )
}

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const heroRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])
  const orbY1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const orbY2 = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])

  const navLinks = [
    { href: '#features', label: t('landing.features.title', 'Features') },
    { href: '#how-it-works', label: t('landing.howItWorks.title', 'How it Works') },
    { href: '#testimonials', label: t('landing.testimonials.title', 'Testimonials') },
    { href: '#pricing', label: t('landing.pricing.title', 'Pricing') },
  ]

  return (
    <div className="min-h-screen bg-surface-950 overflow-hidden">
      {/* 3D Background Cube - Resend-style scroll-reactive animation */}
      <Suspense fallback={null}>
        <BackgroundCube />
      </Suspense>

      {/* Fixed Background with parallax */}
      <motion.div style={{ scale: bgScale }} className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-nexus-500/5 via-transparent to-accent-500/5" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </motion.div>

      {/* Animated gradient orbs with parallax */}
      <motion.div
        style={{ y: orbY1 }}
        className="fixed top-1/4 left-1/4 w-[800px] h-[800px] bg-nexus-500/8 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        style={{ y: orbY2 }}
        className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-500/8 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Floating app icons */}
      {floatingApps.map((app, index) => (
        <FloatingAppIcon key={app.name} app={app} index={index} />
      ))}

      {/* Navigation */}
      <nav className="relative z-50 sticky top-0 backdrop-blur-xl bg-surface-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center shadow-lg shadow-nexus-500/30 group-hover:shadow-nexus-500/50 transition-shadow">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">Nexus</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-surface-300 hover:text-white transition-colors text-sm">
                  {link.label}
                </a>
              ))}
            </div>

            <div className={`flex items-center gap-2 sm:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Language Toggle */}
              <LanguageSwitcher variant="toggle" showFlag={true} showNativeName={false} />

              <Link to="/dashboard" className="text-surface-300 hover:text-white transition-colors hidden sm:block text-sm">
                {t('auth.signIn', 'Sign in')}
              </Link>
              <Link to="/dashboard" className="hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary text-sm"
                >
                  {t('common.getStarted', 'Get Started Free')}
                </motion.button>
              </Link>
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-surface-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/5 bg-surface-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-surface-300 hover:text-white hover:bg-white/5 transition-all text-base"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                  {/* Mobile Language Toggle */}
                  <div className="px-4 py-2">
                    <LanguageSwitcher variant="toggle" showFlag={true} showNativeName={true} />
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-surface-300 hover:text-white hover:bg-white/5 transition-all text-base"
                  >
                    {t('auth.signIn', 'Sign in')}
                  </Link>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                    <button className="w-full btn-gradient py-3 text-base">
                      {t('common.getStarted', 'Get Started Free')}
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center pt-20 pb-32">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="w-full relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Text content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm text-surface-300">{t('landing.hero.badge', 'AI-Powered Workflow Automation')}</span>
                </motion.div>

                <motion.h1 variants={fadeInUp} className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 ${isRTL ? 'text-right' : ''}`}>
                  <span className="text-white">{t('landing.hero.headline', 'Let me handle the boring stuff')}</span>
                  <br />
                  <span className="gradient-text">{t('landing.hero.headlineHighlight', 'You focus on what matters')}</span>
                </motion.h1>

                <motion.p variants={fadeInUp} className={`text-lg md:text-xl text-surface-400 mb-10 max-w-xl leading-relaxed ${isRTL ? 'text-right' : ''}`}>
                  {t('landing.hero.subheadline', 'Describe what you want in plain English. Nexus AI understands your intent and builds production-ready automations instantly.')}
                </motion.p>

                <motion.div variants={fadeInUp} className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <Link to="/chat">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`btn-gradient text-base px-8 py-4 w-full sm:w-auto ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {t('landing.cta.button', 'Start Building Free')}
                      <ArrowRight className={`w-5 h-5 inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Play className="w-5 h-5" />
                    {isRTL ? 'شاهد العرض' : 'Watch Demo'}
                  </motion.button>
                </motion.div>

                <motion.div variants={fadeInUp} className={`mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-surface-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('landing.cta.noCard', 'No credit card required')}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('landing.features.integrationsCount', '800+ integrations')}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('landing.hero.instantSetup', '5 min setup')}</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Workflow Visualization */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative"
              >
                {/* Main workflow card */}
                <div className="relative bg-gradient-to-br from-surface-800/80 to-surface-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Email Intelligence Workflow</h3>
                        <p className="text-xs text-surface-400">Automatically process and route emails</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Workflow nodes - 2x2 grid on mobile, horizontal on desktop - Force LTR for workflow visualization */}
                  <div className="grid grid-cols-2 md:flex md:items-center md:justify-between gap-6 md:gap-4 pt-4 pb-4" dir="ltr">
                    {workflowSteps.map((step, index) => (
                      <WorkflowNode
                        key={step.id}
                        step={step}
                        index={index}
                        isActive={index === 1}
                      />
                    ))}
                  </div>

                  {/* Stats bar */}
                  <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">2.4K</p>
                      <p className="text-xs text-surface-400">Runs today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">99.8%</p>
                      <p className="text-xs text-surface-400">Success rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">~4h</p>
                      <p className="text-xs text-surface-400">Saved daily</p>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards - hidden on mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="hidden sm:block absolute -bottom-6 -left-6 bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Workflow deployed!</p>
                      <p className="text-xs text-surface-400">Just now</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="hidden sm:block absolute -top-4 -right-4 bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">+847 runs this week</p>
                      <p className="text-xs text-surface-400">↑ 23% vs last week</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section with scroll reveal */}
      <RevealSection className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-surface-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Nexus Chat Hero Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-500/10 border border-nexus-500/20 mb-6 text-sm text-nexus-400">
                <MessageSquare className="w-4 h-4" />
                AI-Powered Chat Interface
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Just tell Nexus what you need
              </h2>
              <p className="text-xl text-surface-400 max-w-2xl mx-auto">
                Describe your automation in plain English. Nexus builds it instantly.
              </p>
            </div>

            {/* Chat Interface Preview */}
            <Link to="/chat" className="block group">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative bg-gradient-to-br from-surface-800/90 to-surface-900/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-nexus-500/10 group-hover:border-nexus-500/30 transition-all"
              >
                {/* Chat Header - @NEXUS-FIX-090 with Avatar */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-surface-800/50">
                  <Avatar
                    role="default"
                    size="sm"
                    state="idle"
                    showName={false}
                    showTitle={false}
                  />
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      Nexus Chat
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Online</span>
                    </h3>
                    <p className="text-xs text-surface-400">Your AI workflow assistant</p>
                  </div>
                </div>

                {/* Chat Messages Preview */}
                <div className="p-6 space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-nexus-500/20 border border-nexus-500/30 rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-white text-sm">When I get an email from a client, analyze it and create a task in Notion, then notify me on Slack</p>
                    </div>
                  </div>

                  {/* Nexus response - @NEXUS-FIX-090 with Avatar */}
                  <div className="flex gap-3">
                    <Avatar
                      role="default"
                      size="sm"
                      state="idle"
                      showName={false}
                      showTitle={false}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-surface-700/50 border border-white/5 rounded-2xl rounded-tl-md px-4 py-3">
                        <p className="text-surface-300 text-sm mb-3">Perfect! I'll create a workflow that:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center">
                              <GmailLogo className="w-4 h-4" />
                            </div>
                            <span className="text-surface-300">Triggers on new client emails</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-surface-300">Analyzes content with AI</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-md bg-surface-600 flex items-center justify-center">
                              <NotionLogo className="w-4 h-4" />
                            </div>
                            <span className="text-surface-300">Creates task in Notion</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                              <SlackLogo className="w-4 h-4" />
                            </div>
                            <span className="text-surface-300">Sends Slack notification</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input Preview */}
                <div className="px-6 pb-6">
                  <div className="relative">
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl group-hover:border-nexus-500/30 transition-colors">
                      <MessageSquare className="w-5 h-5 text-surface-500" />
                      <span className="flex-1 text-surface-500 text-sm">Describe your workflow...</span>
                      <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-surface-400 bg-surface-800 border border-surface-600 rounded">Enter</kbd>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-8 h-8 rounded-lg bg-gradient-to-r from-nexus-500 to-accent-500 flex items-center justify-center"
                        >
                          <ArrowRight className="w-4 h-4 text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover overlay CTA */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-nexus-500 to-accent-500 text-white font-semibold shadow-lg shadow-nexus-500/30"
                  >
                    <Sparkles className="w-5 h-5" />
                    Try Nexus Chat
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            </Link>

            {/* Example Prompts */}
            <div className="mt-8 text-center">
              <p className="text-sm text-surface-500 mb-4">Try these examples:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  'Send me a daily email summary of my calendar',
                  'Create Jira tickets from Slack messages',
                  'Sync new leads to Google Sheets',
                ].map((prompt, i) => (
                  <Link key={i} to="/chat">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-sm bg-surface-800/80 text-surface-300 rounded-lg border border-surface-700/50 hover:border-nexus-500/30 hover:text-white transition-all"
                    >
                      "{prompt}"
                    </motion.button>
                  </Link>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 text-sm text-surface-300">
              <Layers className="w-4 h-4" />
              {t('landing.howItWorks.subtitle', 'Simple 3-Step Process')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('landing.howItWorks.title', 'How Nexus works')}
            </h2>
            <p className="text-xl text-surface-400 max-w-2xl mx-auto">
              {isRTL ? 'من الفكرة إلى الأتمتة في أقل من دقيقة' : 'From idea to automation in under a minute'}
            </p>
          </RevealSection>

          <div className={`grid md:grid-cols-3 gap-8 ${isRTL ? 'md:grid-flow-col-dense' : ''}`}>
            {[
              {
                step: '01',
                title: t('landing.howItWorks.step1.title', 'Share your goal'),
                description: t('landing.howItWorks.step1.description', 'Chat with Nexus about any challenge. AI optimizes workflows for your unique workplace.'),
                icon: MessageSquare,
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                step: '02',
                title: t('landing.howItWorks.step2.title', 'Nexus builds it'),
                description: t('landing.howItWorks.step2.description', 'AI understands your intent and creates the perfect workflow automatically.'),
                icon: Cpu,
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: t('landing.howItWorks.step3.title', 'Go live instantly'),
                description: t('landing.howItWorks.step3.description', 'One click to deploy. Your automation runs 24/7.'),
                icon: Zap,
                gradient: 'from-emerald-500 to-teal-500',
              },
            ].map((item, index) => (
              <RevealSection key={index}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-surface-800/50 to-surface-900/50 border border-white/5 group"
                >
                  {/* Step number */}
                  <span className="absolute top-6 right-6 text-6xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                    {item.step}
                  </span>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-surface-400 leading-relaxed">{item.description}</p>

                  {/* Connection line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-surface-600 to-transparent" />
                  )}
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('landing.features.title', 'Everything you need to automate')}
            </h2>
            <p className="text-xl text-surface-400 max-w-2xl mx-auto">
              {t('landing.features.subtitle', 'Nexus combines AI intelligence with powerful automation tools to transform how you work.')}
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <RevealSection key={index}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-3xl bg-gradient-to-br from-surface-800/50 to-surface-900/50 border border-white/5 group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-surface-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('landing.testimonials.title', 'Loved by teams worldwide')}
            </h2>
            <p className="text-xl text-surface-400">
              {t('landing.testimonials.subtitle', 'Join thousands of companies automating with Nexus')}
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <RevealSection key={index}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-3xl bg-gradient-to-br from-surface-800/50 to-surface-900/50 border border-white/5"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-surface-300 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center text-sm font-semibold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-sm text-surface-400">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('landing.pricing.title', 'Simple, transparent pricing')}
            </h2>
            <p className="text-xl text-surface-400">
              {t('landing.pricing.subtitle', 'Start free, scale as you grow')}
            </p>
          </RevealSection>
          <RevealSection>
            <PricingSection />
          </RevealSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6">
          <RevealSection>
            <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-nexus-500/20 via-accent-500/10 to-purple-500/20" />
              <div className="absolute inset-0 backdrop-blur-3xl" />
              <div className="absolute inset-0 border border-white/10 rounded-3xl" />

              {/* Animated glow */}
              <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-nexus-500/10 via-transparent to-accent-500/10 rounded-3xl"
              />

              <div className="relative text-center" dir={isRTL ? 'rtl' : 'ltr'}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {t('landing.cta.title', 'Ready to automate?')}
                  </h2>
                  <p className="text-xl text-surface-300 mb-8 max-w-xl mx-auto">
                    {isRTL
                      ? 'ابدأ ببناء سير العمل الذكي في دقائق، وليس أشهر. مجاني للأفراد إلى الأبد.'
                      : 'Start building intelligent workflows in minutes, not months. Free forever for individuals.'}
                  </p>
                  <Link to="/chat">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-gradient text-lg px-10 py-4"
                    >
                      {t('landing.cta.button', 'Get Started for Free')}
                      <ArrowRight className={`w-5 h-5 inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-white/5" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex flex-col items-center gap-6 text-center md:flex-row md:justify-between ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">{t('app.name', 'Nexus')}</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-surface-400">
              <a href="#" className="hover:text-white transition-colors">{t('landing.footer.privacy', 'Privacy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('landing.footer.terms', 'Terms')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('landing.footer.docs', 'Documentation')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('landing.footer.contact', 'Support')}</a>
            </div>
            <p className="text-surface-500 text-sm">
              © 2024 {t('app.name', 'Nexus')} AI. {t('landing.footer.copyright', 'All rights reserved')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
