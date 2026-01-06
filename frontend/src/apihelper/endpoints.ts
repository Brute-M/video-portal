export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        SEND_OTP: '/auth/send-otp',
        VERIFY_OTP: '/auth/verify-otp',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    VIDEOS: {
        UPLOAD: '/api/video/upload',
        LIST: '/api/video',
        LATEST: '/api/video/latest',
        BY_ID: (id: string) => `/api/video/${id}`,
        DELETE: (id: string) => `/api/video/${id}`,
    },
    PAYMENT: {
        VERIFY: '/api/video/verify-payment',
        RAZORPAY_ORDER: '/api/payment/order', // Added Razorpay Order Endpoint
        RAZORPAY_VERIFY: '/api/payment/verify', // Added Razorpay Verify Endpoint
        RAZORPAY_ORDER_LANDING: '/api/payment/order-landing',
        RAZORPAY_VERIFY_LANDING: '/api/payment/verify-landing',
    },
    USERS: {
        LIST: '/api/users',
    },
    ADMIN: {
        BASE: '/admin',
        RECORDS: '/admin/records',
        STATS: '/admin/stats',
        CHARTS: '/admin/charts',
        INVOICE: (id: string) => `/admin/invoice/${id}`,
        MANUAL_PAYMENT: (id: string) => `/admin/users/${id}/payment`,
    }
};
