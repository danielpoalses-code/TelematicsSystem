import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Builds the demo into one self-contained HTML file (dist-standalone/standalone.html)
// that runs by double-clicking — no server, no install.
export default defineConfig({
    plugins: [react(), viteSingleFile()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist-standalone',
        rollupOptions: {
            input: path.resolve(__dirname, 'standalone.html'),
        },
    },
});
