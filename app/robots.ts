import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ai-scan-backend.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/auth/', '/settings'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
