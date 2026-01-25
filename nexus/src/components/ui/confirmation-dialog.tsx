/**
 * ConfirmationDialog Component - Mobile-friendly confirmation dialogs
 *
 * A specialized dialog for confirmations (delete, cancel, etc.)
 * with mobile-optimized button layout and accessibility.
 *
 * Features:
 * - Responsive: Dialog on desktop, bottom sheet on mobile
 * - Full-width buttons on mobile
 * - Destructive action styling
 * - Loading states
 * - Keyboard accessible
 */

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from './dialog'
import { Button } from './button'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Description/message explaining the action */
  description?: string
  /** Text for the confirm button */
  confirmText?: string
  /** Text for the cancel button */
  cancelText?: string
  /** Variant for the confirm button */
  variant?: 'default' | 'destructive' | 'warning'
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>
  /** Callback when user cancels */
  onCancel?: () => void
  /** Icon to display (optional) */
  icon?: React.ReactNode
  /** Additional content below description */
  children?: React.ReactNode
  /** Disable confirm until external condition is met */
  confirmDisabled?: boolean
}

// =============================================================================
// ICONS
// =============================================================================

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  icon,
  children,
  confirmDisabled = false
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Determine icon based on variant if not provided
  const displayIcon = icon ?? (
    variant === 'destructive' ? (
      <TrashIcon className="w-6 h-6" />
    ) : variant === 'warning' ? (
      <WarningIcon className="w-6 h-6" />
    ) : (
      <QuestionIcon className="w-6 h-6" />
    )
  )

  // Icon container styles based on variant
  const iconContainerStyles = {
    default: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/10 text-amber-500'
  }

  // Handle confirm action
  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Confirmation action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onConfirm, onOpenChange])

  // Handle cancel action
  const handleCancel = useCallback(() => {
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  // Button variant for confirm
  const confirmButtonVariant = variant === 'destructive' ? 'destructive' : 'default'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showHandle={true}>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                iconContainerStyles[variant]
              )}
            >
              {displayIcon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Additional content */}
        {children && <DialogBody className="py-4">{children}</DialogBody>}

        <DialogFooter stackOnMobile={true}>
          {/* Cancel button - shows first on mobile (due to flex-col-reverse) */}
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="min-h-[48px]"
          >
            {cancelText}
          </Button>

          {/* Confirm button */}
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            loading={isLoading}
            disabled={confirmDisabled || isLoading}
            className="min-h-[48px]"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// PRE-BUILT VARIANTS
// =============================================================================

interface DeleteConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

/**
 * DeleteConfirmation - Pre-styled delete confirmation dialog
 */
export function DeleteConfirmation({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  onCancel
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Keep"
      variant="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface DiscardChangesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
}

/**
 * DiscardChangesConfirmation - Pre-styled discard changes dialog
 */
export function DiscardChangesConfirmation({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: DiscardChangesProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Discard changes?"
      description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      confirmText="Discard"
      cancelText="Keep Editing"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface LogoutConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

/**
 * LogoutConfirmation - Pre-styled logout confirmation dialog
 */
export function LogoutConfirmation({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: LogoutConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out?"
      description="Are you sure you want to sign out of your account?"
      confirmText="Sign Out"
      cancelText="Stay Signed In"
      variant="default"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

// =============================================================================
// HOOK FOR EASY STATE MANAGEMENT
// =============================================================================

interface UseConfirmationOptions {
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<UseConfirmationOptions | null>(null)

  const confirm = useCallback((options: UseConfirmationOptions) => {
    setPendingAction(options)
    setIsOpen(true)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (pendingAction?.onConfirm) {
      await pendingAction.onConfirm()
    }
    setPendingAction(null)
  }, [pendingAction])

  const handleCancel = useCallback(() => {
    if (pendingAction?.onCancel) {
      pendingAction.onCancel()
    }
    setPendingAction(null)
  }, [pendingAction])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setPendingAction(null)
    }
  }, [])

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    confirm,
    handleConfirm,
    handleCancel
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ConfirmationDialog
