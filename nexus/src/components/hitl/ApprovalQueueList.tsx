/**
 * ApprovalQueueList Component
 * Displays a list of pending approvals with filtering, sorting, and pagination
 */

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  PRIORITY,
  REQUEST_TYPE,
  APPROVAL_STATUS,
} from '@/lib/hitl/hitl-types';
import type { ApprovalRequest, ApprovalStatus, Priority, RequestType } from '@/lib/hitl/hitl-types';
import type { ApprovalQueueListProps, SortOption } from './hitl-component-types';
import { SORT_OPTIONS } from './hitl-component-types';
import { ApprovalCard } from './ApprovalCard';

/**
 * Icon components
 */
function FilterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SortIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  );
}

function RefreshIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ChevronLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function InboxIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

/**
 * Sort option labels
 */
const SORT_LABELS: Record<SortOption, string> = {
  [SORT_OPTIONS.DATE_ASC]: 'Date (Oldest)',
  [SORT_OPTIONS.DATE_DESC]: 'Date (Newest)',
  [SORT_OPTIONS.PRIORITY_ASC]: 'Priority (Low to High)',
  [SORT_OPTIONS.PRIORITY_DESC]: 'Priority (High to Low)',
  [SORT_OPTIONS.DUE_DATE_ASC]: 'Due Date (Soonest)',
  [SORT_OPTIONS.DUE_DATE_DESC]: 'Due Date (Latest)',
};

/**
 * Priority filter options
 */
const PRIORITY_OPTIONS: Array<{ value: Priority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priorities' },
  { value: PRIORITY.CRITICAL, label: 'Critical' },
  { value: PRIORITY.HIGH, label: 'High' },
  { value: PRIORITY.MEDIUM, label: 'Medium' },
  { value: PRIORITY.LOW, label: 'Low' },
];

/**
 * Status filter options
 */
const STATUS_OPTIONS: Array<{ value: ApprovalStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: APPROVAL_STATUS.PENDING, label: 'Pending' },
  { value: APPROVAL_STATUS.APPROVED, label: 'Approved' },
  { value: APPROVAL_STATUS.REJECTED, label: 'Rejected' },
  { value: APPROVAL_STATUS.ESCALATED, label: 'Escalated' },
  { value: APPROVAL_STATUS.EXPIRED, label: 'Expired' },
];

/**
 * Request type filter options
 */
const TYPE_OPTIONS: Array<{ value: RequestType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: REQUEST_TYPE.DATA_VALIDATION, label: 'Data Validation' },
  { value: REQUEST_TYPE.CONTENT_REVIEW, label: 'Content Review' },
  { value: REQUEST_TYPE.EXTERNAL_APPROVAL, label: 'External Approval' },
  { value: REQUEST_TYPE.EXCEPTION_HANDLING, label: 'Exception' },
  { value: REQUEST_TYPE.COMPLIANCE_CHECK, label: 'Compliance' },
];

/**
 * Empty State Component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <InboxIcon className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} hasAvatar={false} lines={2} />
      ))}
    </div>
  );
}

/**
 * Pagination Component
 */
interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4 border-t border-slate-700/50">
      <p className="text-sm text-slate-400">
        Showing {startItem} to {endItem} of {totalItems} items
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="text-slate-300"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
            let pageNum = index;
            if (totalPages > 5) {
              if (page < 3) {
                pageNum = index;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + index;
              } else {
                pageNum = page - 2 + index;
              }
            }
            return (
              <Button
                key={pageNum}
                size="sm"
                variant={page === pageNum ? 'default' : 'ghost'}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-8 h-8 p-0',
                  page === pageNum && 'bg-cyan-500/20 text-cyan-400'
                )}
              >
                {pageNum + 1}
              </Button>
            );
          })}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="text-slate-300"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * ApprovalQueueList Component
 */
