import api from './api';

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
