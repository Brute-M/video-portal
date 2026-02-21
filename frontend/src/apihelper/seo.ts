import api from './api';

export const getSeoMetaByPath = async (path: string) => {
    try {
        const response = await api.get(`/meta/dynamic?path=${encodeURIComponent(path)}`);
        return response.data?.data;
    } catch (error) {
        return null;
    }
};

export const getAllSeoMeta = async () => {
    const response = await api.get('/meta/all');
    return response.data?.data || [];
};

export const updateSeoMeta = async (data: any) => {
    const response = await api.put('/meta', data);
    return response.data;
};
