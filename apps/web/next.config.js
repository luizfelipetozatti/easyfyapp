/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@agendazap/ui", "@agendazap/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
