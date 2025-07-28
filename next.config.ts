import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Exporta como estático
  // Si tu repo es solo para la web, no necesitas basePath
  // Si usas imágenes, puedes agregar assetPrefix: '.'
};

export default nextConfig;
