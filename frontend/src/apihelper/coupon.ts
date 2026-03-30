import api from './api';

export const getAllCoupons = async () => {
    const response = await api.get('/api/coupons');
    return response.data;
};

export const createCoupon = async (data: {
    code: string;
    type: string;
    value: number;
    minOrder?: number;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    expiryDate: string;
    description?: string;
    isActive?: boolean;
}) => {
    const response = await api.post('/api/coupons', data);
    return response.data;
};

export const updateCoupon = async (id: string, data: {
    code?: string;
    type?: string;
    value?: number;
    minOrder?: number;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    expiryDate?: string;
    description?: string;
    isActive?: boolean;
}) => {
    const response = await api.put(`/api/coupons/${id}`, data);
    return response.data;
};

export const deleteCoupon = async (id: string) => {
    const response = await api.delete(`/api/coupons/${id}`);
    return response.data;
};

export const validateCoupon = async (code: string, orderAmount: number) => {
    const response = await api.post('/api/coupons/validate', { code, orderAmount });
    return response.data;
};
