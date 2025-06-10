/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', 
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude better-sqlite3 and other Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      };
      
      config.externals = [
        ...(config.externals || []),
        'better-sqlite3',
        'fs',
        'path',
        'crypto',
      ];
    }
    
    return config;
  },
}

export default nextConfig
