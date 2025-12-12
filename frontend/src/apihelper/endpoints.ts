export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        SEND_OTP: '/auth/send-otp',
        VERIFY_OTP: '/auth/verify-otp',
    },
    VIDEOS: {
        UPLOAD: '/api/video/upload',
        LIST: '/api/video',
        BY_ID: (id: string) => `/api/video/${id}`,
        DELETE: (id: string) => `/api/video/${id}`,
    },
    PAYMENT: {
        VERIFY: '/api/video/verify-payment',
    },
    USERS: {
        LIST: '/api/users',
    }
};
