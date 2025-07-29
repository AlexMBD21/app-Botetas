/**
 * Configuración Next.js para despliegue en GitHub Pages
 */
const isProd = process.env.NODE_ENV === 'production';

const repoName = 'app-Botetas'; // Cambia esto si tu repo tiene otro nombre

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: isProd ? `/${repoName}/` : '',
  basePath: isProd ? `/${repoName}` : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
