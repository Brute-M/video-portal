import axios from 'axios';

const api = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    // baseURL: 'http://72.61.239.4:5000',
    baseURL: 'https://brpl.net/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (config.headers) {
                // Check if headers is an AxiosHeaders object instance (has set functionality)
                // @ts-ignore
                if (typeof config.headers.set === 'function') {
                    // @ts-ignore
                    config.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    // Standard object
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            } else {
                // @ts-ignore
                config.headers = { Authorization: `Bearer ${token}` };
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized globally (optional)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

export default api;
