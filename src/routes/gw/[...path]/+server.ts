import { error } from '@sveltejs/kit';
import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';
import https from 'https';
import { Readable } from 'stream';
import { env } from '$env/dynamic/private';

const PRIVATE_API_URL  = env.PRIVATE_API_URL  ?? 'https://localhost:8000';
const PRIVATE_NODE_ENV   = env.PRIVATE_NODE_ENV ?? 'production';

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    
    return Buffer.concat(chunks);
}

async function handle(request: Request, params: { path?: string[] | string }, url: URL) {
    const forwardPath = Array.isArray(params.path)
        ? params.path.join('/')
        : (params.path || '');

    const targetUrl = `${PRIVATE_API_URL}/${forwardPath}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('host', new URL(PRIVATE_API_URL).host);
    headers.delete('origin');

    try {
        const agent = new https.Agent({
            rejectUnauthorized: PRIVATE_NODE_ENV === 'production'
        });

        let body: Buffer | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
            body = await streamToBuffer(request.body);
        }

        const fetchOptions: RequestInit = {
            method: request.method,
            headers: Object.fromEntries(headers),
            body,
            redirect: 'manual',
            agent
        };

        const proxyRes = await fetch(targetUrl, fetchOptions);
        const responseBody = proxyRes.body ? Readable.from(proxyRes.body) : null;

        const resHeaders = new Headers(Object.fromEntries(Object.entries(proxyRes.headers)));

        resHeaders.delete('content-security-policy');
        resHeaders.delete('content-security-policy-report-only');
        resHeaders.delete('x-frame-options');

        const webStream = responseBody ? new ReadableStream({
            start(controller) {
                responseBody.on('data', chunk => controller.enqueue(new Uint8Array(chunk)));
                responseBody.on('end', () => controller.close());
                responseBody.on('error', err => controller.error(err));
            }
        }) : null;

        return new Response(webStream, {
            status: proxyRes.status,
            headers: resHeaders
        });
    } catch (err) {
        console.error('Proxy Error:', err);
        throw error(502, 'Bad Gateway');
    }
}

// export ตาม verb
export async function GET({ request, params, url }) {
    return handle(request, params, url);
}
export async function POST({ request, params, url }) {
    return handle(request, params, url);
}
export async function PUT({ request, params, url }) {
    return handle(request, params, url);
}
export async function PATCH({ request, params, url }) {
    return handle(request, params, url);
}
export async function DELETE({ request, params, url }) {
    return handle(request, params, url);
}
export async function OPTIONS({ request, params, url }) {
    return handle(request, params, url);
}
export async function HEAD({ request, params, url }) {
    return handle(request, params, url);
}