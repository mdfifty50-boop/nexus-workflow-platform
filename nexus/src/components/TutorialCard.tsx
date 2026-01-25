import { useState } from 'react'
import OptimizedImage from '@/components/OptimizedImage'

// =============================================================================
// TUTORIAL CARD COMPONENT
// =============================================================================
// Displays video tutorial placeholders with "Coming Soon" state.
// Supports future video embedding when content becomes available.
// =============================================================================

interface TutorialCardProps {
  /** Title of the tutorial */
  title: string
  /** Brief description */
  description: string
  /** Duration in minutes */
  duration?: number
  /** Thumbnail image URL (optional) */
  thumbnail?: string
  /** Video URL when available */
  videoUrl?: string
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  /** Category/topic */
  category?: string
  /** Whether this tutorial is coming soon */
  comingSoon?: boolean
  /** Called when user wants to watch */
  onWatch?: () => void
}

export function TutorialCard({
  title,
  description,
  duration,
  thumbnail,
  videoUrl,
  difficulty = 'beginner',
  category,
  comingSoon = true,
  onWatch,
}: TutorialCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  const handleClick = () => {
    if (!comingSoon && videoUrl) {
      onWatch?.()
    }
  }

  return (
    <div
      className={`
        group relative bg-card border border-border rounded-xl overflow-hidden
        transition-all duration-300 hover:shadow-lg hover:border-primary/30
        ${comingSoon ? 'cursor-default' : 'cursor-pointer'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
        {thumbnail ? (
          <OptimizedImage
            src={thumbnail}
            alt={title}
            width={640}
            height={360}
            objectFit="cover"
            className="w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Coming Soon Overlay */}
        {comingSoon && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-primary">Coming Soon</span>
              </div>
              <p className="text-xs text-white/60">Video tutorial in development</p>
            </div>
          </div>
        )}

        {/* Play button overlay (for available videos) */}
        {!comingSoon && isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center transform scale-100 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
            {duration} min
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Difficulty */}
        <div className="flex items-center gap-2 mb-2">
          {category && (
            <span className="text-xs text-muted-foreground">{category}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>

      {/* Notify me button for coming soon */}
      {comingSoon && (
        <div className="px-4 pb-4">
          <button className="w-full py-2 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
            Notify me when available
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TUTORIAL SECTION COMPONENT
// =============================================================================

interface TutorialSectionProps {
  title: string
  description?: string
  tutorials: TutorialCardProps[]
}

export function TutorialSection({ title, description, tutorials }: TutorialSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial, index) => (
          <TutorialCard key={index} {...tutorial} />
        ))}
      </div>
    </section>
  )
}

// =============================================================================
// FEATURED TUTORIAL (Larger card for featured content)
// =============================================================================

interface FeaturedTutorialProps extends TutorialCardProps {
  /** Featured highlight text */
  highlight?: string
}

export function FeaturedTutorial({
  highlight = 'Featured',
  ...props
}: FeaturedTutorialProps) {
  return (
    <div className="relative">
      {/* Featured badge */}
      <div className="absolute -top-3 left-4 z-10">
        <span className="px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-full shadow-lg">
          {highlight}
        </span>
      </div>

      <div className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden shadow-lg shadow-primary/5">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Video preview */}
          <div className="relative aspect-video md:aspect-auto bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {props.comingSoon && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-full">
                  <span className="text-primary font-medium">Coming Soon</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              {props.category && (
                <span className="text-sm text-primary">{props.category}</span>
              )}
              {props.duration && (
                <span className="text-sm text-muted-foreground">
                  {props.duration} min
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">{props.title}</h3>
            <p className="text-muted-foreground mb-4">{props.description}</p>

            <button
              className={`
                w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-colors
                ${props.comingSoon
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }
              `}
              disabled={props.comingSoon}
            >
              {props.comingSoon ? 'Notify Me When Available' : 'Watch Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// DEFAULT TUTORIAL DATA
// =============================================================================

export const DEFAULT_TUTORIALS: TutorialCardProps[] = [
  {
    title: 'Getting Started with Nexus',
    description: 'Learn the basics of workflow automation and create your first workflow in minutes.',
    duration: 5,
    category: 'Getting Started',
    difficulty: 'beginner',
    comingSoon: true,
  },
  {
    title: 'Building Your First AI Workflow',
    description: 'Step-by-step guide to creating a workflow powered by AI agents.',
    duration: 12,
    category: 'AI Agents',
    difficulty: 'beginner',
    comingSoon: true,
  },
  {
    title: 'Connecting External Apps',
    description: 'Learn how to integrate Gmail, Slack, and other apps with your workflows.',
    duration: 8,
    category: 'Integrations',
    difficulty: 'beginner',
    comingSoon: true,
  },
  {
    title: 'Advanced Conditional Logic',
    description: 'Master branching, conditions, and complex workflow routing.',
    duration: 15,
    category: 'Advanced',
    difficulty: 'intermediate',
    comingSoon: true,
  },
  {
    title: 'API Integrations Deep Dive',
    description: 'Build custom API integrations for any service without code.',
    duration: 20,
    category: 'Integrations',
    difficulty: 'advanced',
    comingSoon: true,
  },
  {
    title: 'Workflow Templates Masterclass',
    description: 'Create reusable templates and share them with your team.',
    duration: 10,
    category: 'Templates',
    difficulty: 'intermediate',
    comingSoon: true,
  },
]
