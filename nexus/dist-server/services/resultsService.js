import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
// =============================================================================
// Results Service
// =============================================================================
export const resultsService = {
    // ---------------------------------------------------------------------------
    // Store Workflow Result (Story 10.1)
    // ---------------------------------------------------------------------------
    async storeResult(workflowId, projectId, clerkUserId, title, resultType, data, description) {
        try {
            const { data: result, error } = await supabase
                .from('workflow_results')
                .insert({
                workflow_id: workflowId,
                project_id: projectId,
                clerk_user_id: clerkUserId,
                title,
                description,
                result_type: resultType,
                data,
                artifacts: [],
            })
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (err) {
            console.error('Store result error:', err);
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Upload Artifact (Story 10.2)
    // ---------------------------------------------------------------------------
    async uploadArtifact(resultId, fileBuffer, fileName, mimeType) {
        try {
            const filePath = `results/${resultId}/${Date.now()}-${fileName}`;
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('artifacts')
                .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: true,
            });
            if (uploadError)
                throw uploadError;
            // Get public URL
            const { data: urlData } = supabase.storage.from('artifacts').getPublicUrl(filePath);
            const artifact = {
                id: crypto.randomUUID(),
                name: fileName,
                type: mimeType,
                size: fileBuffer.length,
                url: urlData.publicUrl,
                created_at: new Date().toISOString(),
            };
            // Update result with artifact
            const { data: result } = await supabase
                .from('workflow_results')
                .select('artifacts')
                .eq('id', resultId)
                .single();
            const artifacts = [...(result?.artifacts || []), artifact];
            await supabase.from('workflow_results').update({ artifacts }).eq('id', resultId);
            return artifact;
        }
        catch (err) {
            console.error('Upload artifact error:', err);
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Get Workflow Results
    // ---------------------------------------------------------------------------
    async getWorkflowResults(workflowId) {
        const { data } = await supabase
            .from('workflow_results')
            .select('*')
            .eq('workflow_id', workflowId)
            .order('created_at', { ascending: false });
        return data || [];
    },
    // ---------------------------------------------------------------------------
    // Get Result by ID
    // ---------------------------------------------------------------------------
    async getResult(resultId) {
        const { data } = await supabase
            .from('workflow_results')
            .select('*')
            .eq('id', resultId)
            .single();
        return data;
    },
    // ---------------------------------------------------------------------------
    // Generate Shareable URL (Story 10.4)
    // ---------------------------------------------------------------------------
    async generateShareUrl(resultId, expiresInHours = 24) {
        try {
            const shareToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
            await supabase
                .from('workflow_results')
                .update({
                share_token: shareToken,
                share_expires_at: expiresAt.toISOString(),
            })
                .eq('id', resultId);
            const baseUrl = process.env.APP_URL || 'http://localhost:3001';
            const url = `${baseUrl}/share/results/${shareToken}`;
            return { url, expiresAt: expiresAt.toISOString() };
        }
        catch (err) {
            console.error('Generate share URL error:', err);
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Get Result by Share Token
    // ---------------------------------------------------------------------------
    async getResultByShareToken(shareToken) {
        const { data } = await supabase
            .from('workflow_results')
            .select('*')
            .eq('share_token', shareToken)
            .single();
        if (!data)
            return null;
        // Check if expired
        if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
            return null;
        }
        return data;
    },
    // ---------------------------------------------------------------------------
    // Render Chart Data (Story 10.3)
    // ---------------------------------------------------------------------------
    renderChartData(data) {
        try {
            // Detect data structure and convert to chart format
            if (Array.isArray(data.items)) {
                const items = data.items;
                const labelKey = data.labelKey || Object.keys(items[0])[0];
                const valueKey = data.valueKey || Object.keys(items[0])[1];
                return {
                    type: data.chartType || 'bar',
                    labels: items.map((item) => String(item[labelKey])),
                    datasets: [
                        {
                            label: String(data.title || 'Data'),
                            data: items.map((item) => Number(item[valueKey]) || 0),
                            backgroundColor: [
                                '#3B82F6',
                                '#10B981',
                                '#F59E0B',
                                '#EF4444',
                                '#8B5CF6',
                                '#EC4899',
                            ],
                        },
                    ],
                };
            }
            return null;
        }
        catch {
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Render Table Data (Story 10.3)
    // ---------------------------------------------------------------------------
    renderTableData(data) {
        try {
            if (Array.isArray(data.rows) && Array.isArray(data.columns)) {
                return data;
            }
            // Auto-detect from array of objects
            if (Array.isArray(data.items)) {
                const items = data.items;
                if (items.length === 0)
                    return null;
                const columns = Object.keys(items[0]).map((key) => ({
                    key,
                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                    type: typeof items[0][key] === 'number' ? 'number' : 'text',
                }));
                return { columns, rows: items };
            }
            return null;
        }
        catch {
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Send Completion Notification (Story 10.5)
    // ---------------------------------------------------------------------------
    async sendCompletionNotification(workflowId, resultId, email) {
        // This would integrate with the email service
        // For now, just log the notification
        console.log(`Notification: Workflow ${workflowId} completed. Result: ${resultId}`);
        if (email) {
            // TODO: Integrate with Resend or other email service
            // await fetch('/api/integrations/email', { ... })
        }
        return { success: true };
    },
};
//# sourceMappingURL=resultsService.js.map