/**
 * UX Demo Component
 * Demonstrates all 5 major UX improvements implemented
 */

import { useState } from 'react'
import { Button } from './ui/button'
import { FormInput, FormTextarea } from './ui/form-input'
import { LoadingSpinner, LoadingOverlay, Skeleton, ProgressBar } from './ui/loading-state'
import { Toast } from './ui/toast'

export function UXDemo() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [description, setDescription] = useState('')
  const [showLoading, setShowLoading] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([])

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required')
      setEmailSuccess(false)
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Invalid email format')
      setEmailSuccess(false)
      return false
    }
    setEmailError('')
    setEmailSuccess(true)
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (value) {
      validateEmail(value)
    } else {
      setEmailError('')
      setEmailSuccess(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }

  const simulateProgress = () => {
    setShowProgress(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setShowProgress(false)
          showToast('Process completed!', 'success')
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const simulateLoading = () => {
    setShowLoading(true)
    setTimeout(() => {
      setShowLoading(false)
      showToast('Loading complete!', 'success')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Toast Container */}
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${80 + index * 70}px` }}
          className="absolute right-4 z-[100]"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        </div>
      ))}

      {/* Loading Overlay */}
      {showLoading && <LoadingOverlay message="Processing your request..." />}

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">UX Improvements Demo</h1>
          <p className="text-muted-foreground">
            Showcasing 5 major UX enhancements for seamless user experience
          </p>
        </div>

        {/* IMPROVEMENT #1: Enhanced card interactions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Enhanced Card Interactions</h2>
          <p className="text-muted-foreground">Hover over cards to see smooth animations and transitions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-card border border-border rounded-lg transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    Card {i}
                  </h3>
                  <div className="text-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    ⭐
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Interactive card with smooth hover effects and visual feedback
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* IMPROVEMENT #2: Toast notifications */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Toast Notifications</h2>
          <p className="text-muted-foreground">Clear feedback for user actions</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => showToast('Success! Operation completed', 'success')} variant="default">
              Success Toast
            </Button>
            <Button onClick={() => showToast('Error! Something went wrong', 'error')} variant="destructive">
              Error Toast
            </Button>
            <Button onClick={() => showToast('Warning! Please review', 'warning')} variant="outline">
              Warning Toast
            </Button>
            <Button onClick={() => showToast('Info: Processing request', 'info')} variant="secondary">
              Info Toast
            </Button>
          </div>
        </section>

        {/* IMPROVEMENT #3: Loading states */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Loading States</h2>
          <p className="text-muted-foreground">Consistent loading experiences across the application</p>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <span className="text-muted-foreground">Various spinner sizes</span>
            </div>
            <div className="space-y-2">
              <Button onClick={simulateLoading}>Show Loading Overlay</Button>
              <Button onClick={simulateProgress} variant="secondary">Simulate Progress</Button>
            </div>
            {showProgress && (
              <ProgressBar progress={progress} showLabel />
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Skeleton Loading:</p>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* IMPROVEMENT #4: Form inputs with validation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Enhanced Form Inputs</h2>
          <p className="text-muted-foreground">Visual validation feedback and clear error states</p>
          <div className="space-y-6 max-w-md">
            <FormInput
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              success={emailSuccess}
              helperText="Enter a valid email address"
              placeholder="you@example.com"
              required
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />
            <FormTextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Describe your automation needs"
              placeholder="Tell us what you want to automate..."
              rows={4}
              maxLength={500}
              showCount
            />
          </div>
        </section>

        {/* IMPROVEMENT #5: Smooth transitions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Smooth Transitions & Animations</h2>
          <p className="text-muted-foreground">CSS animations for micro-interactions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary rounded-full animate-scale-in mb-2" />
              <p className="text-sm">Scale In</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-secondary rounded-full animate-shake mb-2" />
              <p className="text-sm">Shake</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-accent rounded-full animate-fade-in mb-2" />
              <p className="text-sm">Fade In</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary rounded-full animate-bounce-subtle mb-2" />
              <p className="text-sm">Bounce</p>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Summary of UX Improvements</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span><strong>Enhanced Card Interactions:</strong> Smooth hover animations, visual feedback, and improved touch targets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span><strong>Toast Notifications:</strong> Clear feedback for success, error, warning, and info states</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span><strong>Loading States:</strong> Consistent loading experiences with spinners, progress bars, and skeletons</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span><strong>Form Validation:</strong> Real-time validation feedback with visual states and helpful error messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span><strong>Smooth Transitions:</strong> Micro-animations and page transitions for polished feel</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
