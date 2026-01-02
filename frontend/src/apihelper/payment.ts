import api from './api';
import { ENDPOINTS } from './endpoints';

export const verifyPayment = async (data: { videoId: string; paymentId: string }) => {
    const response = await api.post(ENDPOINTS.PAYMENT.VERIFY, data, {
        headers: {
            'orange-secret-key': '86295b07-a5f4-4283-8302-48971ea34905',
        },
    });
    return response.data;
};

export const createRazorpayOrder = async (amount: number) => {
    const response = await api.post(ENDPOINTS.PAYMENT.RAZORPAY_ORDER, { amount });
    return response.data;
};

export const verifyRazorpayPayment = async (data: any) => {
    const response = await api.post(ENDPOINTS.PAYMENT.RAZORPAY_VERIFY, data);
    return response.data;
};

export const downloadInvoiceAPI = async (videoId: string) => {
    const response = await api.get(`${ENDPOINTS.VIDEOS.LIST}/invoice/${videoId}`, {
        responseType: 'blob'
    });
    return response.data;
};

export const createLandingOrder = async (amount: number) => {
    const response = await api.post(ENDPOINTS.PAYMENT.RAZORPAY_ORDER_LANDING, { amount });
    return response.data;
};

export const verifyLandingPayment = async (data: any) => {
    const response = await api.post(ENDPOINTS.PAYMENT.RAZORPAY_VERIFY_LANDING, data);
    return response.data;
};

