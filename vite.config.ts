import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    },
});
