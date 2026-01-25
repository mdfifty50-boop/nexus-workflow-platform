/**
 * OptimizedAvatar Component
 *
 * Simple avatar component that displays an image with optimized loading.
 */

import { useState } from 'react'

interface OptimizedAvatarProps {
  src: string
  alt: string
  size: number
  className?: string
}

export function OptimizedAvatar({ src, alt, size, className = '' }: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    // Fallback to initials if image fails to load
    const initials = alt
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div
        className={`bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}
