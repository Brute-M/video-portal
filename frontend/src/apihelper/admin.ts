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
    isPaid?: boolean;
    paymentId?: string;
    lastPaymentId?: string;
    notificationSent?: boolean;
    trail_video?: string;
    videos?: any[];
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

export const getDashboardStats = async () => {
    const response = await api.get(`${ENDPOINTS.ADMIN.STATS}`);
    return response.data;
};

export const getDashboardCharts = async () => {
    const response = await api.get(`${ENDPOINTS.ADMIN.CHARTS}`);
    return response.data;
};

export const downloadUserInvoice = async (userId: string) => {
    const response = await api.get(ENDPOINTS.ADMIN.INVOICE(userId), {
        responseType: 'blob', // Important for file download
    });
    return response.data; // This returns the Blob
};

export const exportUsersExcel = async (search: string = '', type: string = '', startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`${ENDPOINTS.USERS.LIST}/export?${params.toString()}`, {
        responseType: 'blob'
    });
    return response.data;
};

