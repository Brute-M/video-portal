import api from './api';

export const submitContactAPI = async (data: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    message: string;
}) => {
    try {
        const response = await api.post('/api/contact/submit', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
