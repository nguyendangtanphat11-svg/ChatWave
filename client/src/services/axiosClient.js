import axios from 'axios';
import config from '../config/config';

const applyDefaultConfiguration = (client) => {
    client.defaults.baseURL = config.API_URL;
    client.defaults.withCredentials = true;

    client.interceptors.request.use((requestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            requestConfig.headers ??= {};
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
    });
};

// A number of existing screens import axios directly. Configuring the shared
// axios singleton here keeps their relative /api requests pointed at the API
// server in both Vite development and production deployments.
applyDefaultConfiguration(axios);

const axiosClient = axios.create({
    baseURL: config.API_URL,
    withCredentials: true,
});

applyDefaultConfiguration(axiosClient);

export default axiosClient;
