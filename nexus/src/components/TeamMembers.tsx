/**
 * TeamMembers Component
 *
 * Displays team members with online status and avatar initials fallback.
 */

import { useState, useMemo } from 'react'
import { OptimizedAvatar } from '@/components/OptimizedImage'

// =============================================================================
// TYPES
// =============================================================================

export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline'

export interface TeamMember {
  id: string
  name: string
  email: string
  role?: string
  avatarUrl?: string
  status: OnlineStatus
  lastSeen?: Date
}

export interface TeamMembersProps {
  /** List of team members */
  members: TeamMember[]
  /** Whether to show the search input */
  showSearch?: boolean
  /** Whether to show online status indicators */
  showStatus?: boolean
  /** Callback when a member is clicked */
  onMemberClick?: (member: TeamMember) => void
  /** Callback when invite button is clicked */
  onInvite?: () => void
  /** Display variant */
  variant?: 'list' | 'grid' | 'compact'
  /** Optional class name */
  className?: string
  /** Maximum members to show in compact mode */
  maxCompactDisplay?: number
  /** Loading state */
  loading?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TeamMembers({
  members,
  showSearch = true,
  showStatus = true,
  onMemberClick,
  onInvite,
  variant = 'list',
  className = '',
  maxCompactDisplay = 5,
  loading = false
}: TeamMembersProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase()
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.role?.toLowerCase().includes(query)
    )
  }, [members, searchQuery])

  // Sort by online status
  const sortedMembers = useMemo(() => {
    const statusOrder: Record<OnlineStatus, number> = {
      online: 0,
      busy: 1,
      away: 2,
      offline: 3
    }
    return [...filteredMembers].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    )
  }, [filteredMembers])

  // Count online members
  const onlineCount = members.filter((m) => m.status === 'online').length

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <CompactTeamMembers
        members={sortedMembers}
        maxDisplay={maxCompactDisplay}
        onMemberClick={onMemberClick}
        showStatus={showStatus}
        className={className}
      />
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {onlineCount} online, {members.length} total
          </p>
        </div>
        {onInvite && (
          <button
            onClick={onInvite}
            className="px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
          >
            + Invite
          </button>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {/* Members list */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              showStatus={showStatus}
              onClick={() => onMemberClick?.(member)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team members found
            </p>
          ) : (
            sortedMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                showStatus={showStatus}
                onClick={() => onMemberClick?.(member)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MEMBER ROW
// =============================================================================

interface MemberRowProps {
  member: TeamMember
  showStatus: boolean
  onClick?: () => void
}

function MemberRow({ member, showStatus, onClick }: MemberRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
    >
      <Avatar
        name={member.name}
        avatarUrl={member.avatarUrl}
        status={showStatus ? member.status : undefined}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{member.name}</span>
          {member.role && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {member.role}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      {showStatus && (
        <StatusBadge status={member.status} lastSeen={member.lastSeen} />
      )}
    </button>
  )
}

// =============================================================================
// MEMBER CARD (GRID VIEW)
// =============================================================================

interface MemberCardProps {
  member: TeamMember
  showStatus: boolean
  onClick?: () => void
}

function MemberCard({ member, showStatus, onClick }: MemberCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-center"
    >
      <Avatar
        name={member.name}
        avatarUrl={member.avatarUrl}
        status={showStatus ? member.status : undefined}
        size="lg"
      />
      <span className="font-medium text-sm mt-3 truncate w-full">{member.name}</span>
      {member.role && (
        <span className="text-xs text-muted-foreground mt-1">{member.role}</span>
      )}
    </button>
  )
}

// =============================================================================
// COMPACT VIEW
// =============================================================================

interface CompactTeamMembersProps {
  members: TeamMember[]
  maxDisplay: number
  onMemberClick?: (member: TeamMember) => void
  showStatus: boolean
  className?: string
}

function CompactTeamMembers({
  members,
  maxDisplay,
  onMemberClick,
  showStatus,
  className
}: CompactTeamMembersProps) {
  const displayMembers = members.slice(0, maxDisplay)
  const remainingCount = Math.max(0, members.length - maxDisplay)

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {displayMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => onMemberClick?.(member)}
            className="relative hover:z-10 hover:scale-110 transition-transform"
            title={member.name}
          >
            <Avatar
              name={member.name}
              avatarUrl={member.avatarUrl}
              status={showStatus ? member.status : undefined}
              size="sm"
              bordered
            />
          </button>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// AVATAR
// =============================================================================

interface AvatarProps {
  name: string
  avatarUrl?: string
  status?: OnlineStatus
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
}

function Avatar({ name, avatarUrl, status, size = 'md', bordered = false }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    sm: { class: 'w-8 h-8 text-xs', px: 32 },
    md: { class: 'w-10 h-10 text-sm', px: 40 },
    lg: { class: 'w-14 h-14 text-base', px: 56 }
  }

  const statusSizes = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2'
  }

  const statusColors: Record<OnlineStatus, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div className="relative">
      {avatarUrl ? (
        <OptimizedAvatar
          src={avatarUrl}
          alt={name}
          size={sizes[size].px}
          className={`${sizes[size].class} ${bordered ? 'border-2 border-background' : ''}`}
        />
      ) : (
        <div
          className={`${sizes[size].class} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium ${
            bordered ? 'border-2 border-background' : ''
          }`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-background`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
}

// =============================================================================
// STATUS BADGE
// =============================================================================

interface StatusBadgeProps {
  status: OnlineStatus
  lastSeen?: Date
}

function StatusBadge({ status, lastSeen }: StatusBadgeProps) {
  const statusConfig: Record<OnlineStatus, { label: string; className: string }> = {
    online: { label: 'Online', className: 'text-green-500' },
    away: { label: 'Away', className: 'text-yellow-500' },
    busy: { label: 'Busy', className: 'text-red-500' },
    offline: { label: lastSeen ? formatLastSeen(lastSeen) : 'Offline', className: 'text-muted-foreground' }
  }

  const config = statusConfig[status]

  return (
    <span className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatLastSeen(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(date).toLocaleDateString()
}

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

export default TeamMembers
