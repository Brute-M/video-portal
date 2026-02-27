import api from './api';
import { ENDPOINTS } from './endpoints';

export const getUsers = async (type: 'paid' | 'unpaid', filters?: { search?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number, source?: string }) => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.source) params.append('source', filters.source);

    const response = await api.get(`${ENDPOINTS.USERS.LIST}?${params.toString()}`);
    return response.data;
};

export const getAdminUnpaidUsers = async (filters?: { search?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number, source?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.source) params.append('source', filters.source);

    const response = await api.get(`${ENDPOINTS.ADMIN.UNPAID_USERS}?${params.toString()}`);
    return response.data;
};

export const getUserById = async (id: string) => {
    const response = await api.get(`${ENDPOINTS.USERS.LIST}/${id}`);
    return response.data;
};
