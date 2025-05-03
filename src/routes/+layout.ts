import { auth } from '$lib/stores/auth';
import { authApi } from '$lib/api/auth';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    if (typeof window !== 'undefined') {
        const refreshToken = auth.getRefreshToken();
        if (refreshToken) {
            try {
                const { accessToken, refreshToken: newRefreshToken } = await authApi.refreshToken({ refreshToken });
                auth.setAuth(accessToken, newRefreshToken);
            } catch {
                auth.clearAuth();
            }
        }
    }
    return {};
}; 