export function ApprovalQueueList({
  requests,
  filters,
  onFiltersChange,
  sortBy = SORT_OPTIONS.PRIORITY_DESC,
  onSortChange,
  page = 0,
  pageSize = 10,
  totalItems,
  onPageChange,
  onApprove,
  onReject,
  onEscalate,
  onSelectRequest,
  isLoading = false,
  emptyMessage = 'You have no pending approval requests. New requests will appear here when they need your attention.',
  className,
}: ApprovalQueueListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Count items by status for badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      expired: 0,
    };
    requests.forEach((req) => {
      counts[req.status]++;
    });
    return counts;
  }, [requests]);

  // Apply local filters if onFiltersChange is not provided
  const filteredRequests = useMemo(() => {
    if (onFiltersChange) {
      // External filtering is being used
      return requests;
    }

    return requests.filter((request) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          request.stepName.toLowerCase().includes(query) ||
          request.workflowName.toLowerCase().includes(query) ||
          request.requester.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && request.requestType !== typeFilter) return false;

      return true;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter, typeFilter, onFiltersChange]);

  // Sort requests
  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];

    const priorityOrder: Record<Priority, number> = {
      [PRIORITY.CRITICAL]: 4,
      [PRIORITY.HIGH]: 3,
      [PRIORITY.MEDIUM]: 2,
      [PRIORITY.LOW]: 1,
    };

    switch (sortBy) {
      case SORT_OPTIONS.DATE_ASC:
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case SORT_OPTIONS.DATE_DESC:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case SORT_OPTIONS.PRIORITY_ASC:
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case SORT_OPTIONS.PRIORITY_DESC:
        sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case SORT_OPTIONS.DUE_DATE_ASC:
        sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        break;
      case SORT_OPTIONS.DUE_DATE_DESC:
        sorted.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        break;
    }

    return sorted;
  }, [filteredRequests, sortBy]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Handle filter changes
  const handleStatusChange = useCallback((value: ApprovalStatus | 'all') => {
    setStatusFilter(value);
    if (onFiltersChange && filters) {
      onFiltersChange({
        ...filters,
        status: value === 'all' ? undefined : value,
      });
    }
  }, [onFiltersChange, filters]);

  const handlePriorityChange = useCallback((value: Priority | 'all') => {
    setPriorityFilter(value);
    if (onFiltersChange && filters) {
      onFiltersChange({
        ...filters,
        priority: value === 'all' ? undefined : value,
      });
    }
  }, [onFiltersChange, filters]);

  const handleTypeChange = useCallback((value: RequestType | 'all') => {
    setTypeFilter(value);
    if (onFiltersChange && filters) {
      onFiltersChange({
        ...filters,
        requestType: value === 'all' ? undefined : value,
      });
    }
  }, [onFiltersChange, filters]);

  // Handle card actions
  const handleSelectRequest = useCallback((request: ApprovalRequest) => {
    onSelectRequest?.(request);
  }, [onSelectRequest]);

  // Calculate total items
  const effectiveTotalItems = totalItems ?? sortedRequests.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as ApprovalStatus | 'all')}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {statusCounts[option.value] > 0 && `(${statusCounts[option.value]})`}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => handlePriorityChange(e.target.value as Priority | 'all')}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value as RequestType | 'all')}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <SortIcon className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value as SortOption)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-slate-400 hover:text-white"
        >
          <RefreshIcon className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {effectiveTotalItems} {effectiveTotalItems === 1 ? 'request' : 'requests'}
          </span>
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
              {statusFilter}
            </Badge>
          )}
          {priorityFilter !== 'all' && (
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
              {priorityFilter}
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
              {typeFilter}
            </Badge>
          )}
        </div>
      </div>

      {/* Request List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : sortedRequests.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {sortedRequests.map((request) => (
            <ApprovalCard
              key={request.id}
              request={request}
              onApprove={onApprove}
              onReject={onReject}
              onEscalate={onEscalate}
              onViewDetails={() => handleSelectRequest(request)}
              showQuickActions={request.status === APPROVAL_STATUS.PENDING}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sortedRequests.length > 0 && onPageChange && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={effectiveTotalItems}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default ApprovalQueueList;
