import { createClient } from '@supabase/supabase-js';
import { tieredCalls, callClaudeWithTiering, recordTieringMetrics } from './claudeProxy.js';
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
// =============================================================================
// Language Detection (Story 7.2)
// =============================================================================
const KUWAITI_ARABIC_MARKERS = [
    // Common Kuwaiti dialect words and phrases
    'شلونك', 'شخبارك', 'هلا', 'ايوه', 'لأ', 'شنو', 'ليش', 'وين',
    'هني', 'هناك', 'زين', 'مب', 'چذي', 'چا', 'گلت', 'يالله',
    'عيل', 'خلاص', 'اشوي', 'واجد', 'حدي', 'مرة', 'بس',
];
const STANDARD_ARABIC_MARKERS = [
    'ماذا', 'لماذا', 'كيف', 'أين', 'هذا', 'هذه', 'ذلك', 'تلك',
    'الذي', 'التي', 'هل', 'نعم', 'لا', 'إن', 'أن',
];
export function detectDialect(text) {
    // Check for Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(text)) {
        return 'en';
    }
    // Count dialect markers
    const kuwaitiCount = KUWAITI_ARABIC_MARKERS.filter(marker => text.includes(marker)).length;
    const standardCount = STANDARD_ARABIC_MARKERS.filter(marker => text.includes(marker)).length;
    // If more Kuwaiti markers than standard, it's Kuwaiti dialect
    if (kuwaitiCount > standardCount && kuwaitiCount >= 2) {
        return 'ar-kw';
    }
    return 'ar';
}
// =============================================================================
// Meeting Service
// =============================================================================
export const meetingService = {
    // ---------------------------------------------------------------------------
    // Create Meeting Record (Story 7.1)
    // ---------------------------------------------------------------------------
    async createMeeting(projectId, clerkUserId, title, recordingUrl) {
        try {
            const { data, error } = await supabase
                .from('meetings')
                .insert({
                project_id: projectId,
                clerk_user_id: clerkUserId,
                title,
                recording_url: recordingUrl || null,
                status: recordingUrl ? 'transcribing' : 'uploading',
            })
                .select()
                .single();
            if (error)
                throw error;
            return { success: true, data };
        }
        catch (err) {
            console.error('Create meeting error:', err);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Upload Recording (Story 7.1)
    // ---------------------------------------------------------------------------
    async uploadRecording(meetingId, fileBuffer, fileName, mimeType) {
        try {
            const filePath = `meetings/${meetingId}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('recordings')
                .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: true,
            });
            if (uploadError)
                throw uploadError;
            const { data: urlData } = supabase.storage
                .from('recordings')
                .getPublicUrl(filePath);
            // Update meeting with recording URL
            await supabase
                .from('meetings')
                .update({
                recording_url: urlData.publicUrl,
                status: 'transcribing',
            })
                .eq('id', meetingId);
            return { success: true, url: urlData.publicUrl };
        }
        catch (err) {
            console.error('Upload recording error:', err);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Transcribe Audio (Story 7.3) - Using OpenAI Whisper API
    // ---------------------------------------------------------------------------
    async transcribeAudio(meetingId, audioUrl) {
        try {
            // Update status
            await supabase
                .from('meetings')
                .update({ status: 'transcribing' })
                .eq('id', meetingId);
            // For now, we'll use a placeholder since Whisper API requires OpenAI key
            // In production, you'd use OpenAI's Whisper API or a similar service
            const whisperApiKey = process.env.OPENAI_API_KEY;
            if (!whisperApiKey) {
                // Fallback: Use Claude to process if audio is already text
                // Or return error asking for Whisper setup
                return {
                    success: false,
                    error: 'Whisper API not configured. Add OPENAI_API_KEY for transcription.',
                };
            }
            // Fetch audio file
            const audioResponse = await fetch(audioUrl);
            const audioBlob = await audioResponse.blob();
            // Create form data for Whisper API
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.mp3');
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities', '["segment"]');
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${whisperApiKey}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status}`);
            }
            const whisperResult = await response.json();
            const transcriptionResult = {
                text: whisperResult.text,
                language: whisperResult.language,
                segments: whisperResult.segments?.map((seg) => ({
                    start: seg.start,
                    end: seg.end,
                    text: seg.text,
                })) || [],
                duration: whisperResult.duration || 0,
            };
            // Detect dialect
            const detectedDialect = detectDialect(transcriptionResult.text);
            // Update meeting with transcript
            await supabase
                .from('meetings')
                .update({
                transcript: transcriptionResult.text,
                transcript_language: detectedDialect,
                recording_duration: transcriptionResult.duration,
                status: detectedDialect !== 'en' ? 'translating' : 'extracting',
            })
                .eq('id', meetingId);
            return { success: true, result: transcriptionResult };
        }
        catch (err) {
            console.error('Transcription error:', err);
            await supabase
                .from('meetings')
                .update({ status: 'error', error_message: err.message })
                .eq('id', meetingId);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Translate Arabic to English (Story 7.4)
    // ---------------------------------------------------------------------------
    async translateToEnglish(meetingId, text, sourceLanguage) {
        try {
            await supabase
                .from('meetings')
                .update({ status: 'translating' })
                .eq('id', meetingId);
            const dialectNote = sourceLanguage === 'ar-kw'
                ? 'Note: This text is in Kuwaiti Arabic dialect. Preserve cultural context and colloquialisms in your translation.'
                : '';
            // Use Sonnet tier for translation - balanced quality/cost
            console.log('[meetingService] Translating Arabic to English via Sonnet tier...');
            const claudeResult = await callClaudeWithTiering({
                systemPrompt: 'You are a professional translator specializing in Arabic to English translation.',
                userMessage: `Translate the following Arabic text to English. Provide a natural, professional translation suitable for business documentation.

${dialectNote}

Arabic Text:
${text}

Provide only the English translation, no explanations.`,
                maxTokens: 8000,
                taskType: 'translation'
            });
            // Record metrics
            recordTieringMetrics(claudeResult.tier, claudeResult.taskType, claudeResult.costUSD, claudeResult.savingsVsSonnet);
            const translation = claudeResult.text;
            await supabase
                .from('meetings')
                .update({
                translation,
                status: 'extracting',
            })
                .eq('id', meetingId);
            return { success: true, translation };
        }
        catch (err) {
            console.error('Translation error:', err);
            await supabase
                .from('meetings')
                .update({ status: 'error', error_message: err.message })
                .eq('id', meetingId);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Extract SOPs from Transcript (Story 7.5)
    // ---------------------------------------------------------------------------
    async extractSOPs(meetingId, text) {
        try {
            await supabase
                .from('meetings')
                .update({ status: 'extracting' })
                .eq('id', meetingId);
            // Use complex reasoning tier for SOP extraction - this is a multi-step analysis task
            // that benefits from Opus's superior reasoning capabilities
            console.log('[meetingService] Extracting SOPs using complex reasoning tier (Opus)...');
            const claudeResult = await tieredCalls.complexReasoning('You are an expert business analyst specializing in extracting Standard Operating Procedures (SOPs) from meeting transcripts.', `Analyze this meeting transcript and extract all Standard Operating Procedures (SOPs) discussed.

For each SOP found, provide:
1. A clear title
2. Brief description
3. Step-by-step actions with responsible parties and tools mentioned
4. Triggers (what initiates this process)
5. Frequency (how often it's performed)
6. Department (if mentioned)
7. Confidence score (0-1) based on how clearly the SOP was described

Meeting Transcript:
${text}

Respond in JSON format:
{
  "sops": [
    {
      "id": "sop-1",
      "title": "Process Name",
      "description": "Brief description",
      "steps": [
        {
          "order": 1,
          "action": "What to do",
          "responsible": "Who does it",
          "tools": ["Tool1", "Tool2"],
          "duration": "Estimated time",
          "notes": "Any special notes"
        }
      ],
      "triggers": ["When customer requests...", "Monthly..."],
      "frequency": "Daily/Weekly/Monthly/As needed",
      "department": "Sales/Operations/etc",
      "confidence": 0.85
    }
  ]
}

If no clear SOPs are found, return {"sops": []}.`, 8000);
            // Record metrics - this will show higher cost but justified for complex extraction
            recordTieringMetrics(claudeResult.tier, claudeResult.taskType, claudeResult.costUSD, claudeResult.savingsVsSonnet);
            const responseText = claudeResult.text;
            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { sops: [] };
            await supabase
                .from('meetings')
                .update({
                extracted_sops: parsed.sops,
                status: 'complete',
            })
                .eq('id', meetingId);
            return { success: true, sops: parsed.sops };
        }
        catch (err) {
            console.error('SOP extraction error:', err);
            await supabase
                .from('meetings')
                .update({ status: 'error', error_message: err.message })
                .eq('id', meetingId);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Generate Workflow from SOP (Story 7.6)
    // ---------------------------------------------------------------------------
    async generateWorkflowFromSOP(projectId, clerkUserId, sop) {
        try {
            // Convert SOP steps to workflow nodes
            const nodes = sop.steps.map((step, index) => ({
                id: `node-${index + 1}`,
                type: step.tools.length > 0 ? 'integration' : 'action',
                label: step.action,
                config: {
                    responsible: step.responsible,
                    tools: step.tools,
                    duration: step.duration,
                    notes: step.notes,
                },
                dependencies: index > 0 ? [`node-${index}`] : [],
            }));
            // Create workflow
            const { data: workflow, error } = await supabase
                .from('workflows')
                .insert({
                project_id: projectId,
                clerk_user_id: clerkUserId,
                name: sop.title,
                description: sop.description,
                workflow_type: 'SOP',
                status: 'draft',
                config: {
                    source: 'meeting-sop',
                    sopId: sop.id,
                    triggers: sop.triggers,
                    frequency: sop.frequency,
                    department: sop.department,
                    confidence: sop.confidence,
                },
                nodes,
            })
                .select()
                .single();
            if (error)
                throw error;
            return { success: true, workflowId: workflow.id };
        }
        catch (err) {
            console.error('Workflow generation error:', err);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Process Meeting (Full Pipeline)
    // ---------------------------------------------------------------------------
    async processMeeting(meetingId) {
        try {
            // Get meeting
            const { data: meeting, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('id', meetingId)
                .single();
            if (error || !meeting) {
                throw new Error('Meeting not found');
            }
            // Step 1: Transcribe if we have audio
            if (meeting.recording_url && !meeting.transcript) {
                const transcribeResult = await this.transcribeAudio(meetingId, meeting.recording_url);
                if (!transcribeResult.success) {
                    // If Whisper not configured, allow manual transcript input
                    if (transcribeResult.error?.includes('not configured')) {
                        return { success: false, error: transcribeResult.error };
                    }
                    throw new Error(transcribeResult.error);
                }
            }
            // Reload meeting after transcription
            const { data: updatedMeeting } = await supabase
                .from('meetings')
                .select('*')
                .eq('id', meetingId)
                .single();
            if (!updatedMeeting?.transcript) {
                return { success: false, error: 'No transcript available' };
            }
            // Step 2: Translate if Arabic
            let textForExtraction = updatedMeeting.transcript;
            if (updatedMeeting.transcript_language === 'ar' || updatedMeeting.transcript_language === 'ar-kw') {
                if (!updatedMeeting.translation) {
                    const translateResult = await this.translateToEnglish(meetingId, updatedMeeting.transcript, updatedMeeting.transcript_language);
                    if (!translateResult.success) {
                        throw new Error(translateResult.error);
                    }
                    textForExtraction = translateResult.translation || textForExtraction;
                }
                else {
                    textForExtraction = updatedMeeting.translation;
                }
            }
            // Step 3: Extract SOPs
            const extractResult = await this.extractSOPs(meetingId, textForExtraction);
            if (!extractResult.success) {
                throw new Error(extractResult.error);
            }
            return { success: true };
        }
        catch (err) {
            console.error('Process meeting error:', err);
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Get Meeting by ID
    // ---------------------------------------------------------------------------
    async getMeeting(meetingId) {
        const { data } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();
        return data;
    },
    // ---------------------------------------------------------------------------
    // Get Project Meetings
    // ---------------------------------------------------------------------------
    async getProjectMeetings(clerkUserId, projectId) {
        const { data } = await supabase
            .from('meetings')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        return data || [];
    },
    // ---------------------------------------------------------------------------
    // Search Transcripts (Story 7.7)
    // ---------------------------------------------------------------------------
    async searchTranscripts(clerkUserId, query, projectId) {
        let queryBuilder = supabase
            .from('meetings')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .not('transcript', 'is', null);
        if (projectId) {
            queryBuilder = queryBuilder.eq('project_id', projectId);
        }
        // Text search in transcript and translation
        queryBuilder = queryBuilder.or(`transcript.ilike.%${query}%,translation.ilike.%${query}%,title.ilike.%${query}%`);
        const { data: meetings } = await queryBuilder.order('created_at', { ascending: false });
        // Generate highlights for each meeting
        const highlights = {};
        const queryLower = query.toLowerCase();
        meetings?.forEach(meeting => {
            const meetingHighlights = [];
            const searchText = (meeting.translation || meeting.transcript || '').toLowerCase();
            // Find sentences containing the query
            const sentences = searchText.split(/[.!?]+/);
            sentences.forEach(sentence => {
                if (sentence.includes(queryLower)) {
                    const trimmed = sentence.trim();
                    if (trimmed.length > 10 && trimmed.length < 200) {
                        meetingHighlights.push(trimmed);
                    }
                }
            });
            if (meetingHighlights.length > 0) {
                highlights[meeting.id] = meetingHighlights.slice(0, 3); // Max 3 highlights
            }
        });
        return { meetings: meetings || [], highlights };
    },
    // ---------------------------------------------------------------------------
    // Update Meeting with Manual Transcript
    // ---------------------------------------------------------------------------
    async updateTranscript(meetingId, transcript) {
        try {
            const dialect = detectDialect(transcript);
            await supabase
                .from('meetings')
                .update({
                transcript,
                transcript_language: dialect,
                status: dialect !== 'en' ? 'translating' : 'extracting',
            })
                .eq('id', meetingId);
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Delete Meeting
    // ---------------------------------------------------------------------------
    async deleteMeeting(meetingId) {
        try {
            // Get meeting to find recording path
            const { data: meeting } = await supabase
                .from('meetings')
                .select('recording_url')
                .eq('id', meetingId)
                .single();
            // Delete recording from storage if exists
            if (meeting?.recording_url) {
                const path = meeting.recording_url.split('/recordings/')[1];
                if (path) {
                    await supabase.storage.from('recordings').remove([path]);
                }
            }
            // Delete meeting record
            await supabase.from('meetings').delete().eq('id', meetingId);
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    },
};
//# sourceMappingURL=meetingService.js.map