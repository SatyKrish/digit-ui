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
    // Exclude better-sqlite3 from client bundle since it's server-only
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        'better-sqlite3',
      ];
    }
    
    return config;
  },
}

export default nextConfig
