import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://techstarsolution.in'
  
  // Base URLs
  const routes = [
    '',
    '/about',
    '/personal-loan',
    '/home-loan',
    '/business-loan',
    '/car-loan',
    '/loan-against-property',
    '/become-dsa-partner',
    '/dashboard',
    '/privacy',
    '/terms',
    '/blog/improve-credit-score',
  ]
  
  // Dedicated local target routes
  const locationRoutes = [
    '/personal-loan-pune',
    '/business-loan-pune',
    '/home-loan-pune',
    '/loan-against-property-pune',
    '/loan-agent-pune',
    '/dsa-loan-pune',
    '/personal-loan-chhatrapati-sambhajianagar',
    '/business-loan-chhatrapati-sambhajianagar',
    '/home-loan-chhatrapati-sambhajianagar',
    '/loan-against-property-chhatrapati-sambhajianagar',
    '/loan-agent-chhatrapati-sambhajianagar',
    '/dsa-loan-chhatrapati-sambhajianagar',
  ]

  const allRoutes = [...routes, ...locationRoutes]

  return allRoutes.map((route) => {
    let priority = 0.5
    let changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly'

    if (route === '') {
      priority = 1.0
      changeFrequency = 'daily'
    } else if (route.includes('loan-') || route === '/personal-loan' || route === '/home-loan') {
      priority = 0.8
      changeFrequency = 'weekly'
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }
  })
}
