import api from './api';
import { ENDPOINTS } from './endpoints';

<<<<<<< HEAD
export const getUsers = async (type: 'paid' | 'unpaid', filters?: { search?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number }) => {
=======
export const getUsers = async (type: 'paid' | 'unpaid', filters?: { search?: string, startDate?: Date, endDate?: Date }) => {
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
    const params = new URLSearchParams();
    params.append('type', type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
<<<<<<< HEAD
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
=======
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8

    const response = await api.get(`${ENDPOINTS.USERS.LIST}?${params.toString()}`);
    return response.data;
};
