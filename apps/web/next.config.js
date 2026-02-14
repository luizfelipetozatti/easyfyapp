/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@agendazap/ui", "@agendazap/database"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/engines", "prisma"],
    // Ensure Prisma engines are copied into the standalone output during file tracing
    outputFileTracingIncludes: {
      "/**/*": [
        "./node_modules/.prisma/**", // app-local (when generated in this package)
        "../packages/database/node_modules/.prisma/**", // workspace package location
        "../../node_modules/.prisma/**", // root node_modules (pnpm hoisted)
      ],
    },
  },
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
