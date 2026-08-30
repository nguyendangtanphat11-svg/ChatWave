import axios from 'axios';
import config from '../config/config';

const api = axios.create({ baseURL: `${config.API_URL}/api` });

api.interceptors.request.use((request) => {
    const token = localStorage.getItem('token');
    if (token) request.headers.Authorization = `Bearer ${token}`;
    return request;
});

export const getProfile = async () => (await api.get('/users/profile')).data;
export const getUserStatistics = async () => (await api.get('/users/statistics')).data;
export const updateProfile = async (data) => (await api.put('/users/profile', data)).data;
export const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return (await api.put('/users/avatar', formData)).data;
};
export const updateCover = async (file) => {
    const formData = new FormData();
    formData.append('cover', file);
    return (await api.put('/users/cover', formData)).data;
};
export const updatePassword = async (data) => (await api.put('/profile/password', data)).data;
