import cfg from './seo-routes.json';

type SeoRoute = {
  path: string;
  title: string;
  description?: string;
  type?: 'home' | 'courses_index' | 'course' | 'private' | string;
  noindex?: boolean;
  prerender?: boolean;
  course?: { name: string; url: string };
};

type SeoConfig = {
  site: { name: string; baseUrl: string; language: string; locale?: string };
  routes: SeoRoute[];
};

type JsonLd = Record<string, unknown>;

export function getRouteSeo(pathname: string): {
  title: string;
  description?: string;
  canonical: string;
  canonicalUrl: string;
  noindex?: boolean;
  openGraph: {
    title: string;
    description?: string;
    url: string;
    siteName: string;
    type: string;
    locale: string;
    image?: string;
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description?: string;
    image?: string;
  };
  jsonLd: JsonLd[];
} {
  const typedCfg = cfg as SeoConfig;
  const baseUrl = typedCfg.site.baseUrl;
  const route =
    typedCfg.routes.find((r) => r.path === pathname) ?? typedCfg.routes.find((r) => r.path === '/');

  const canonical = route?.path ?? '/';
  const canonicalUrl = `${baseUrl}${canonical}`;
  const jsonLd: JsonLd[] = [];
  const locale = typedCfg.site.locale ?? 'ru_RU';
  const openGraphType = route?.type === 'course' ? 'article' : 'website';
  const defaultImage = `${baseUrl}/og.png`;

  if (route?.type === 'home') {
    jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: typedCfg.site.name,
        url: baseUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: typedCfg.site.name,
        url: baseUrl,
        inLanguage: typedCfg.site.language,
      },
    );
  }

  if (route?.type === 'course' && route.course) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: route.course.name,
      description: route.description,
      inLanguage: typedCfg.site.language,
      provider: { '@type': 'Organization', name: typedCfg.site.name, url: baseUrl },
      url: `${baseUrl}${route.course.url}`,
    });
  }

  return {
    title: route?.title ?? typedCfg.site.name,
    description: route?.description,
    canonical,
    canonicalUrl,
    noindex: route?.noindex,
    openGraph: {
      title: route?.title ?? typedCfg.site.name,
      description: route?.description,
      url: canonicalUrl,
      siteName: typedCfg.site.name,
      type: openGraphType,
      locale,
      image: defaultImage,
    },
    twitter: {
      card: 'summary_large_image',
      title: route?.title ?? typedCfg.site.name,
      description: route?.description,
      image: defaultImage,
    },
    jsonLd,
  };
}

export function getPrerenderRoutes(): string[] {
  const typedCfg = cfg as SeoConfig;
  return typedCfg.routes.filter((r) => r.prerender !== false).map((r) => r.path);
}
