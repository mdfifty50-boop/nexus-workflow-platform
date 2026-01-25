/**
 * Chat Embed Components
 *
 * Inline preview components that display within chat messages,
 * similar to how ChatGPT shows PDF previews inline.
 *
 * Usage:
 * ```tsx
 * import {
 *   WorkflowPreviewEmbed,
 *   TemplatePreviewEmbed,
 *   IntegrationPreviewEmbed,
 *   ExecutionResultEmbed,
 *   WorkflowDiagramMini,
 *   EmbedContainer,
 * } from '@/components/chat/embeds'
 * ```
 */

// Type definitions
export * from './embed-types'

// Container components
export { EmbedContainer, EmbedActionButton, EmbedSection } from './EmbedContainer'
export type { EmbedActionButtonProps, EmbedSectionProps } from './EmbedContainer'

// Mini diagram component
export { WorkflowDiagramMini, WorkflowDiagramMiniVertical } from './WorkflowDiagramMini'

// Preview embed components
export { WorkflowPreviewEmbed } from './WorkflowPreviewEmbed'
export { TemplatePreviewEmbed } from './TemplatePreviewEmbed'
export { IntegrationPreviewEmbed } from './IntegrationPreviewEmbed'
export { ExecutionResultEmbed } from './ExecutionResultEmbed'
