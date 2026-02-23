import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#FFFFFF',
                surface: '#F3F4F6',
                border: '#E5E7EB',
                panel: '#FFFFFF',
                card: '#FFFFFF',
                accent: {
                    DEFAULT: '#DC3545', // Red from the reference
                    hover: '#C82333',
                },
                status: {
                    gray: '#7D7D8E',
                    green: '#28A745',
                    blue: '#007BFF',
                    amber: '#FFC107',
                    red: '#DC3545',
                },
                text: {
                    primary: '#1F2937',
                    secondary: '#6B7280',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
