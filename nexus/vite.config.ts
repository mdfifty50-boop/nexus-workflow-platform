import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Check if running in analyze mode
const isAnalyze = process.env.npm_lifecycle_event === 'analyze' || process.argv.includes('--mode') && process.argv.includes('analyze')

// Security headers for development server
// Production headers are handled by Vercel (vercel.json) and API functions
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only active in analyze mode
    isAnalyze && visualizer({
      filename: 'dist/stats.html',
      open: true, // Auto-open in analyze mode
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Increase chunk size warning limit for better DX
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Simplified chunking to avoid circular dependencies
        // React and React-dependent libs must be in the same chunk
        manualChunks: (id) => {
          // Heavy libs that can be split safely (no React dependency issues)
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas'
          }
          if (id.includes('node_modules/@anthropic-ai')) {
            return 'vendor-anthropic'
          }
          if (id.includes('node_modules/dompurify')) {
            return 'vendor-sanitize'
          }
          // Animation libraries
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/@motionone')) {
            return 'vendor-animation'
          }
          // Icon library
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          // Date libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs')) {
            return 'vendor-dates'
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix'
          }
          // React core (react + react-dom + react-router)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
  },
  server: {
    // Security headers for dev server
    headers: securityHeaders,
    // CORS configuration - environment-aware origins
    // PRODUCTION FIX: Uses APP_URL in production, localhost in development
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            process.env.VITE_APP_URL || 'https://nexus.yourdomain.com',
            process.env.APP_URL || 'https://nexus.yourdomain.com',
          ].filter(Boolean)
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    proxy: {
      '/api': {
        target: process.env.API_SERVER_URL || 'http://localhost:4567',
        changeOrigin: true,
      },
    },
    // Allow ngrok tunnels for remote testing (production domains added dynamically)
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev',
      '.ngrok.io',
      ...(process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : []),
    ],
    // Exclude WhatsApp sessions folder from file watching to prevent constant reloads
    watch: {
      ignored: ['**/.whatsapp-sessions/**'],
    },
  },
  // Preview server (for production builds served locally)
  preview: {
    headers: securityHeaders,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.VITE_APP_URL, process.env.APP_URL].filter(Boolean) as string[]
        : ['http://localhost:4173', 'http://127.0.0.1:4173'],
      credentials: true,
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'zustand',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling to speed up dev startup
      'html2canvas',
      '@heygen/streaming-avatar',
    ],
  },
})
