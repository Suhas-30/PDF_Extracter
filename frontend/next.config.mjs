/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      stream: false,
      util: false,
      crypto: false,
      buffer: false,
      http: false,
      https: false,
      zlib: false,
    };
    return config;
  },
};

export default nextConfig;


