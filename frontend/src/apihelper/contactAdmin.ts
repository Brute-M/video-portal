import api from './api';
import { ENDPOINTS } from './endpoints';

export interface ContactLead {
    _id: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    message: string;
    createdAt: string;
}

export interface PaginatedLeadResponse<T> {
    statusCode: number;
    data: {
        items: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export const getContactLeads = async (page: number, limit: number, search: string = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    const response = await api.get<PaginatedLeadResponse<ContactLead>>(`${ENDPOINTS.ADMIN.CONTACT_LEADS}?${params.toString()}`);
    return response.data;
};

export const exportContactLeadsExcel = async (search: string = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get(
        `${ENDPOINTS.ADMIN.CONTACT_LEADS_EXPORT}?${params.toString()}`,
        { responseType: 'blob' }
    );
    return response.data;
};

