import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  output: 'export', // Exporta como estático
  assetPrefix: '/app-Botetas', // Corrige rutas de recursos estáticos en GitHub Pages
  basePath: '/app-Botetas', // basePath correcto para GitHub Pages
};

export default nextConfig;
