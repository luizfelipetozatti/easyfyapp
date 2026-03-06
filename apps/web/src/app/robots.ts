import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://easyfy.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/demo", "/agendar/"],
        disallow: ["/dashboard/", "/api/", "/setup/", "/login", "/register"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
