/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        forest: '#1B5E20',
        sage: '#A5D6A7',
        mint: '#C8E6C9',
        soft: '#E8F5E9',
        pure: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
        inter: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(27, 94, 32, 0.08)',
        'glass': '0 8px 32px 0 rgba(27, 94, 32, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-overlay': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, transparent 40%, rgba(0, 0, 0, 0.7) 100%)',
      }
    }
  },
  plugins: [],
};
