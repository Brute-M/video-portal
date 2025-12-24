import api from './api';
import { ENDPOINTS } from './endpoints';

export const getUsers = async (type: 'paid' | 'unpaid', filters?: { search?: string, startDate?: Date, endDate?: Date }) => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

    const response = await api.get(`${ENDPOINTS.USERS.LIST}?${params.toString()}`);
    return response.data;
};
