import type { 
    LoginRequest, 
    RegisterRequest, 
    RefreshTokenRequest, 
    RevokeTokenRequest,
    AuthResponse,
    PassKeyRegistrationRequest,
    PassKeyAuthenticationRequest
} from '$lib/types/auth';
import axiosInstance from './axios';

export const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post('/Auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post('/Auth/login', data);
        return response.data;
    },

    refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post('/Auth/refresh-token', data);
        return response.data;
    },

    revokeToken: async (data: RevokeTokenRequest) => {
        const response = await axiosInstance.post('/Auth/revoke-token', data);
        return response.data;
    },

    // Passkey (WebAuthn) endpoints
    getPasskeys: async () => {
        const response = await axiosInstance.get('/Auth/passkeys');
        return response.data;
    },

    getPasskeyRegisterOptions: async () => {
        const response = await axiosInstance.post('/Auth/passkey/register/options');
        return response.data;
    },

    verifyPasskeyRegistration: async (data: PassKeyRegistrationRequest) => {
        const response = await axiosInstance.post('/Auth/passkey/register/verify', data);
        return response.data;
    },

    getPasskeyAuthenticationOptions: async () => {
        const response = await axiosInstance.post('/Auth/passkey/authenticate/options');
        return response.data;
    },

    verifyPasskeyAuthentication: async (data: PassKeyAuthenticationRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post('/Auth/passkey/authenticate', data);
        return response.data;
    },

    deletePasskey: async (passKeyId: string) => {
        const response = await axiosInstance.delete(`/Auth/passkey/${passKeyId}`);
        return response.data;
    }
};
