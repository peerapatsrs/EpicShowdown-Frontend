export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RevokeTokenRequest {
    refreshToken: string;
    reason?: string;
}

export interface PassKeyRegistrationRequest {
    rawId?: string;
    attestationObject?: string;
    clientDataJSON?: string;
    type?: string;
    response?: string;
    options?: string;
}

export interface PassKeyAuthenticationRequest {
    id: string;
    rawId: string;
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
    response: string;
    options: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
} 