import api from './api';

export const getLocationsAPI = async () => {
    try {
        const response = await api.get('/locations');
        return response.data;
    } catch (error) {
        console.error("Error fetching locations:", error);
        return [];
    }
};

export const getStatesAPI = async () => {
    try {
        const response = await api.get('/locations/states');
        return response.data;
    } catch (error) {
        console.error("Error fetching states:", error);
        return [];
    }
};

export const getCitiesAPI = async (stateId: string) => {
    try {
        const response = await api.get(`/locations/districts/${stateId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching cities for state ${stateId}:`, error);
        return [];
    }
};
