import api from './api';

export const getLocationsAPI = async () => {
    try {
        const response = await api.get('/api/locations');
        return response.data;
    } catch (error) {
        console.error("Error fetching locations:", error);
        return [];
    }
};
