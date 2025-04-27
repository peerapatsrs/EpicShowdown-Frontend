import axios from 'axios';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { PUBLIC_SITE_URL } from '$env/static/public';

const axiosInstance = axios.create({
    baseURL: `${PUBLIC_SITE_URL}/gw/api`,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

const refreshToken = async (refreshToken: string) => {
    const response = await axiosInstance.post('/Auth/refresh-token', { refreshToken });
    return response.data;
};

// Add token to request headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = auth.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshTokenValue = auth.getRefreshToken();
            if (!refreshTokenValue) {
                auth.clearAuth();
                return Promise.reject(error);
            }

            try {
                const response = await refreshToken(refreshTokenValue);
                const { token } = response;
                auth.updateToken(token);
                
                originalRequest.headers.Authorization = `Bearer ${token}`;
                processQueue(null, token);
                
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                auth.clearAuth();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance; 