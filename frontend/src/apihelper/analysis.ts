import axios from 'axios';

export const analyzeVideo = async (formData: FormData) => {
    const url = import.meta.env.VITE_API_AGENT_URL || 'https://brpl.net/api-agent';
    const response = await axios.post(`${url}/api/analyze`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
