/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (player images, site assets, etc.)
      {
        protocol: 'https',
        hostname: 'ljlspupeebjjgjkwqoed.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // CloudFront CDN (FPL player photos from Premier League API)
      {
        protocol: 'https',
        hostname: 'd3t3ozftmdmh3i.cloudfront.net',
        pathname: '/**',
      },
      // Anchor / Spotify podcast cover images
      {
        protocol: 'https',
        hostname: '**.anchorfm.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.podcastcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
