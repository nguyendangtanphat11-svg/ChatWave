const stripTrailingSlash = (url = '') => url.replace(/\/+$/, '');
const developmentApiUrl = 'http://localhost:5000';
const configuredApiUrl = import.meta.env.VITE_API_URL;

const apiUrl = configuredApiUrl || (import.meta.env.DEV ? developmentApiUrl : '');
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl;

const config = {
    API_URL: stripTrailingSlash(apiUrl),
    SOCKET_URL: stripTrailingSlash(socketUrl),
};

export default config;
