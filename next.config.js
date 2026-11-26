/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    forceSwcTransforms: true,
    useWasmBinary: true,
  },
  images: {
    remotePatterns: [
      (() => {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            const parsed = new URL(supabaseUrl);
            return {
              protocol: parsed.protocol.replace(':', ''),
              hostname: parsed.hostname,
            };
          }
        } catch {
          // fallback
        }
        return {
          protocol: 'https',
          hostname: '*.supabase.co',
        };
      })(),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  swcMinify: true,
};

module.exports = nextConfig;