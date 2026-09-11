/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            50: '#F0F4F8',
            100: '#D9E2EC',
            200: '#BCCCDC',
            300: '#9FB3C8',
            400: '#627D98',
            500: '#334E68',
            600: '#243B53',
            700: '#102A43',
            800: '#0B1E36',
            900: '#07162C',
            950: '#030B18',
          },
          saffron: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
          },
          emerald: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
          },
          ashoka: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            500: '#2563EB',
            600: '#1D4ED8',
            700: '#1E40AF',
            900: '#1E3A8A',
          }
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 28px -5px rgba(11, 30, 54, 0.08), 0 8px 10px -6px rgba(11, 30, 54, 0.04)',
        'glow-saffron': '0 0 25px -5px rgba(234, 88, 12, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(5, 150, 105, 0.25)',
      },
    },
  },
  plugins: [],
};

