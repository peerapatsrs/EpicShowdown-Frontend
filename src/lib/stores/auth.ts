import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null
};

function getPersistedState(): AuthState {
    if (!browser) return initialState;
    try {
        const persisted = localStorage.getItem('auth');
        if (!persisted) return initialState;
        const parsed = JSON.parse(persisted);
        return {
            isAuthenticated: !!parsed.accessToken,
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken
        };
    } catch {
        return initialState;
    }
}

const createAuthStore = () => {
    const { subscribe, set, update } = writable<AuthState>(getPersistedState());

    const persistState = (state: AuthState) => {
        if (browser) {
            localStorage.setItem('auth', JSON.stringify(state));
        }
    };

    return {
        subscribe,
        setAuth: (accessToken: string, refreshToken: string) => {
            const newState = {
                isAuthenticated: true,
                accessToken,
                refreshToken
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
                const newState = {
                    ...state,
                    accessToken,
                    isAuthenticated: true
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
        }
    };
};

export const auth = createAuthStore(); 