import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: 'epicshowdown.com',
		port: 443,
		https: {
			key: fs.readFileSync('certs/key.pem'),
			cert: fs.readFileSync('certs/cert.pem'),
		},
	}
});
