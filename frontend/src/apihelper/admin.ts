import api from './api';
import { ENDPOINTS } from './endpoints';

export interface AdminRecord {
    _id: string;
    email: string;
    name?: string;
    fname?: string;
    lname?: string;
    mobile?: string;
    createdAt: string;
    isFromLandingPage?: boolean;
    // Add other fields as needed
}

export interface PaginatedResponse<T> {
    statusCode: number;
    data: {
        type: string;
        items: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        }
    }
}

export const getAdminRecords = async (page: number = 1, limit: number = 10, search: string = '', type: 'users' | 'coaches' | 'influencers' = 'users', startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('type', type);
    if (search) params.append('search', search);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get<PaginatedResponse<AdminRecord>>(`${ENDPOINTS.ADMIN.RECORDS}?${params.toString()}`);
    return response.data;
};
