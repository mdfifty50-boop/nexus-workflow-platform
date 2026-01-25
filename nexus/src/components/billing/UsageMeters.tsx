/**
 * Usage Meters Component
 *
 * Visual usage display with:
 * - Circular progress indicators for each limit
 * - Color coding (green/yellow/red based on usage %)
 * - Click to see details
 * - Animated transitions
 * - Tooltip with exact numbers
 */

import { useState } from 'react';
import type { UsageMetersProps, UsageMetric, UsageLevel } from './billing-types';
import { getUsageLevel } from './billing-types';

// Color mappings for usage levels
const usageLevelColors: Record<UsageLevel, { stroke: string; bg: string; text: string }> = {
  safe: {
    stroke: 'stroke-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
  },
  warning: {
    stroke: 'stroke-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  critical: {
    stroke: 'stroke-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
  },
};

interface CircularProgressProps {
  percentage: number;
  level: UsageLevel;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({
  percentage,
  level,
  size = 80,
  strokeWidth = 6,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const colors = usageLevelColors[level];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colors.stroke} transition-all duration-700 ease-out`}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${colors.text}`}>
          {percentage === -1 ? '∞' : `${Math.round(percentage)}%`}
        </span>
      </div>
    </div>
  );
}

interface UsageMeterCardProps {
  metric: UsageMetric;
  onClick?: () => void;
  compact?: boolean;
}

function UsageMeterCard({ metric, onClick, compact = false }: UsageMeterCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isUnlimited = metric.limit === -1;
  const percentage = isUnlimited ? -1 : (metric.current / metric.limit) * 100;
  const level = getUsageLevel(metric.current, metric.limit);
  const colors = usageLevelColors[level];

  const formatLimit = (limit: number | -1): string => {
    if (limit === -1) return 'Unlimited';
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
    if (limit >= 1000) return `${(limit / 1000).toFixed(1)}K`;
    return limit.toString();
  };

  const formatCurrent = (current: number): string => {
    if (current >= 1000000) return `${(current / 1000000).toFixed(1)}M`;
    if (current >= 1000) return `${(current / 1000).toFixed(1)}K`;
    return current.toString();
  };

  if (compact) {
    return (
      <div
        className={`
          relative flex items-center gap-3 p-3 rounded-lg
          bg-slate-800/50 border border-slate-700
          hover:border-slate-600 transition-all cursor-pointer
        `}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CircularProgress percentage={percentage} level={level} size={48} strokeWidth={4} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{metric.displayName}</p>
          <p className="text-xs text-slate-400">
            {formatCurrent(metric.current)} / {formatLimit(metric.limit)} {metric.unit}
          </p>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
              <p className="text-sm font-medium text-slate-200 mb-2">{metric.displayName}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-slate-200">{metric.current.toLocaleString()} {metric.unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Limit:</span>
                  <span className="text-slate-200">
                    {isUnlimited ? 'Unlimited' : `${metric.limit.toLocaleString()} ${metric.unit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining:</span>
                    <span className={colors.text}>
                      {(metric.limit - metric.current).toLocaleString()} {metric.unit}
                    </span>
                  </div>
                )}
                {metric.resetDate && (
                  <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Resets:</span>
                    <span className="text-slate-200">
                      {new Date(metric.resetDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-slate-700" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-slate-900" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        relative p-5 rounded-xl border transition-all cursor-pointer
        ${colors.bg} border-slate-700 hover:border-slate-600
      `}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-4">
        <CircularProgress percentage={percentage} level={level} />
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-200">{metric.displayName}</h4>
          <p className="text-sm text-slate-400 mt-1">
            <span className={colors.text}>{formatCurrent(metric.current)}</span>
            <span className="mx-1">/</span>
            <span>{formatLimit(metric.limit)}</span>
            <span className="ml-1">{metric.unit}</span>
          </p>
          {!isUnlimited && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    level === 'safe' ? 'bg-emerald-500' :
                    level === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          {metric.resetDate && (
            <p className="text-xs text-slate-500 mt-2">
              Resets {new Date(metric.resetDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Warning indicator for critical usage */}
      {level === 'critical' && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[220px]">
            <p className="text-sm font-medium text-slate-200 mb-2">{metric.displayName}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Used:</span>
                <span className="text-slate-200">{metric.current.toLocaleString()} {metric.unit}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Limit:</span>
                <span className="text-slate-200">
                  {isUnlimited ? 'Unlimited' : `${metric.limit.toLocaleString()} ${metric.unit}`}
                </span>
              </div>
              {!isUnlimited && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining:</span>
                    <span className={colors.text}>
                      {Math.max(0, metric.limit - metric.current).toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Usage:</span>
                    <span className={colors.text}>{percentage.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-slate-700" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UsageMeters({ metrics, onMetricClick, compact = false }: UsageMetersProps) {
  const handleMetricClick = (metric: UsageMetric) => {
    if (onMetricClick) {
      onMetricClick(metric);
    }
  };

  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No usage data available</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {metrics.map((metric) => (
        <UsageMeterCard
          key={metric.id}
          metric={metric}
          onClick={() => handleMetricClick(metric)}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default UsageMeters;
