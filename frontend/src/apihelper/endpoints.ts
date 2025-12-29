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
        BY_ID: (id: string) => `/api/video/${id}`,
        DELETE: (id: string) => `/api/video/${id}`,
    },
    PAYMENT: {
        VERIFY: '/api/video/verify-payment',
        RAZORPAY_ORDER: '/api/payment/order', // Added Razorpay Order Endpoint
        RAZORPAY_VERIFY: '/api/payment/verify', // Added Razorpay Verify Endpoint
    },
    USERS: {
        LIST: '/api/users',
    },
    ADMIN: {
        RECORDS: '/admin/records',
    }
};
