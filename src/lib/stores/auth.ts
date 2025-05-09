import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { jwtDecode } from 'jwt-decode';
import { goto } from '$app/navigation';

interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    userRole: string | null;
}

interface JwtPayload {
    UserRole: string;
    [key: string]: string;
}

const initialState: AuthState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    userRole: null
};

function getPersistedState(): AuthState {
    if (!browser) return initialState;
    try {
        const persisted = localStorage.getItem('auth');
        if (!persisted) return initialState;
        const parsed = JSON.parse(persisted);
        if (parsed.expires && Date.now() > parsed.expires) {
            localStorage.removeItem('auth');
            return initialState;
        }
        return {
            isAuthenticated: !!parsed.accessToken,
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            userRole: parsed.userRole
        };
    } catch {
        return initialState;
    }
}

function extractRoleFromToken(token: string): string | null {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.UserRole || null;
    } catch {
        return null;
    }
}

const createAuthStore = () => {
    const { subscribe, set, update } = writable<AuthState>(getPersistedState());

    const persistState = (state: AuthState) => {
        if (browser) {
            const expires = Date.now() + 1000 * 60 * 60; // 1 ชั่วโมง
            localStorage.setItem('auth', JSON.stringify({ ...state, expires }));
        }
    };

    return {
        subscribe,
        setAuth: (accessToken: string, refreshToken: string) => {
            const userRole = extractRoleFromToken(accessToken);
            const newState = {
                isAuthenticated: true,
                accessToken,
                refreshToken,
                userRole
            };
            persistState(newState);
            set(newState);
        },
        clearAuth: () => {
            if (browser) {
                localStorage.removeItem('auth');
            }
            set(initialState);
        },
        updateToken: (accessToken: string) => {
            update(state => {
                const userRole = extractRoleFromToken(accessToken);
                const newState = {
                    ...state,
                    accessToken,
                    isAuthenticated: true,
                    userRole
                };
                persistState(newState);
                return newState;
            });
        },
        getToken: () => {
            const state = getPersistedState();
            return state.accessToken;
        },
        getRefreshToken: () => {
            const state = getPersistedState();
            return state.refreshToken;
        },
        getUserRole: () => {
            const state = getPersistedState();
            return state.userRole;
        },
        hasRole: (role: string) => {
            const state = getPersistedState();
            return state.userRole === role;
        }
    };
};

export const auth = createAuthStore(); 
export const isAuthenticated = () => {
    const state = getPersistedState();
    if (!state.isAuthenticated) {
        goto('/login');
        return false;
    }
    return true;
}