import api from './api';
import { ENDPOINTS } from './endpoints';

export const uploadVideo = async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const response = await api.post(ENDPOINTS.VIDEOS.UPLOAD, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
    });
    return response.data;
};

export const getVideos = async () => {
    const response = await api.get(ENDPOINTS.VIDEOS.LIST);
    return response.data;
};

export const deleteVideo = async (id: string) => {
    const response = await api.delete(ENDPOINTS.VIDEOS.DELETE(id));
    return response.data;
};

export const getVideoById = async (id: string) => {
    const response = await api.get(ENDPOINTS.VIDEOS.BY_ID(id));
    return response.data;
};

export const getLatestVideo = async () => {
    const response = await api.get(`${ENDPOINTS.VIDEOS.LIST}/latest`); // Assuming LIST is /videos
    return response.data;
};


