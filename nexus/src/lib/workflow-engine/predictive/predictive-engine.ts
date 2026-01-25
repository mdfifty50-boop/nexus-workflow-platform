/**
 * Nexus Predictive Intelligence Engine
 *
 * Core predictive system that anticipates user needs before they ask.
 * Provides "before you ask" intelligence for proactive workflow suggestions.
 *
 * Key Capabilities:
 * 1. Calendar-Based Predictions - Analyze calendar events for preparation needs
 * 2. Pattern-Based Predictions - Recognize time-based and behavioral patterns
 * 3. Regional Awareness - Kuwait/GCC specific time patterns and holidays
 * 4. Learning Integration - Improve predictions from feedback
 * 5. Confidence Scoring - Track prediction accuracy over time
 *
 * @module predictive-engine
 * @version 1.0.0
 */

import {
  getGCCHolidays,
  type GCCCountryCode,
} from '../regional/gcc-context';

// ============================================================================
// CORE TYPES - CALENDAR PREDICTIONS
// ============================================================================

/**
 * Represents a calendar event for prediction analysis
 */
export interface CalendarEvent {
  /** Unique identifier for the event */
  id: string;
  /** Event title */
  title: string;
  /** Event description */
  description?: string;
  /** Event start time */
  startTime: Date;
  /** Event end time */
  endTime: Date;
  /** Location (physical or virtual) */
  location?: string;
  /** Whether this is an all-day event */
  allDay: boolean;
  /** Event recurrence pattern */
  recurrence?: RecurrencePattern;
  /** Attendees */
  attendees?: CalendarAttendee[];
  /** Event type classification */
  type?: CalendarEventType;
  /** Custom tags */
  tags?: string[];
  /** Source calendar */
  calendarId?: string;
  /** Organizer */
  organizer?: string;
  /** Meeting link (Zoom, Teams, etc.) */
  meetingLink?: string;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Associated project or client */
  project?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Types of calendar events
 */
export type CalendarEventType =
  | 'meeting'
  | 'deadline'
  | 'recurring'
  | 'reminder'
  | 'holiday'
  | 'personal'
  | 'travel'
  | 'training'
  | 'review'
  | 'presentation'
  | 'interview'
  | 'call'
  | 'task'
  | 'other';

/**
 * Event recurrence pattern
 */
export interface RecurrencePattern {
  /** Recurrence frequency */
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Interval (e.g., every 2 weeks) */
  interval: number;
  /** Days of week for weekly recurrence */
  daysOfWeek?: number[];
  /** Day of month for monthly recurrence */
  dayOfMonth?: number;
  /** End date for recurrence */
  endDate?: Date;
  /** Maximum occurrences */
  maxOccurrences?: number;
  /** Exceptions to the recurrence */
  exceptions?: Date[];
}

/**
 * Calendar event attendee
 */
export interface CalendarAttendee {
  /** Attendee email */
  email: string;
  /** Attendee name */
  name?: string;
  /** Response status */
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  /** Whether this is an optional attendee */
  optional: boolean;
  /** Role in the meeting */
  role?: 'organizer' | 'required' | 'optional';
}

/**
 * Prediction based on calendar analysis
 */
export interface CalendarPrediction {
  /** Unique identifier for this prediction */
  id: string;
  /** The calendar event this prediction is for */
  eventId: string;
  /** Event title for reference */
  eventTitle: string;
  /** Type of event being analyzed */
  eventType: CalendarEventType;
  /** Predicted needs for this event */
  predictedNeeds: PredictedNeed[];
  /** Suggested workflows to run */
  suggestedWorkflows: SuggestedWorkflow[];
  /** Recommended preparation time in minutes before the event */
  preparationTime: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** When this prediction should be shown to the user */
  showAt: Date;
  /** When the related event occurs */
  eventTime: Date;
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high' | 'critical';
  /** Whether this prediction has been acted upon */
  acted: boolean;
  /** User feedback on this prediction */
  feedback?: PredictionFeedback;
  /** Tags for categorization */
  tags: string[];
  /** Regional context applied */
  regionalContext?: string;
}

/**
 * A predicted need for an event
 */
export interface PredictedNeed {
  /** Unique identifier */
  id: string;
  /** Type of need */
  type: PredictedNeedType;
  /** Human-readable description */
  description: string;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Whether this can be automated */
  automatable: boolean;
  /** Suggested action to fulfill this need */
  suggestedAction?: string;
  /** Required tools or integrations */
  requiredTools?: string[];
  /** Estimated time to fulfill (minutes) */
  estimatedTime?: number;
  /** Dependencies on other needs */
  dependencies?: string[];
  /** Confidence in this prediction (0-100) */
  confidence: number;
  /** Keywords that triggered this prediction */
  triggerKeywords?: string[];
}

/**
 * Types of predicted needs
 */
export type PredictedNeedType =
  | 'document'
  | 'data'
  | 'communication'
  | 'task'
  | 'preparation'
  | 'followup'
  | 'reminder'
  | 'notification'
  | 'report'
  | 'review'
  | 'approval'
  | 'booking'
  | 'resource';

/**
 * A suggested workflow based on predictions
 */
export interface SuggestedWorkflow {
  /** Unique identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Category of workflow */
  category: string;
  /** Steps in the workflow */
  steps: SuggestedWorkflowStep[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Confidence in this suggestion (0-100) */
  confidence: number;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Required integrations */
  requiredIntegrations: string[];
  /** Whether workflow can run automatically */
  canAutoRun: boolean;
  /** Optimal time to trigger (minutes before event) */
  optimalTriggerTime: number;
  /** Historical success rate */
  historicalSuccessRate?: number;
  /** Tags */
  tags: string[];
}

/**
 * Step in a suggested workflow
 */
export interface SuggestedWorkflowStep {
  /** Step number */
  stepNumber: number;
  /** Step name */
  name: string;
  /** Step description */
  description: string;
  /** Tool to use */
  tool?: string;
  /** Action type */
  actionType: 'fetch' | 'create' | 'update' | 'send' | 'notify' | 'analyze' | 'generate';
  /** Whether step requires user input */
  requiresInput: boolean;
  /** Estimated time for this step */
  estimatedTime: number;
}

// ============================================================================
// CORE TYPES - PATTERN PREDICTIONS
// ============================================================================

/**
 * Time-based patterns for predictions
 */
export type TimePattern =
  | 'monday_morning'
  | 'friday_afternoon'
  | 'end_of_month'
  | 'end_of_quarter'
  | 'end_of_year'
  | 'sunday_morning'      // Kuwait work week start
  | 'thursday_afternoon'  // Kuwait week-end prep
  | 'ramadan_hours'       // Adjusted business hours
  | 'first_of_month'
  | 'mid_month'
  | 'quarter_start'
  | 'year_start'
  | 'daily_start'
  | 'daily_end'
  | 'lunch_break'
  | 'custom';

/**
 * Pattern-based prediction
 */
export interface PatternPrediction {
  /** Unique identifier */
  id: string;
  /** The pattern that triggered this prediction */
  pattern: TimePattern;
  /** Description of the pattern */
  patternDescription: string;
  /** Workflows predicted to be needed */
  predictedWorkflows: string[];
  /** Suggested workflows */
  suggestedWorkflows: SuggestedWorkflow[];
  /** Historical accuracy of this pattern (0-100) */
  historicalAccuracy: number;
  /** Number of times this pattern was triggered */
  triggerCount: number;
  /** Number of times prediction was accurate */
  accurateCount: number;
  /** Last time this pattern was triggered */
  lastTriggered?: Date;
  /** Next predicted trigger time */
  nextTrigger?: Date;
  /** Confidence score (0-100) */
  confidence: number;
  /** Regional context this pattern applies to */
  region?: string;
  /** Whether pattern is active */
  active: boolean;
  /** User feedback history */
  feedbackHistory: PredictionFeedback[];
}

/**
 * Feedback on a prediction
 */
export interface PredictionFeedback {
  /** Timestamp of feedback */
  timestamp: Date;
  /** Whether prediction was helpful */
  helpful: boolean;
  /** Whether user took the suggested action */
  actionTaken: boolean;
  /** User's rating (1-5) */
  rating?: number;
  /** User's comments */
  comments?: string;
  /** What the user actually needed */
  actualNeed?: string;
}

/**
 * Active prediction currently being shown
 */
export interface ActivePrediction {
  /** Unique identifier */
  id: string;
  /** Type of prediction */
  type: 'calendar' | 'pattern' | 'behavioral' | 'contextual';
  /** The prediction details */
  prediction: CalendarPrediction | PatternPrediction;
  /** When this became active */
  activatedAt: Date;
  /** When this should expire */
  expiresAt: Date;
  /** Priority relative to other active predictions */
  priority: number;
  /** Whether user has seen this */
  seen: boolean;
  /** Whether user has dismissed this */
  dismissed: boolean;
  /** Actions taken on this prediction */
  actions: PredictionAction[];
}

/**
 * Action taken on a prediction
 */
export interface PredictionAction {
  /** Action type */
  type: 'accepted' | 'dismissed' | 'postponed' | 'modified' | 'executed';
  /** When action was taken */
  timestamp: Date;
  /** Additional details */
  details?: string;
}

// ============================================================================
// CORE TYPES - PREDICTION ACCURACY
// ============================================================================

/**
 * Accuracy metrics for predictions
 */
export interface PredictionAccuracy {
  /** Overall accuracy percentage */
  overallAccuracy: number;
  /** Accuracy by prediction type */
  byType: Record<string, TypeAccuracy>;
  /** Accuracy by pattern */
  byPattern: Record<TimePattern, PatternAccuracyMetrics>;
  /** Accuracy by domain */
  byDomain: Record<string, number>;
  /** Total predictions made */
  totalPredictions: number;
  /** Predictions accepted by user */
  acceptedPredictions: number;
  /** Predictions that were helpful */
  helpfulPredictions: number;
  /** Average confidence score */
  averageConfidence: number;
  /** Trend over time */
  trend: 'improving' | 'stable' | 'declining';
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Accuracy metrics for a specific type
 */
export interface TypeAccuracy {
  /** Type name */
  type: string;
  /** Accuracy percentage */
  accuracy: number;
  /** Total predictions */
  total: number;
  /** Accepted predictions */
  accepted: number;
  /** Average confidence */
  averageConfidence: number;
}

/**
 * Accuracy metrics for a pattern
 */
export interface PatternAccuracyMetrics {
  /** Pattern */
  pattern: TimePattern;
  /** Accuracy percentage */
  accuracy: number;
  /** Total triggers */
  triggers: number;
  /** Accurate predictions */
  accurate: number;
  /** False positives */
  falsePositives: number;
  /** Missed predictions */
  missed: number;
}

// ============================================================================
// CORE TYPES - REGIONAL PATTERNS
// ============================================================================

/**
 * Regional time pattern configuration
 */
export interface RegionalTimePattern {
  /** Region code */
  region: string;
  /** Patterns specific to this region */
  patterns: RegionalPatternConfig[];
  /** Work week configuration */
  workWeek: WorkWeekConfig;
  /** Holiday awareness */
  holidayAwareness: HolidayAwarenessConfig;
  /** Business hours */
  businessHours: BusinessHoursConfig;
  /** Special periods (e.g., Ramadan) */
  specialPeriods: SpecialPeriodConfig[];
}

/**
 * Configuration for a regional pattern
 */
export interface RegionalPatternConfig {
  /** Pattern identifier */
  pattern: TimePattern;
  /** Days this pattern applies */
  days: string[];
  /** Time range for this pattern */
  timeRange: { start: string; end: string };
  /** Predicted workflows */
  predictedWorkflows: string[];
  /** Confidence base score */
  baseConfidence: number;
  /** Description */
  description: string;
  /** Active status */
  active: boolean;
}

/**
 * Work week configuration
 */
export interface WorkWeekConfig {
  /** Start day */
  startDay: string;
  /** End day */
  endDay: string;
  /** Weekend days */
  weekendDays: string[];
  /** Working days */
  workingDays: string[];
}

/**
 * Holiday awareness configuration
 */
export interface HolidayAwarenessConfig {
  /** Whether to adjust for holidays */
  enabled: boolean;
  /** Days before holiday to start planning */
  planningDays: number;
  /** Holiday types to consider */
  holidayTypes: ('islamic' | 'national' | 'international')[];
  /** Workflows to suggest before holidays */
  preHolidayWorkflows: string[];
}

/**
 * Business hours configuration
 */
export interface BusinessHoursConfig {
  /** Standard hours */
  standard: { start: string; end: string };
  /** Ramadan hours */
  ramadan?: { start: string; end: string };
  /** Summer hours */
  summer?: { start: string; end: string };
  /** Split shift configuration */
  splitShift?: {
    morningEnd: string;
    afternoonStart: string;
  };
}

/**
 * Special period configuration (e.g., Ramadan)
 */
export interface SpecialPeriodConfig {
  /** Period name */
  name: string;
  /** Period type */
  type: 'ramadan' | 'summer' | 'holiday_season' | 'fiscal_year_end' | 'custom';
  /** Approximate start (month-day or calculated) */
  startApprox?: string;
  /** Duration in days */
  durationDays?: number;
  /** Adjusted business hours */
  adjustedHours?: { start: string; end: string };
  /** Special workflows to suggest */
  workflows: string[];
  /** Confidence adjustment */
  confidenceMultiplier: number;
}

// ============================================================================
// CORE TYPES - ENGINE CONFIGURATION
// ============================================================================

/**
 * Configuration for the Predictive Engine
 */
export interface PredictiveConfig {
  /** Default region for predictions */
  defaultRegion: string;
  /** Default timezone */
  defaultTimezone: string;
  /** Minimum confidence threshold to show predictions */
  minConfidenceThreshold: number;
  /** Maximum predictions to show at once */
  maxActivePredictions: number;
  /** Default preparation time in minutes */
  defaultPreparationTime: number;
  /** Whether to enable learning from feedback */
  enableLearning: boolean;
  /** Confidence decay rate per day without activity */
  confidenceDecayRate: number;
  /** Minimum historical data points for pattern confidence */
  minHistoricalDataPoints: number;
  /** Calendar look-ahead days */
  calendarLookAheadDays: number;
  /** Pattern look-ahead hours */
  patternLookAheadHours: number;
  /** Regional configurations */
  regionalConfigs: Map<string, RegionalTimePattern>;
  /** Event type configurations */
  eventTypeConfigs: Map<CalendarEventType, EventTypeConfig>;
  /** Debug mode */
  debug: boolean;
}

/**
 * Configuration for a specific event type
 */
export interface EventTypeConfig {
  /** Event type */
  type: CalendarEventType;
  /** Default preparation time in minutes */
  defaultPrepTime: number;
  /** Common predicted needs */
  commonNeeds: PredictedNeedType[];
  /** Confidence multiplier */
  confidenceMultiplier: number;
  /** Keywords that indicate this event type */
  keywords: string[];
  /** Suggested workflow templates */
  workflowTemplates: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default configuration for the Predictive Engine
 */
export const DEFAULT_PREDICTIVE_CONFIG: PredictiveConfig = {
  defaultRegion: 'KW',
  defaultTimezone: 'Asia/Kuwait',
  minConfidenceThreshold: 50,
  maxActivePredictions: 5,
  defaultPreparationTime: 30,
  enableLearning: true,
  confidenceDecayRate: 2, // 2% per day
  minHistoricalDataPoints: 3,
  calendarLookAheadDays: 7,
  patternLookAheadHours: 24,
  regionalConfigs: new Map(),
  eventTypeConfigs: new Map(),
  debug: false,
};

/**
 * Default event type configurations
 */
export const DEFAULT_EVENT_TYPE_CONFIGS: EventTypeConfig[] = [
  {
    type: 'meeting',
    defaultPrepTime: 30,
    commonNeeds: ['document', 'preparation', 'communication'],
    confidenceMultiplier: 1.0,
    keywords: ['meeting', 'call', 'discussion', 'sync', 'standup', 'review'],
    workflowTemplates: ['meeting-prep', 'agenda-creation', 'notes-preparation'],
  },
  {
    type: 'deadline',
    defaultPrepTime: 60,
    commonNeeds: ['task', 'document', 'review', 'approval'],
    confidenceMultiplier: 1.2,
    keywords: ['deadline', 'due', 'submission', 'deliver', 'complete'],
    workflowTemplates: ['deadline-reminder', 'task-completion', 'delivery-prep'],
  },
  {
    type: 'presentation',
    defaultPrepTime: 120,
    commonNeeds: ['document', 'data', 'preparation', 'review'],
    confidenceMultiplier: 1.3,
    keywords: ['presentation', 'demo', 'pitch', 'showcase', 'present'],
    workflowTemplates: ['presentation-prep', 'slide-review', 'data-collection'],
  },
  {
    type: 'interview',
    defaultPrepTime: 45,
    commonNeeds: ['document', 'preparation', 'communication'],
    confidenceMultiplier: 1.2,
    keywords: ['interview', 'candidate', 'hiring', 'recruit'],
    workflowTemplates: ['interview-prep', 'candidate-review', 'questions-prep'],
  },
  {
    type: 'review',
    defaultPrepTime: 30,
    commonNeeds: ['document', 'data', 'report'],
    confidenceMultiplier: 1.1,
    keywords: ['review', 'assessment', 'evaluation', 'feedback', 'retrospective'],
    workflowTemplates: ['review-prep', 'data-gathering', 'report-generation'],
  },
  {
    type: 'training',
    defaultPrepTime: 20,
    commonNeeds: ['document', 'resource', 'preparation'],
    confidenceMultiplier: 0.9,
    keywords: ['training', 'workshop', 'learning', 'course', 'webinar'],
    workflowTemplates: ['training-prep', 'materials-download'],
  },
  {
    type: 'travel',
    defaultPrepTime: 240,
    commonNeeds: ['booking', 'document', 'notification', 'preparation'],
    confidenceMultiplier: 1.4,
    keywords: ['travel', 'flight', 'trip', 'business travel', 'conference'],
    workflowTemplates: ['travel-prep', 'itinerary-creation', 'out-of-office'],
  },
  {
    type: 'holiday',
    defaultPrepTime: 480,
    commonNeeds: ['notification', 'task', 'communication'],
    confidenceMultiplier: 1.5,
    keywords: ['holiday', 'vacation', 'leave', 'eid', 'national day'],
    workflowTemplates: ['holiday-prep', 'handover', 'auto-reply-setup'],
  },
];

// ============================================================================
// KUWAIT/GCC REGIONAL PATTERNS
// ============================================================================

/**
 * Kuwait-specific regional time patterns
 */
export const KUWAIT_REGIONAL_PATTERNS: RegionalTimePattern = {
  region: 'KW',
  patterns: [
    {
      pattern: 'sunday_morning',
      days: ['Sunday'],
      timeRange: { start: '08:00', end: '10:00' },
      predictedWorkflows: ['weekly-planning', 'inbox-review', 'team-sync-prep'],
      baseConfidence: 75,
      description: 'Start of Kuwait work week - weekly planning and inbox review',
      active: true,
    },
    {
      pattern: 'thursday_afternoon',
      days: ['Thursday'],
      timeRange: { start: '13:00', end: '17:00' },
      predictedWorkflows: ['weekly-wrap-up', 'progress-report', 'handover-prep'],
      baseConfidence: 70,
      description: 'End of Kuwait work week - wrap up and weekend prep',
      active: true,
    },
    {
      pattern: 'end_of_month',
      days: ['*'], // Last 3 days of month
      timeRange: { start: '08:00', end: '17:00' },
      predictedWorkflows: ['financial-close', 'report-generation', 'invoice-processing'],
      baseConfidence: 80,
      description: 'End of month financial and administrative tasks',
      active: true,
    },
    {
      pattern: 'end_of_quarter',
      days: ['*'], // Last 5 days of quarter
      timeRange: { start: '08:00', end: '17:00' },
      predictedWorkflows: ['quarterly-review', 'kpi-reporting', 'budget-review'],
      baseConfidence: 85,
      description: 'Quarterly review and reporting cycle',
      active: true,
    },
    {
      pattern: 'ramadan_hours',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      timeRange: { start: '09:00', end: '14:00' },
      predictedWorkflows: ['ramadan-schedule-adjustment', 'meeting-reschedule'],
      baseConfidence: 70,
      description: 'Ramadan adjusted working hours (6 hours by law)',
      active: true,
    },
  ],
  workWeek: {
    startDay: 'Sunday',
    endDay: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  holidayAwareness: {
    enabled: true,
    planningDays: 3,
    holidayTypes: ['islamic', 'national'],
    preHolidayWorkflows: ['out-of-office', 'handover', 'urgent-tasks-completion'],
  },
  businessHours: {
    standard: { start: '08:00', end: '17:00' },
    ramadan: { start: '09:00', end: '14:00' },
    splitShift: {
      morningEnd: '12:30',
      afternoonStart: '16:00',
    },
  },
  specialPeriods: [
    {
      name: 'Ramadan',
      type: 'ramadan',
      durationDays: 30,
      adjustedHours: { start: '09:00', end: '14:00' },
      workflows: ['ramadan-greeting', 'schedule-adjustment', 'iftar-planning'],
      confidenceMultiplier: 1.3,
    },
    {
      name: 'National Day Week',
      type: 'holiday_season',
      startApprox: '02-25',
      durationDays: 3,
      workflows: ['national-day-closure', 'celebration-prep', 'auto-reply'],
      confidenceMultiplier: 1.4,
    },
    {
      name: 'Summer Business Slow',
      type: 'summer',
      startApprox: '06-15',
      durationDays: 75,
      workflows: ['summer-schedule', 'vacation-coverage'],
      confidenceMultiplier: 0.8,
    },
  ],
};

/**
 * UAE-specific regional time patterns
 */
export const UAE_REGIONAL_PATTERNS: RegionalTimePattern = {
  region: 'AE',
  patterns: [
    {
      pattern: 'monday_morning',
      days: ['Monday'],
      timeRange: { start: '09:00', end: '11:00' },
      predictedWorkflows: ['weekly-planning', 'inbox-review', 'team-sync-prep'],
      baseConfidence: 75,
      description: 'Start of UAE work week - weekly planning and inbox review',
      active: true,
    },
    {
      pattern: 'friday_afternoon',
      days: ['Friday'],
      timeRange: { start: '11:00', end: '13:00' },
      predictedWorkflows: ['weekly-wrap-up', 'weekend-prep'],
      baseConfidence: 65,
      description: 'Friday half-day end - quick wrap-up before weekend',
      active: true,
    },
  ],
  workWeek: {
    startDay: 'Monday',
    endDay: 'Friday',
    weekendDays: ['Saturday', 'Sunday'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  holidayAwareness: {
    enabled: true,
    planningDays: 3,
    holidayTypes: ['islamic', 'national'],
    preHolidayWorkflows: ['out-of-office', 'handover', 'urgent-tasks-completion'],
  },
  businessHours: {
    standard: { start: '09:00', end: '18:00' },
    ramadan: { start: '09:00', end: '14:00' },
  },
  specialPeriods: [
    {
      name: 'Ramadan',
      type: 'ramadan',
      durationDays: 30,
      adjustedHours: { start: '09:00', end: '14:00' },
      workflows: ['ramadan-greeting', 'schedule-adjustment'],
      confidenceMultiplier: 1.3,
    },
    {
      name: 'UAE National Day',
      type: 'holiday_season',
      startApprox: '12-02',
      durationDays: 2,
      workflows: ['national-day-closure', 'celebration-prep'],
      confidenceMultiplier: 1.4,
    },
  ],
};

/**
 * Saudi Arabia regional time patterns
 */
export const SAUDI_REGIONAL_PATTERNS: RegionalTimePattern = {
  region: 'SA',
  patterns: [
    {
      pattern: 'sunday_morning',
      days: ['Sunday'],
      timeRange: { start: '08:00', end: '10:00' },
      predictedWorkflows: ['weekly-planning', 'inbox-review'],
      baseConfidence: 75,
      description: 'Start of Saudi work week',
      active: true,
    },
    {
      pattern: 'thursday_afternoon',
      days: ['Thursday'],
      timeRange: { start: '12:00', end: '17:00' },
      predictedWorkflows: ['weekly-wrap-up', 'progress-report'],
      baseConfidence: 70,
      description: 'End of Saudi work week',
      active: true,
    },
  ],
  workWeek: {
    startDay: 'Sunday',
    endDay: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  holidayAwareness: {
    enabled: true,
    planningDays: 3,
    holidayTypes: ['islamic', 'national'],
    preHolidayWorkflows: ['out-of-office', 'handover'],
  },
  businessHours: {
    standard: { start: '08:00', end: '17:00' },
    ramadan: { start: '10:00', end: '15:00' },
    splitShift: {
      morningEnd: '12:00',
      afternoonStart: '16:00',
    },
  },
  specialPeriods: [
    {
      name: 'Ramadan',
      type: 'ramadan',
      durationDays: 30,
      adjustedHours: { start: '10:00', end: '15:00' },
      workflows: ['ramadan-greeting', 'schedule-adjustment'],
      confidenceMultiplier: 1.3,
    },
    {
      name: 'Saudi National Day',
      type: 'holiday_season',
      startApprox: '09-23',
      durationDays: 1,
      workflows: ['national-day-closure'],
      confidenceMultiplier: 1.4,
    },
  ],
};

/**
 * Map of all GCC regional patterns
 */
export const GCC_REGIONAL_PATTERNS: Map<string, RegionalTimePattern> = new Map([
  ['KW', KUWAIT_REGIONAL_PATTERNS],
  ['AE', UAE_REGIONAL_PATTERNS],
  ['SA', SAUDI_REGIONAL_PATTERNS],
]);

// ============================================================================
// MEETING KEYWORDS AND PATTERNS
// ============================================================================

/**
 * Keywords for detecting meeting types
 */
export const MEETING_TYPE_KEYWORDS: Record<string, string[]> = {
  standup: ['standup', 'stand-up', 'daily', 'scrum', 'sync', 'huddle'],
  review: ['review', 'retrospective', 'retro', 'sprint review', 'demo'],
  planning: ['planning', 'sprint planning', 'backlog', 'roadmap', 'strategy'],
  oneonone: ['1:1', 'one-on-one', '1-on-1', 'check-in', 'coaching'],
  client: ['client', 'customer', 'partner', 'vendor', 'external'],
  allhands: ['all-hands', 'town hall', 'company meeting', 'all hands'],
  interview: ['interview', 'candidate', 'hiring', 'recruitment'],
  training: ['training', 'workshop', 'learning', 'course', 'onboarding'],
  presentation: ['presentation', 'demo', 'pitch', 'showcase'],
  brainstorm: ['brainstorm', 'ideation', 'workshop', 'creative'],
};

/**
 * Common meeting preparation needs by type
 */
export const MEETING_PREP_NEEDS: Record<string, PredictedNeed[]> = {
  standup: [
    {
      id: 'standup-update',
      type: 'preparation',
      description: 'Prepare your standup update (yesterday, today, blockers)',
      priority: 'medium',
      automatable: true,
      suggestedAction: 'Generate standup update from recent tasks',
      requiredTools: ['task-manager', 'calendar'],
      estimatedTime: 5,
      confidence: 80,
    },
  ],
  review: [
    {
      id: 'review-data',
      type: 'data',
      description: 'Gather metrics and data for review',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Pull relevant metrics from dashboards',
      requiredTools: ['analytics', 'reporting'],
      estimatedTime: 15,
      confidence: 85,
    },
    {
      id: 'review-docs',
      type: 'document',
      description: 'Prepare or review relevant documents',
      priority: 'high',
      automatable: false,
      estimatedTime: 20,
      confidence: 75,
    },
  ],
  planning: [
    {
      id: 'planning-backlog',
      type: 'preparation',
      description: 'Review and prioritize backlog items',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Organize backlog for planning session',
      requiredTools: ['project-management', 'task-manager'],
      estimatedTime: 30,
      confidence: 80,
    },
  ],
  client: [
    {
      id: 'client-brief',
      type: 'document',
      description: 'Review client brief and recent communications',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Compile recent client communications',
      requiredTools: ['email', 'crm'],
      estimatedTime: 15,
      confidence: 85,
    },
    {
      id: 'client-agenda',
      type: 'preparation',
      description: 'Prepare or review meeting agenda',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Generate agenda from previous meetings',
      requiredTools: ['document-generation'],
      estimatedTime: 10,
      confidence: 75,
    },
  ],
  interview: [
    {
      id: 'interview-cv',
      type: 'document',
      description: 'Review candidate CV and application',
      priority: 'critical',
      automatable: true,
      suggestedAction: 'Fetch candidate profile from ATS',
      requiredTools: ['ats', 'hr-system'],
      estimatedTime: 20,
      confidence: 90,
    },
    {
      id: 'interview-questions',
      type: 'preparation',
      description: 'Prepare interview questions',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Generate role-specific questions',
      requiredTools: ['ai-generation'],
      estimatedTime: 15,
      confidence: 70,
    },
  ],
  presentation: [
    {
      id: 'pres-slides',
      type: 'document',
      description: 'Review and finalize presentation slides',
      priority: 'critical',
      automatable: false,
      estimatedTime: 30,
      confidence: 90,
    },
    {
      id: 'pres-data',
      type: 'data',
      description: 'Update data and charts in presentation',
      priority: 'high',
      automatable: true,
      suggestedAction: 'Pull latest data for charts',
      requiredTools: ['analytics', 'spreadsheet'],
      estimatedTime: 20,
      confidence: 80,
    },
  ],
};

// ============================================================================
// PREDICTIVE ENGINE CLASS
// ============================================================================

/**
 * Main Predictive Intelligence Engine
 *
 * Provides "before you ask" anticipation of user needs through:
 * - Calendar event analysis
 * - Time-based pattern recognition
 * - Regional awareness (Kuwait/GCC focus)
 * - Continuous learning from feedback
 */
export class PredictiveEngine {
  private config: PredictiveConfig;
  private activePredictions: Map<string, ActivePrediction> = new Map();
  private patternHistory: Map<TimePattern, PatternPrediction> = new Map();
  private predictionHistory: CalendarPrediction[] = [];
  private accuracyMetrics: PredictionAccuracy;
  private userFeedbackHistory: Map<string, PredictionFeedback[]> = new Map();

  /**
   * Create a new Predictive Engine instance
   *
   * @param config - Configuration options
   */
  constructor(config: Partial<PredictiveConfig> = {}) {
    this.config = { ...DEFAULT_PREDICTIVE_CONFIG, ...config };
    this.initializeRegionalConfigs();
    this.initializeEventTypeConfigs();
    this.accuracyMetrics = this.initializeAccuracyMetrics();
    this.initializePatternHistory();
  }

  // ========================================
  // INITIALIZATION METHODS
  // ========================================

  /**
   * Initialize regional configurations
   */
  private initializeRegionalConfigs(): void {
    GCC_REGIONAL_PATTERNS.forEach((pattern, region) => {
      this.config.regionalConfigs.set(region, pattern);
    });
  }

  /**
   * Initialize event type configurations
   */
  private initializeEventTypeConfigs(): void {
    DEFAULT_EVENT_TYPE_CONFIGS.forEach((config) => {
      this.config.eventTypeConfigs.set(config.type, config);
    });
  }

  /**
   * Initialize accuracy metrics
   */
  private initializeAccuracyMetrics(): PredictionAccuracy {
    return {
      overallAccuracy: 0,
      byType: {},
      byPattern: {} as Record<TimePattern, PatternAccuracyMetrics>,
      byDomain: {},
      totalPredictions: 0,
      acceptedPredictions: 0,
      helpfulPredictions: 0,
      averageConfidence: 0,
      trend: 'stable',
      lastUpdated: new Date(),
    };
  }

  /**
   * Initialize pattern history with default patterns
   */
  private initializePatternHistory(): void {
    const patterns: TimePattern[] = [
      'monday_morning', 'friday_afternoon', 'end_of_month', 'end_of_quarter',
      'sunday_morning', 'thursday_afternoon', 'ramadan_hours', 'first_of_month',
      'mid_month', 'quarter_start', 'year_start', 'daily_start', 'daily_end',
    ];

    patterns.forEach((pattern) => {
      this.patternHistory.set(pattern, {
        id: `pattern_${pattern}`,
        pattern,
        patternDescription: this.getPatternDescription(pattern),
        predictedWorkflows: [],
        suggestedWorkflows: [],
        historicalAccuracy: 50, // Start with neutral accuracy
        triggerCount: 0,
        accurateCount: 0,
        confidence: 50,
        active: true,
        feedbackHistory: [],
      });
    });
  }

  /**
   * Get human-readable description for a pattern
   */
  private getPatternDescription(pattern: TimePattern): string {
    const descriptions: Record<TimePattern, string> = {
      monday_morning: 'Monday morning - Week start planning',
      friday_afternoon: 'Friday afternoon - Week wrap-up',
      end_of_month: 'End of month - Financial close tasks',
      end_of_quarter: 'End of quarter - Review cycle',
      end_of_year: 'End of year - Annual close',
      sunday_morning: 'Sunday morning - Kuwait/GCC work week start',
      thursday_afternoon: 'Thursday afternoon - Kuwait/GCC week-end prep',
      ramadan_hours: 'Ramadan - Adjusted business hours',
      first_of_month: 'First of month - New month tasks',
      mid_month: 'Mid month - Progress check',
      quarter_start: 'Quarter start - New quarter planning',
      year_start: 'Year start - Annual planning',
      daily_start: 'Daily start - Morning routine',
      daily_end: 'Daily end - Day wrap-up',
      lunch_break: 'Lunch break',
      custom: 'Custom pattern',
    };

    return descriptions[pattern] || pattern;
  }

  // ========================================
  // CALENDAR PREDICTION METHODS
  // ========================================

  /**
   * Analyze calendar events and generate predictions
   *
   * @param events - Array of calendar events to analyze
   * @param region - Region code for regional adjustments (default: config default)
   * @returns Array of calendar predictions
   */
  analyzeCalendar(
    events: CalendarEvent[],
    region: string = this.config.defaultRegion
  ): CalendarPrediction[] {
    const predictions: CalendarPrediction[] = [];
    const now = new Date();

    // Sort events by start time
    const sortedEvents = [...events].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Filter to upcoming events within look-ahead window
    const lookAheadEnd = new Date(
      now.getTime() + this.config.calendarLookAheadDays * 24 * 60 * 60 * 1000
    );

    const upcomingEvents = sortedEvents.filter(
      (event) => event.startTime >= now && event.startTime <= lookAheadEnd
    );

    for (const event of upcomingEvents) {
      const prediction = this.analyzeEvent(event, region);
      if (prediction && prediction.confidence >= this.config.minConfidenceThreshold) {
        predictions.push(prediction);
      }
    }

    // Sort by urgency and confidence
    predictions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    // Store in history
    this.predictionHistory.push(...predictions);

    return predictions;
  }

  /**
   * Analyze a single calendar event
   */
  private analyzeEvent(
    event: CalendarEvent,
    region: string
  ): CalendarPrediction | null {
    const eventType = this.classifyEventType(event);
    const typeConfig = this.config.eventTypeConfigs.get(eventType);

    const predictedNeeds = this.predictMeetingNeeds(event, eventType);
    const suggestedWorkflows = this.suggestPreparation(event, predictedNeeds);

    if (predictedNeeds.length === 0 && suggestedWorkflows.length === 0) {
      return null;
    }

    const prepTime = typeConfig?.defaultPrepTime || this.config.defaultPreparationTime;
    const confidence = this.calculateEventConfidence(event, eventType, predictedNeeds);
    const urgency = this.calculateUrgency(event, confidence);

    const showAt = new Date(event.startTime.getTime() - prepTime * 60 * 1000);

    return {
      id: `cal_pred_${event.id}_${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      eventType,
      predictedNeeds,
      suggestedWorkflows,
      preparationTime: prepTime,
      confidence,
      showAt,
      eventTime: event.startTime,
      urgency,
      acted: false,
      tags: [eventType, region],
      regionalContext: region,
    };
  }

  /**
   * Classify the type of calendar event based on title and other properties
   */
  private classifyEventType(event: CalendarEvent): CalendarEventType {
    // If type is already specified, use it
    if (event.type) return event.type;

    const titleLower = event.title.toLowerCase();
    const descLower = (event.description || '').toLowerCase();
    const combinedText = `${titleLower} ${descLower}`;

    // Check against keyword patterns
    for (const [type, keywords] of Object.entries(MEETING_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          // Map internal types to CalendarEventType
          const typeMap: Record<string, CalendarEventType> = {
            standup: 'meeting',
            review: 'review',
            planning: 'meeting',
            oneonone: 'meeting',
            client: 'meeting',
            allhands: 'meeting',
            interview: 'interview',
            training: 'training',
            presentation: 'presentation',
            brainstorm: 'meeting',
          };
          return typeMap[type] || 'meeting';
        }
      }
    }

    // Check event type configs
    for (const [configType, config] of Array.from(this.config.eventTypeConfigs.entries())) {
      for (const keyword of config.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          return configType;
        }
      }
    }

    // Default to meeting if has attendees, otherwise other
    return event.attendees && event.attendees.length > 0 ? 'meeting' : 'other';
  }

  /**
   * Predict needs for a meeting or event
   *
   * @param event - The calendar event
   * @param eventType - Classified event type
   * @returns Array of predicted needs
   */
  predictMeetingNeeds(
    event: CalendarEvent,
    eventType?: CalendarEventType
  ): PredictedNeed[] {
    const type = eventType || this.classifyEventType(event);
    const needs: PredictedNeed[] = [];

    // Get meeting type-specific needs
    const titleLower = event.title.toLowerCase();
    for (const [meetingType, keywords] of Object.entries(MEETING_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          const typeNeeds = MEETING_PREP_NEEDS[meetingType];
          if (typeNeeds) {
            needs.push(
              ...typeNeeds.map((need) => ({
                ...need,
                id: `${need.id}_${event.id}`,
                triggerKeywords: [keyword],
              }))
            );
          }
          break;
        }
      }
    }

    // Add generic needs based on event type
    const typeConfig = this.config.eventTypeConfigs.get(type);
    if (typeConfig) {
      for (const needType of typeConfig.commonNeeds) {
        // Avoid duplicating needs already added
        if (!needs.some((n) => n.type === needType)) {
          needs.push({
            id: `generic_${needType}_${event.id}`,
            type: needType,
            description: this.getGenericNeedDescription(needType, event),
            priority: 'medium',
            automatable: ['document', 'data', 'notification'].includes(needType),
            confidence: typeConfig.confidenceMultiplier * 60,
          });
        }
      }
    }

    // Add communication needs if there are attendees
    if (event.attendees && event.attendees.length > 0) {
      needs.push({
        id: `comm_${event.id}`,
        type: 'communication',
        description: `Send meeting reminder or updates to ${event.attendees.length} attendees`,
        priority: 'low',
        automatable: true,
        suggestedAction: 'Send meeting reminder',
        requiredTools: ['email', 'calendar'],
        estimatedTime: 5,
        confidence: 65,
      });
    }

    // Add followup need for meetings
    if (type === 'meeting' || type === 'review') {
      needs.push({
        id: `followup_${event.id}`,
        type: 'followup',
        description: 'Schedule follow-up or send meeting notes',
        priority: 'medium',
        automatable: true,
        suggestedAction: 'Generate meeting notes template',
        estimatedTime: 10,
        confidence: 60,
      });
    }

    return needs;
  }

  /**
   * Get generic description for a need type
   */
  private getGenericNeedDescription(
    needType: PredictedNeedType,
    event: CalendarEvent
  ): string {
    const descriptions: Record<PredictedNeedType, string> = {
      document: `Prepare documents for ${event.title}`,
      data: `Gather relevant data for ${event.title}`,
      communication: `Send communications about ${event.title}`,
      task: `Complete tasks before ${event.title}`,
      preparation: `Prepare for ${event.title}`,
      followup: `Follow up after ${event.title}`,
      reminder: `Set reminder for ${event.title}`,
      notification: `Send notifications about ${event.title}`,
      report: `Prepare report for ${event.title}`,
      review: `Review materials for ${event.title}`,
      approval: `Get approvals before ${event.title}`,
      booking: `Make bookings for ${event.title}`,
      resource: `Allocate resources for ${event.title}`,
    };

    return descriptions[needType] || `Prepare for ${event.title}`;
  }

  /**
   * Suggest preparation workflows for an event
   *
   * @param event - The calendar event
   * @param needs - Predicted needs for the event
   * @returns Array of suggested workflows
   */
  suggestPreparation(
    event: CalendarEvent,
    needs: PredictedNeed[]
  ): SuggestedWorkflow[] {
    const workflows: SuggestedWorkflow[] = [];
    const eventType = event.type || this.classifyEventType(event);

    // Group needs by automatable status
    const automatableNeeds = needs.filter((n) => n.automatable);

    if (automatableNeeds.length > 0) {
      // Create an automated preparation workflow
      const prepWorkflow: SuggestedWorkflow = {
        id: `auto_prep_${event.id}`,
        name: `Automated Preparation for ${event.title}`,
        description: `Automatically prepare for your ${eventType} by gathering documents and data`,
        category: 'preparation',
        steps: automatableNeeds.map((need, index) => ({
          stepNumber: index + 1,
          name: need.description,
          description: need.suggestedAction || need.description,
          tool: need.requiredTools?.[0],
          actionType: this.getActionTypeForNeed(need.type),
          requiresInput: false,
          estimatedTime: need.estimatedTime || 5,
        })),
        estimatedDuration: automatableNeeds.reduce(
          (sum, n) => sum + (n.estimatedTime || 5),
          0
        ),
        confidence: Math.round(
          automatableNeeds.reduce((sum, n) => sum + n.confidence, 0) /
            automatableNeeds.length
        ),
        priority: this.getPriorityFromNeeds(automatableNeeds),
        requiredIntegrations: Array.from(
          new Set(automatableNeeds.flatMap((n) => n.requiredTools || []))
        ),
        canAutoRun: true,
        optimalTriggerTime: this.calculateOptimalTriggerTime(event, automatableNeeds),
        tags: [eventType, 'automated', 'preparation'],
      };

      workflows.push(prepWorkflow);
    }

    // Add notification workflow if there are attendees
    if (event.attendees && event.attendees.length > 0) {
      workflows.push({
        id: `notify_${event.id}`,
        name: `Send Meeting Reminders`,
        description: `Send reminder notifications to ${event.attendees.length} attendees`,
        category: 'communication',
        steps: [
          {
            stepNumber: 1,
            name: 'Generate reminder content',
            description: 'Create personalized meeting reminder',
            actionType: 'generate',
            requiresInput: false,
            estimatedTime: 2,
          },
          {
            stepNumber: 2,
            name: 'Send reminders',
            description: 'Send reminders to all attendees',
            tool: 'email',
            actionType: 'send',
            requiresInput: false,
            estimatedTime: 3,
          },
        ],
        estimatedDuration: 5,
        confidence: 70,
        priority: 'low',
        requiredIntegrations: ['email', 'calendar'],
        canAutoRun: true,
        optimalTriggerTime: 60, // 1 hour before
        tags: ['notification', 'reminder'],
      });
    }

    return workflows;
  }

  /**
   * Get action type for a need type
   */
  private getActionTypeForNeed(
    needType: PredictedNeedType
  ): 'fetch' | 'create' | 'update' | 'send' | 'notify' | 'analyze' | 'generate' {
    const actionMap: Record<
      PredictedNeedType,
      'fetch' | 'create' | 'update' | 'send' | 'notify' | 'analyze' | 'generate'
    > = {
      document: 'fetch',
      data: 'fetch',
      communication: 'send',
      task: 'create',
      preparation: 'generate',
      followup: 'create',
      reminder: 'notify',
      notification: 'notify',
      report: 'generate',
      review: 'analyze',
      approval: 'send',
      booking: 'create',
      resource: 'fetch',
    };

    return actionMap[needType] || 'fetch';
  }

  /**
   * Get priority from needs
   */
  private getPriorityFromNeeds(
    needs: PredictedNeed[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (needs.some((n) => n.priority === 'critical')) return 'critical';
    if (needs.some((n) => n.priority === 'high')) return 'high';
    if (needs.some((n) => n.priority === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * Calculate optimal trigger time based on event and needs
   */
  private calculateOptimalTriggerTime(
    _event: CalendarEvent,
    needs: PredictedNeed[]
  ): number {
    // Sum up estimated times and add buffer
    const totalEstimatedTime = needs.reduce(
      (sum, n) => sum + (n.estimatedTime || 5),
      0
    );

    // Add 50% buffer
    return Math.round(totalEstimatedTime * 1.5);
  }

  /**
   * Calculate confidence for an event prediction
   */
  private calculateEventConfidence(
    event: CalendarEvent,
    eventType: CalendarEventType,
    needs: PredictedNeed[]
  ): number {
    let confidence = 50; // Base confidence

    // Boost for recognized event type
    const typeConfig = this.config.eventTypeConfigs.get(eventType);
    if (typeConfig) {
      confidence *= typeConfig.confidenceMultiplier;
    }

    // Boost for recurring events (more predictable)
    if (event.recurrence) {
      confidence += 15;
    }

    // Boost for events with attendees (more likely to need prep)
    if (event.attendees && event.attendees.length > 0) {
      confidence += 10;
    }

    // Boost based on needs confidence
    if (needs.length > 0) {
      const avgNeedConfidence =
        needs.reduce((sum, n) => sum + n.confidence, 0) / needs.length;
      confidence = (confidence + avgNeedConfidence) / 2;
    }

    // Apply historical accuracy adjustment
    const historicalFactor = this.getHistoricalAccuracyFactor(eventType);
    confidence *= historicalFactor;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Get historical accuracy factor for an event type
   */
  private getHistoricalAccuracyFactor(eventType: CalendarEventType): number {
    const typeAccuracy = this.accuracyMetrics.byType[eventType];
    if (!typeAccuracy || typeAccuracy.total < this.config.minHistoricalDataPoints) {
      return 1.0; // No adjustment if insufficient data
    }

    // Factor ranges from 0.7 to 1.3 based on accuracy
    return 0.7 + (typeAccuracy.accuracy / 100) * 0.6;
  }

  /**
   * Calculate urgency for a prediction
   */
  private calculateUrgency(
    event: CalendarEvent,
    confidence: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const now = new Date();
    const hoursUntilEvent =
      (event.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Event priority
    if (event.priority === 'critical') return 'critical';
    if (event.priority === 'high') return 'high';

    // Time-based urgency
    if (hoursUntilEvent < 2) return 'critical';
    if (hoursUntilEvent < 6) return 'high';
    if (hoursUntilEvent < 24) return 'medium';

    // Confidence-based adjustment
    if (confidence >= 80 && hoursUntilEvent < 48) return 'high';
    if (confidence >= 70 && hoursUntilEvent < 48) return 'medium';

    return 'low';
  }

  // ========================================
  // PATTERN PREDICTION METHODS
  // ========================================

  /**
   * Analyze time patterns and generate predictions
   *
   * @param currentTime - Current time for analysis
   * @param region - Region code for regional patterns
   * @returns Array of pattern predictions
   */
  analyzeTimePatterns(
    currentTime: Date = new Date(),
    region: string = this.config.defaultRegion
  ): PatternPrediction[] {
    const predictions: PatternPrediction[] = [];
    const regionalConfig = this.config.regionalConfigs.get(region);

    if (!regionalConfig) {
      return predictions;
    }

    const dayOfWeek = this.getDayName(currentTime.getDay());
    const timeStr = this.getTimeString(currentTime);

    // Check each regional pattern
    for (const patternConfig of regionalConfig.patterns) {
      if (!patternConfig.active) continue;

      // Check if day matches
      const dayMatches =
        patternConfig.days.includes('*') ||
        patternConfig.days.includes(dayOfWeek);

      if (!dayMatches) continue;

      // Check if time is within range or upcoming
      const isWithinRange = this.isTimeInRange(
        timeStr,
        patternConfig.timeRange.start,
        patternConfig.timeRange.end
      );
      const isUpcoming = this.isTimeUpcoming(
        timeStr,
        patternConfig.timeRange.start,
        this.config.patternLookAheadHours
      );

      if (isWithinRange || isUpcoming) {
        const prediction = this.createPatternPrediction(patternConfig, region);
        if (prediction.confidence >= this.config.minConfidenceThreshold) {
          predictions.push(prediction);
        }
      }
    }

    // Check for special patterns
    const specialPatterns = this.checkSpecialPatterns(currentTime, region);
    predictions.push(...specialPatterns);

    return predictions;
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayNum: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  }

  /**
   * Get time string in HH:MM format
   */
  private getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Check if time is within a range
   */
  private isTimeInRange(time: string, start: string, end: string): boolean {
    return time >= start && time <= end;
  }

  /**
   * Check if time is upcoming within hours
   */
  private isTimeUpcoming(time: string, targetStart: string, lookAheadHours: number): boolean {
    const [currentH, currentM] = time.split(':').map(Number);
    const [targetH, targetM] = targetStart.split(':').map(Number);

    const currentMinutes = currentH * 60 + currentM;
    const targetMinutes = targetH * 60 + targetM;
    const lookAheadMinutes = lookAheadHours * 60;

    const diff = targetMinutes - currentMinutes;
    return diff > 0 && diff <= lookAheadMinutes;
  }

  /**
   * Create a pattern prediction
   */
  private createPatternPrediction(
    config: RegionalPatternConfig,
    region: string
  ): PatternPrediction {
    const existing = this.patternHistory.get(config.pattern);

    // Calculate confidence based on history and base confidence
    let confidence = config.baseConfidence;
    if (existing) {
      // Weight historical accuracy
      const historicalWeight = Math.min(existing.triggerCount / 10, 1);
      confidence =
        config.baseConfidence * (1 - historicalWeight) +
        existing.historicalAccuracy * historicalWeight;
    }

    // Create suggested workflows
    const suggestedWorkflows: SuggestedWorkflow[] = config.predictedWorkflows.map(
      (workflowName, index) => ({
        id: `pattern_wf_${config.pattern}_${index}`,
        name: workflowName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Suggested workflow for ${config.description}`,
        category: 'pattern',
        steps: [],
        estimatedDuration: 15,
        confidence,
        priority: 'medium' as const,
        requiredIntegrations: [],
        canAutoRun: false,
        optimalTriggerTime: 15,
        tags: [config.pattern, region],
      })
    );

    return {
      id: `pattern_${config.pattern}_${Date.now()}`,
      pattern: config.pattern,
      patternDescription: config.description,
      predictedWorkflows: config.predictedWorkflows,
      suggestedWorkflows,
      historicalAccuracy: existing?.historicalAccuracy || 50,
      triggerCount: (existing?.triggerCount || 0) + 1,
      accurateCount: existing?.accurateCount || 0,
      lastTriggered: new Date(),
      confidence: Math.round(confidence),
      region,
      active: true,
      feedbackHistory: existing?.feedbackHistory || [],
    };
  }

  /**
   * Check for special patterns (end of month, quarter, etc.)
   */
  private checkSpecialPatterns(currentTime: Date, region: string): PatternPrediction[] {
    const predictions: PatternPrediction[] = [];
    const day = currentTime.getDate();
    const month = currentTime.getMonth();
    const daysInMonth = new Date(
      currentTime.getFullYear(),
      month + 1,
      0
    ).getDate();

    // End of month (last 3 days)
    if (day >= daysInMonth - 2) {
      predictions.push(
        this.createSpecialPatternPrediction('end_of_month', region, {
          description: 'End of month - Financial close and reporting tasks',
          workflows: ['financial-close', 'monthly-report', 'invoice-processing'],
          confidence: 80,
        })
      );
    }

    // First of month (first 3 days)
    if (day <= 3) {
      predictions.push(
        this.createSpecialPatternPrediction('first_of_month', region, {
          description: 'First of month - New month planning',
          workflows: ['monthly-planning', 'budget-review'],
          confidence: 70,
        })
      );
    }

    // End of quarter (last week of Mar, Jun, Sep, Dec)
    const isEndOfQuarter =
      [2, 5, 8, 11].includes(month) && day >= daysInMonth - 6;
    if (isEndOfQuarter) {
      predictions.push(
        this.createSpecialPatternPrediction('end_of_quarter', region, {
          description: 'End of quarter - Quarterly review and reporting',
          workflows: ['quarterly-review', 'kpi-reporting', 'budget-review'],
          confidence: 85,
        })
      );
    }

    // Check for holiday proximity
    const holidayPredictions = this.checkHolidayProximity(currentTime, region);
    predictions.push(...holidayPredictions);

    return predictions;
  }

  /**
   * Create a special pattern prediction
   */
  private createSpecialPatternPrediction(
    pattern: TimePattern,
    region: string,
    config: {
      description: string;
      workflows: string[];
      confidence: number;
    }
  ): PatternPrediction {
    return {
      id: `special_${pattern}_${Date.now()}`,
      pattern,
      patternDescription: config.description,
      predictedWorkflows: config.workflows,
      suggestedWorkflows: config.workflows.map((wf, index) => ({
        id: `special_wf_${pattern}_${index}`,
        name: wf.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Part of ${config.description}`,
        category: 'pattern',
        steps: [],
        estimatedDuration: 30,
        confidence: config.confidence,
        priority: 'high' as const,
        requiredIntegrations: [],
        canAutoRun: false,
        optimalTriggerTime: 60,
        tags: [pattern, region, 'special'],
      })),
      historicalAccuracy: config.confidence,
      triggerCount: 1,
      accurateCount: 0,
      lastTriggered: new Date(),
      confidence: config.confidence,
      region,
      active: true,
      feedbackHistory: [],
    };
  }

  /**
   * Check for upcoming holidays and generate predictions
   */
  private checkHolidayProximity(currentTime: Date, region: string): PatternPrediction[] {
    const predictions: PatternPrediction[] = [];

    try {
      const holidays = getGCCHolidays(region as GCCCountryCode, currentTime.getFullYear());
      const regionalConfig = this.config.regionalConfigs.get(region);
      const planningDays = regionalConfig?.holidayAwareness.planningDays || 3;

      for (const holiday of holidays) {
        const daysUntilHoliday = Math.ceil(
          (holiday.startDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilHoliday > 0 && daysUntilHoliday <= planningDays) {
          const workflows = regionalConfig?.holidayAwareness.preHolidayWorkflows || [
            'out-of-office',
            'handover',
          ];

          predictions.push({
            id: `holiday_${holiday.name.replace(/\s+/g, '_')}_${Date.now()}`,
            pattern: 'custom',
            patternDescription: `${holiday.name} in ${daysUntilHoliday} day(s) - Prepare for holiday`,
            predictedWorkflows: workflows,
            suggestedWorkflows: workflows.map((wf, index) => ({
              id: `holiday_wf_${index}`,
              name: wf.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              description: `Prepare for ${holiday.name}`,
              category: 'holiday',
              steps: [],
              estimatedDuration: 20,
              confidence: 85,
              priority: daysUntilHoliday === 1 ? 'critical' as const : 'high' as const,
              requiredIntegrations: ['email', 'calendar'],
              canAutoRun: true,
              optimalTriggerTime: 120,
              tags: ['holiday', region, holiday.type],
            })),
            historicalAccuracy: 85,
            triggerCount: 1,
            accurateCount: 0,
            lastTriggered: new Date(),
            confidence: 85,
            region,
            active: true,
            feedbackHistory: [],
          });
        }
      }
    } catch {
      // If region is not GCC, skip holiday check
    }

    return predictions;
  }

  /**
   * Get predictions for the current moment
   *
   * @param userId - User ID for personalization
   * @param region - Region code
   * @returns Array of active predictions
   */
  getPredictionsForNow(
    _userId?: string,
    region: string = this.config.defaultRegion
  ): ActivePrediction[] {
    const now = new Date();
    const predictions: ActivePrediction[] = [];

    // Get pattern predictions
    const patternPredictions = this.analyzeTimePatterns(now, region);
    for (const pattern of patternPredictions) {
      predictions.push({
        id: `active_${pattern.id}`,
        type: 'pattern',
        prediction: pattern,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
        priority: pattern.confidence,
        seen: false,
        dismissed: false,
        actions: [],
      });
    }

    // Sort by priority and limit
    predictions.sort((a, b) => b.priority - a.priority);
    return predictions.slice(0, this.config.maxActivePredictions);
  }

  // ========================================
  // LEARNING AND FEEDBACK METHODS
  // ========================================

  /**
   * Record the outcome of a prediction
   *
   * @param predictionId - ID of the prediction
   * @param accepted - Whether the user accepted the prediction
   * @param feedback - Optional feedback details
   */
  recordPredictionOutcome(
    predictionId: string,
    accepted: boolean,
    feedback?: Partial<PredictionFeedback>
  ): void {
    if (!this.config.enableLearning) return;

    const feedbackRecord: PredictionFeedback = {
      timestamp: new Date(),
      helpful: accepted,
      actionTaken: accepted,
      ...feedback,
    };

    // Update user feedback history
    const userFeedback = this.userFeedbackHistory.get(predictionId) || [];
    userFeedback.push(feedbackRecord);
    this.userFeedbackHistory.set(predictionId, userFeedback);

    // Update accuracy metrics
    this.updateAccuracyMetrics(predictionId, accepted, feedbackRecord);

    // Update pattern history if applicable
    this.updatePatternHistory(predictionId, accepted);

    // Update prediction history
    const prediction = this.predictionHistory.find((p) => p.id === predictionId);
    if (prediction) {
      prediction.feedback = feedbackRecord;
      prediction.acted = accepted;
    }
  }

  /**
   * Update accuracy metrics based on feedback
   */
  private updateAccuracyMetrics(
    _predictionId: string,
    accepted: boolean,
    feedback: PredictionFeedback
  ): void {
    this.accuracyMetrics.totalPredictions++;
    if (accepted) {
      this.accuracyMetrics.acceptedPredictions++;
    }
    if (feedback.helpful) {
      this.accuracyMetrics.helpfulPredictions++;
    }

    // Recalculate overall accuracy
    this.accuracyMetrics.overallAccuracy = Math.round(
      (this.accuracyMetrics.helpfulPredictions /
        this.accuracyMetrics.totalPredictions) *
        100
    );

    this.accuracyMetrics.lastUpdated = new Date();

    // Determine trend
    this.accuracyMetrics.trend = this.calculateTrend();
  }

  /**
   * Calculate accuracy trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    // Simple trend calculation based on recent accuracy
    // In production, this would use more sophisticated analysis
    const currentAccuracy = this.accuracyMetrics.overallAccuracy;

    if (currentAccuracy >= 70) return 'improving';
    if (currentAccuracy >= 50) return 'stable';
    return 'declining';
  }

  /**
   * Update pattern history based on feedback
   */
  private updatePatternHistory(predictionId: string, accepted: boolean): void {
    // Find which pattern this prediction came from
    for (const [pattern, history] of Array.from(this.patternHistory.entries())) {
      if (predictionId.includes(pattern)) {
        history.triggerCount++;
        if (accepted) {
          history.accurateCount++;
        }

        // Recalculate historical accuracy
        history.historicalAccuracy = Math.round(
          (history.accurateCount / history.triggerCount) * 100
        );

        // Update confidence based on accuracy
        history.confidence = Math.round(
          (history.historicalAccuracy + history.confidence) / 2
        );

        break;
      }
    }
  }

  /**
   * Get accuracy metrics for all predictions
   *
   * @returns Current accuracy metrics
   */
  getAccuracyMetrics(): PredictionAccuracy {
    return { ...this.accuracyMetrics };
  }

  // ========================================
  // REGIONAL AWARENESS METHODS
  // ========================================

  /**
   * Get regional patterns for a country
   *
   * @param countryCode - ISO country code
   * @returns Array of time patterns for the region
   */
  getRegionalPatterns(countryCode: string): TimePattern[] {
    const regionalConfig = this.config.regionalConfigs.get(countryCode.toUpperCase());
    if (!regionalConfig) {
      return [];
    }

    return regionalConfig.patterns.map((p) => p.pattern);
  }

  /**
   * Adjust prediction for a specific timezone
   *
   * @param prediction - The prediction to adjust
   * @param timezone - IANA timezone identifier
   * @returns Adjusted prediction
   */
  adjustForTimezone<T extends CalendarPrediction | PatternPrediction>(
    prediction: T,
    timezone: string
  ): T {
    // Clone the prediction
    const adjusted = { ...prediction };

    // For calendar predictions, adjust times
    if ('showAt' in adjusted && 'eventTime' in adjusted) {
      const calPred = adjusted as unknown as CalendarPrediction;
      // In production, use a proper timezone library
      // For now, just return as-is with timezone noted
      calPred.tags = [...(calPred.tags || []), `tz:${timezone}`];
    }

    return adjusted;
  }

  /**
   * Check if it's currently Ramadan (approximate)
   *
   * @param date - Date to check
   * @returns Whether it's likely Ramadan
   */
  isRamadan(date: Date = new Date()): boolean {
    // Ramadan dates shift by ~11 days each year
    // This is an approximation - in production, use proper Islamic calendar
    const year = date.getFullYear();
    const baseYear = 2024;
    const baseRamadanStart = new Date(2024, 2, 10); // March 10, 2024

    const yearDiff = year - baseYear;
    const dayShift = yearDiff * -11;

    const estimatedStart = new Date(baseRamadanStart);
    estimatedStart.setDate(estimatedStart.getDate() + dayShift);

    const estimatedEnd = new Date(estimatedStart);
    estimatedEnd.setDate(estimatedEnd.getDate() + 30);

    return date >= estimatedStart && date <= estimatedEnd;
  }

  /**
   * Get current business hours for a region
   *
   * @param region - Region code
   * @param checkRamadan - Whether to check for Ramadan hours
   * @returns Business hours configuration
   */
  getCurrentBusinessHours(
    region: string,
    checkRamadan: boolean = true
  ): BusinessHoursConfig {
    const regionalConfig = this.config.regionalConfigs.get(region);

    if (!regionalConfig) {
      // Default hours
      return {
        standard: { start: '09:00', end: '17:00' },
      };
    }

    // Check if it's Ramadan
    if (checkRamadan && this.isRamadan() && regionalConfig.businessHours.ramadan) {
      return {
        ...regionalConfig.businessHours,
        standard: regionalConfig.businessHours.ramadan,
      };
    }

    return regionalConfig.businessHours;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Clear all active predictions
   */
  clearActivePredictions(): void {
    this.activePredictions.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): PredictiveConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param updates - Partial configuration to update
   */
  updateConfig(updates: Partial<PredictiveConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Export prediction history for analysis
   *
   * @returns Array of historical predictions
   */
  exportHistory(): {
    predictions: CalendarPrediction[];
    patterns: PatternPrediction[];
    accuracy: PredictionAccuracy;
  } {
    return {
      predictions: [...this.predictionHistory],
      patterns: Array.from(this.patternHistory.values()),
      accuracy: this.getAccuracyMetrics(),
    };
  }

  /**
   * Reset the engine state (for testing)
   */
  reset(): void {
    this.activePredictions.clear();
    this.predictionHistory = [];
    this.userFeedbackHistory.clear();
    this.accuracyMetrics = this.initializeAccuracyMetrics();
    this.initializePatternHistory();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new Predictive Engine instance with optional configuration
 *
 * @param config - Optional configuration overrides
 * @returns New PredictiveEngine instance
 *
 * @example
 * // Create with default Kuwait focus
 * const engine = createPredictiveEngine();
 *
 * // Create for UAE
 * const uaeEngine = createPredictiveEngine({ defaultRegion: 'AE' });
 */
export function createPredictiveEngine(
  config: Partial<PredictiveConfig> = {}
): PredictiveEngine {
  return new PredictiveEngine(config);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default singleton instance of the Predictive Engine
 * Pre-configured for Kuwait region
 */
export const predictiveEngine = new PredictiveEngine();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick analysis of calendar events
 *
 * @param events - Calendar events to analyze
 * @param region - Region code
 * @returns Array of predictions
 */
export function analyzeCalendarQuick(
  events: CalendarEvent[],
  region: string = 'KW'
): CalendarPrediction[] {
  return predictiveEngine.analyzeCalendar(events, region);
}

/**
 * Get current pattern-based predictions
 *
 * @param region - Region code
 * @returns Array of active predictions
 */
export function getCurrentPredictions(region: string = 'KW'): ActivePrediction[] {
  return predictiveEngine.getPredictionsForNow(undefined, region);
}

/**
 * Check if it's currently a special period
 *
 * @param period - Period type to check
 * @param date - Date to check
 * @returns Whether the period is active
 */
export function isSpecialPeriod(
  period: 'ramadan' | 'holiday_season' | 'end_of_quarter' | 'end_of_month',
  date: Date = new Date()
): boolean {
  switch (period) {
    case 'ramadan':
      return predictiveEngine.isRamadan(date);
    case 'end_of_quarter':
      const month = date.getMonth();
      const day = date.getDate();
      const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
      return [2, 5, 8, 11].includes(month) && day >= daysInMonth - 6;
    case 'end_of_month':
      const dom = date.getDate();
      const dim = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return dom >= dim - 2;
    case 'holiday_season':
      // Generic - would need more specific implementation
      return false;
    default:
      return false;
  }
}

/**
 * Get meeting preparation checklist
 *
 * @param event - Calendar event
 * @returns Array of preparation items
 */
export function getMeetingPrepChecklist(event: CalendarEvent): PredictedNeed[] {
  return predictiveEngine.predictMeetingNeeds(event);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Main class
  PredictiveEngine,

  // Factory and singleton
  createPredictiveEngine,
  predictiveEngine,

  // Quick helpers
  analyzeCalendarQuick,
  getCurrentPredictions,
  isSpecialPeriod,
  getMeetingPrepChecklist,

  // Configurations
  DEFAULT_PREDICTIVE_CONFIG,
  DEFAULT_EVENT_TYPE_CONFIGS,

  // Regional patterns
  KUWAIT_REGIONAL_PATTERNS,
  UAE_REGIONAL_PATTERNS,
  SAUDI_REGIONAL_PATTERNS,
  GCC_REGIONAL_PATTERNS,

  // Meeting data
  MEETING_TYPE_KEYWORDS,
  MEETING_PREP_NEEDS,
};
