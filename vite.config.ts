import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: 'localhost',
		port: 3000,
		https: {
			key: fs.readFileSync('certs/localhost+2-key.pem'),
			cert: fs.readFileSync('certs/localhost+2.pem'),
		},
		proxy: {
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, ''),
				headers: {
					'Origin': 'http://localhost:8000'
				}
			}
		}
	}
});
