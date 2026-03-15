import axios from 'axios';

const BASE_URL = import.meta.env.VITE_AI_AGENT_BASE_URL || 'https://brpl.net';
const HEALTH_PATH = '/api/ai-agent2.0/api/health';
const UPLOAD_PATH = '/api/ai-agent2.0/api/upload';
const STATUS_PATH = (jobId: string) => `/api/ai-agent2.0/api/status/${jobId}`;
const RESULT_PATH = (jobId: string) => `/api/ai-agent2.0/api/result/${jobId}`;

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 80; // ~200 seconds max wait

/**
 * Check if the AI analysis service is available.
 */
export const checkAnalysisHealth = async (): Promise<boolean> => {
    try {
        const response = await axios.get(`${BASE_URL}${HEALTH_PATH}`, {
            timeout: 10000,
        });
        return response.status === 200;
    } catch {
        return false;
    }
};

/**
 * Submit video for analysis. Returns jobId from the upload API.
 */
export const submitVideoForAnalysis = async (formData: FormData): Promise<string> => {
    const response = await axios.post(`${BASE_URL}${UPLOAD_PATH}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 min for large uploads
    });
    const data = response.data;
    const jobId =
        data?.jobId ??
        data?.job_id ??
        data?.data?.jobId ??
        data?.data?.job_id ??
        data?.id;
    if (!jobId) {
        throw new Error('Upload API did not return a job ID');
    }
    return String(jobId);
};

/**
 * Get analysis job status. Returns { status, data? }.
 */
export const getAnalysisStatus = async (jobId: string): Promise<{
    status: string;
    data?: any;
    result?: any;
    analysis?: any;
    message?: string;
    error?: string;
}> => {
    const response = await axios.get(`${BASE_URL}${STATUS_PATH(jobId)}`, {
        timeout: 15000,
    });
    return response.data ?? {};
};

/**
 * Get analysis result for a completed job. GET /api/ai-agent2.0/api/result/:jobId
 */
export const getAnalysisResult = async (jobId: string): Promise<any> => {
    const response = await axios.get(`${BASE_URL}${RESULT_PATH(jobId)}`, {
        timeout: 30000,
    });
    const data = response.data;
    return data?.data ?? data?.result ?? data?.analysis ?? data;
};

/**
 * Analyze video using the new async API: upload → poll status until completed/failed.
 * Returns the same shape as before for compatibility: { success: true, data: { analysis?, role? } } or throws.
 */
export const analyzeVideo = async (formData: FormData): Promise<{
    success: boolean;
    data?: { analysis?: any; role?: string };
}> => {
    const jobId = await submitVideoForAnalysis(formData);

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const result = await getAnalysisStatus(jobId);
        const status = (result.status ?? result?.data?.status ?? '').toLowerCase();

        window.dispatchEvent(new CustomEvent('analysis:progress', {
            detail: { jobId, attempt, total: MAX_POLL_ATTEMPTS, result }
        }));

        if (status === 'completed' || status === 'complete' || status === 'done') {
            const analysis = await getAnalysisResult(jobId);
            const role = result.data?.role ?? formData.get('role')?.toString();

            /* Use this to handle complete event */
            // window.dispatchEvent(new CustomEvent('analysis:progress', {
            //     detail: { jobId, attempt, total: MAX_POLL_ATTEMPTS, status: 'completed', raw: result }
            // }));

            return {
                success: true,
                data: {
                    analysis: analysis ?? result.data ?? result.result,
                    role: role ?? undefined,
                },
            };
        }

        if (status === 'failed' || status === 'error') {
            const message =
                result.data?.message ??
                result.message ??
                result.error ??
                'Analysis failed';

            window.dispatchEvent(new CustomEvent('analysis:progress', {
                detail: { jobId, attempt, total: MAX_POLL_ATTEMPTS, status: 'failed', raw: result }
            }));

            throw new Error(typeof message === 'string' ? message : 'Analysis failed');
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error('Analysis timed out. Please try again later.');
};
