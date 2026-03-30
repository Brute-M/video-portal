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

export const getCouponUsage = async (params?: { page?: number; limit?: number; code?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.code) searchParams.append('code', params.code);
    if (typeof params?.isActive === 'boolean') searchParams.append('isActive', String(params.isActive));

    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await api.get(`/api/coupons/usage${suffix}`);
    return response.data;
};
