import axios from 'axios';
import { auth } from '$lib/stores/auth';
import { env } from '$env/dynamic/public';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

const baseURL = env.PUBLIC_SITE_URL
  ? `${env.PUBLIC_SITE_URL.replace(/\/+$/, '')}/gw/api`
  : '/gw/api';

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
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

interface QueueItem {
    resolve: (token: string | null) => void;
    reject: (error: Error) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
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
                .catch(err => {
                    console.log('Catch in failedQueue', err);
                    auth.clearAuth();
                    if (browser) {
                      goto('/login');
                    }
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshTokenValue = auth.getRefreshToken();
            if (!refreshTokenValue) {
                auth.clearAuth();
                if (browser) {
                  goto('/login');
                }
                return Promise.reject(error);
            }

            try {
                const response = await refreshToken(refreshTokenValue);
                console.log(response);
                const { token } = response;
                auth.updateToken(token);
                
                originalRequest.headers.Authorization = `Bearer ${token}`;
                processQueue(null, token);
                
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.log('Catch in refreshError', refreshError);
                processQueue(refreshError as Error, null);
                auth.clearAuth();
                if (browser) {
                  goto('/login');
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (
            (originalRequest.url && originalRequest.url.includes('/Auth/refresh-token')) ||
            (error.response && [404,500].includes(error.response.status))
        ) {
            auth.clearAuth();
            if (browser) {
                goto('/login');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance; 