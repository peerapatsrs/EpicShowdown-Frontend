import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Get token from cookie
    const token = event.cookies.get('token');

    if (token) {
        // Add token to request headers
        event.request.headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await resolve(event);
    return response;
}; 