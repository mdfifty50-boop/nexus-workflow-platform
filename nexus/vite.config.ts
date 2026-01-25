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
          // All other node_modules go into main vendor chunk
          // This avoids circular dependency issues with React
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
    // CORS configuration - explicit origins only (no wildcards)
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4567',
        changeOrigin: true,
      },
    },
  },
  // Preview server (for production builds served locally)
  preview: {
    headers: securityHeaders,
    cors: {
      origin: ['http://localhost:4173', 'http://127.0.0.1:4173'],
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
