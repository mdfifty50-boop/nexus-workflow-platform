/**
 * TemplateCard Component
 *
 * Individual template card for the marketplace grid.
 * Displays template information with preview and action buttons.
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ProfessionalAvatar } from '@/components/ProfessionalAvatar'
import { CategoryDisplay, PriceTier } from '@/lib/marketplace'
import type { MarketplaceTemplate } from '@/lib/marketplace'

// =============================================================================
// TYPES
// =============================================================================

interface TemplateCardProps {
  template: MarketplaceTemplate
  onUse: (template: MarketplaceTemplate) => void
  onPreview: (template: MarketplaceTemplate) => void
  isFavorited?: boolean
  onToggleFavorite?: (templateId: string) => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

// =============================================================================
// PRICE BADGE COMPONENT
// =============================================================================

function PriceBadge({ pricing }: { pricing: MarketplaceTemplate['pricing'] }) {
  if (pricing.tier === PriceTier.FREE) {
    return (
      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
        FREE
      </span>
    )
  }

  if (pricing.tier === PriceTier.ENTERPRISE) {
    return (
      <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
        ENTERPRISE
      </span>
    )
  }

  return (
    <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs font-medium border border-amber-500/30">
      ${pricing.price}/mo
    </span>
  )
}

// =============================================================================
// RATING STARS COMPONENT
// =============================================================================

function RatingStars({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < fullStars
                ? 'text-amber-400'
                : i === fullStars && hasHalfStar
                ? 'text-amber-400/50'
                : 'text-slate-600'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs text-slate-400">
        {rating.toFixed(1)} ({reviewCount.toLocaleString()})
      </span>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TemplateCard({
  template,
  onUse,
  onPreview,
  isFavorited = false,
  onToggleFavorite,
  variant = 'default',
  className = '',
}: TemplateCardProps) {
  // isHovered kept for potential future hover-dependent animations
  const [, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const categoryInfo = CategoryDisplay[template.category]

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(template.id)
  }, [onToggleFavorite, template.id])

  const handleUseClick = useCallback(() => {
    onUse(template)
  }, [onUse, template])

  const handlePreviewClick = useCallback(() => {
    onPreview(template)
  }, [onPreview, template])

  // Compact variant for smaller displays
  if (variant === 'compact') {
    return (
      <div
        className={`
          bg-slate-800/50 rounded-xl border border-slate-700/50 p-4
          hover:border-cyan-500/50 transition-all cursor-pointer group
          ${className}
        `}
        onClick={handlePreviewClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl flex-shrink-0">
            {template.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
              {template.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {template.stats.downloads.toLocaleString()} downloads
              </span>
              <span className="text-amber-400 text-xs">★ {template.stats.rating}</span>
            </div>
          </div>
          <PriceBadge pricing={template.pricing} />
        </div>
      </div>
    )
  }

  // Featured variant with larger preview
  if (variant === 'featured') {
    return (
      <div
        className={`
          bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl
          border border-cyan-500/30 overflow-hidden
          hover:border-cyan-500/50 transition-all group
          ${className}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Preview Image */}
        {template.previewImageUrl && !imageError ? (
          <div className="relative h-40 bg-slate-900">
            <img
              src={template.previewImageUrl}
              alt={template.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
            <span className="text-6xl">{template.icon}</span>
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-white text-lg">{template.name}</h3>
                {template.isNew && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    NEW
                  </span>
                )}
              </div>
              <RatingStars rating={template.stats.rating} reviewCount={template.stats.reviewCount} />
            </div>
            <PriceBadge pricing={template.pricing} />
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{template.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-cyan-400">{template.estimatedTimeSaved}</div>
              <div className="text-xs text-slate-500">Saved</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-emerald-400">{template.successRate}%</div>
              <div className="text-xs text-slate-500">Success</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-purple-400">{template.stats.downloads.toLocaleString()}</div>
              <div className="text-xs text-slate-500">Downloads</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handlePreviewClick} variant="outline" size="sm" className="flex-1">
              Preview
            </Button>
            <Button onClick={handleUseClick} size="sm" className="flex-1">
              Use Template
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={`
        bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden
        hover:border-cyan-500/50 transition-all group
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
              {template.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{template.name}</h3>
                {template.isNew && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    NEW
                  </span>
                )}
              </div>
              {/* Category Badge */}
              {categoryInfo && (
                <span
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1
                    bg-${categoryInfo.color}-500/20 text-${categoryInfo.color}-400
                    border border-${categoryInfo.color}-500/30
                  `}
                  style={{
                    backgroundColor: `rgb(var(--${categoryInfo.color}-500) / 0.2)`,
                  }}
                >
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              )}
              <RatingStars rating={template.stats.rating} reviewCount={template.stats.reviewCount} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteClick}
                className={`
                  p-2 rounded-lg transition-all
                  ${isFavorited
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700'}
                `}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg
                  className="w-5 h-5"
                  fill={isFavorited ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            )}
            <PriceBadge pricing={template.pricing} />
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{template.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-cyan-400">{template.estimatedTimeSaved}</div>
            <div className="text-xs text-slate-500">Saved</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-emerald-400">{template.successRate}%</div>
            <div className="text-xs text-slate-500">Success</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-purple-400">{template.steps}</div>
            <div className="text-xs text-slate-500">Steps</div>
          </div>
        </div>

        {/* Agents */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center -space-x-2">
            {template.agents.slice(0, 3).map((agent, i) => (
              <div key={agent} className="relative" style={{ zIndex: 3 - i }}>
                <ProfessionalAvatar agentId={agent} size={28} />
              </div>
            ))}
            {template.agents.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 border border-slate-600">
                +{template.agents.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {template.stats.downloads.toLocaleString()} downloads
          </span>
        </div>

        {/* Integrations */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.integrations.slice(0, 4).map(integration => (
            <span key={integration} className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
              {integration}
            </span>
          ))}
          {template.integrations.length > 4 && (
            <span className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
              +{template.integrations.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex gap-2">
        <Button
          onClick={handlePreviewClick}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Preview
        </Button>
        <Button onClick={handleUseClick} size="sm" className="flex-1">
          Use Template
        </Button>
      </div>
    </div>
  )
}

export default TemplateCard
