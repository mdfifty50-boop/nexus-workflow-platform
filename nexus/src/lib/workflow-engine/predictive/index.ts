/**
 * Predictive Intelligence Module
 *
 * Exports all predictive engine functionality for "before you ask" anticipation.
 *
 * @module predictive
 */

export {
  // Main class
  PredictiveEngine,

  // Factory function and singleton
  createPredictiveEngine,
  predictiveEngine,

  // Quick helper functions
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

  // Types - Calendar
  type CalendarEvent,
  type CalendarEventType,
  type RecurrencePattern,
  type CalendarAttendee,
  type CalendarPrediction,
  type PredictedNeed,
  type PredictedNeedType,
  type SuggestedWorkflow,
  type SuggestedWorkflowStep,

  // Types - Pattern
  type TimePattern,
  type PatternPrediction,
  type PredictionFeedback,
  type ActivePrediction,
  type PredictionAction,

  // Types - Accuracy
  type PredictionAccuracy,
  type TypeAccuracy,
  type PatternAccuracyMetrics,

  // Types - Regional
  type RegionalTimePattern,
  type RegionalPatternConfig,
  type WorkWeekConfig,
  type HolidayAwarenessConfig,
  type BusinessHoursConfig,
  type SpecialPeriodConfig,

  // Types - Configuration
  type PredictiveConfig,
  type EventTypeConfig,
} from './predictive-engine';

// Default export
export { default } from './predictive-engine';
