import type { MetadataRoute } from "next";
import { prisma } from "@easyfyapp/database";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://easyfy.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic public booking pages for each active organization
  let orgRoutes: MetadataRoute.Sitemap = [];
  try {
    const orgs = await prisma.organization.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });

    orgRoutes = orgs.map((org) => ({
      url: `${BASE_URL}/agendar/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // If DB is unavailable during build, skip org routes
  }

  return [...staticRoutes, ...orgRoutes];
}
