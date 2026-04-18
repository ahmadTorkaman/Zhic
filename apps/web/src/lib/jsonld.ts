import { mediaUrl } from './payload';
import type {
  PayloadProduct,
  PayloadShowroom,
  ShowroomDay,
  ShowroomHourEntry,
} from './payload';
import { plainTextFromRichText } from './richtext';

const AVAILABILITY_SCHEMA: Record<
  NonNullable<PayloadProduct['availability']>,
  string
> = {
  in_stock: 'https://schema.org/InStock',
  made_to_order: 'https://schema.org/PreOrder',
  backorder: 'https://schema.org/BackOrder',
  discontinued: 'https://schema.org/Discontinued',
};

function absolute(baseUrl: string, path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/${path}`;
}

export type JsonLdObject = Record<string, unknown>;

export function productJsonLd(
  product: PayloadProduct,
  baseUrl: string,
): JsonLdObject {
  const images = (product.gallery ?? [])
    .map((m) => mediaUrl(m))
    .filter((u): u is string => Boolean(u))
    .map((u) => (u.startsWith('http') ? u : `${baseUrl}${u}`));
  const materialNames = (product.materialIds ?? [])
    .map((m) => m.name)
    .filter(Boolean);
  const inquiryUrl = `${baseUrl}/contact?product=${encodeURIComponent(
    product.slug,
  )}&reason=quote`;

  const description =
    product.shortDescription ??
    plainTextFromRichText(product.longDescription) ??
    undefined;

  const offers: JsonLdObject | undefined =
    product.basePriceRials != null
      ? {
          '@type': 'Offer',
          priceCurrency: 'IRR',
          price: product.basePriceRials,
          url: inquiryUrl,
          ...(product.availability
            ? { availability: AVAILABILITY_SCHEMA[product.availability] }
            : {}),
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(images.length > 0 ? { image: images } : {}),
    ...(description ? { description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: 'Zhic' },
    ...(materialNames.length > 0 ? { material: materialNames.join(', ') } : {}),
    ...(offers ? { offers } : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
  baseUrl: string,
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: absolute(baseUrl, it.url),
    })),
  };
}

export function collectionPageJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    url: args.url,
    ...(args.description ? { description: args.description } : {}),
  };
}

const SCHEMA_DAY: Record<ShowroomDay, string> = {
  sat: 'Saturday',
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
};

function openingHoursSpec(hours: ShowroomHourEntry[] | null | undefined) {
  return (hours ?? [])
    .filter((h) => !h.closed && h.opens && h.closes)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY[h.day],
      opens: h.opens,
      closes: h.closes,
    }));
}

export function localBusinessJsonLd(
  showroom: PayloadShowroom,
  baseUrl: string,
): JsonLdObject {
  const url = `${baseUrl}/showrooms/${showroom.slug}`;
  const images = (showroom.gallery ?? [])
    .map((m) => mediaUrl(m))
    .filter((u): u is string => Boolean(u))
    .map((u) => (u.startsWith('http') ? u : `${baseUrl}${u}`));
  const coverImg = mediaUrl(showroom.cover ?? null);
  if (coverImg) {
    const abs = coverImg.startsWith('http') ? coverImg : `${baseUrl}${coverImg}`;
    images.unshift(abs);
  }

  const a = showroom.address ?? null;
  const address = a
    ? {
        '@type': 'PostalAddress',
        addressCountry: 'IR',
        addressRegion: a.province ?? undefined,
        addressLocality: a.city ?? undefined,
        streetAddress: [a.district, a.street, a.plaque, a.unit]
          .filter(Boolean)
          .join('، '),
        postalCode: a.postalCode ?? undefined,
      }
    : undefined;

  const geo =
    showroom.geo && typeof showroom.geo.lat === 'number' && typeof showroom.geo.lng === 'number'
      ? {
          '@type': 'GeoCoordinates',
          latitude: showroom.geo.lat,
          longitude: showroom.geo.lng,
        }
      : undefined;

  const description =
    plainTextFromRichText(showroom.description) ??
    showroom.headline ??
    undefined;

  const hours = openingHoursSpec(showroom.hours);

  return {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: showroom.name,
    url,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
    ...(showroom.phone ? { telephone: showroom.phone } : {}),
    ...(showroom.email ? { email: showroom.email } : {}),
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(showroom.googleBusinessProfileUrl || showroom.neshanProfileUrl
      ? {
          sameAs: [
            showroom.googleBusinessProfileUrl,
            showroom.neshanProfileUrl,
          ].filter(Boolean),
        }
      : {}),
  };
}

export function itemListJsonLd(
  items: { name: string; url: string }[],
  baseUrl: string,
  listName?: string,
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName ? { name: listName } : {}),
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      url: absolute(baseUrl, it.url),
    })),
  };
}

export function contactPageJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: args.name,
    url: args.url,
    ...(args.description ? { description: args.description } : {}),
  };
}

export function articlePageJsonLd(args: {
  headline: string;
  url: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.headline,
    url: args.url,
    inLanguage: 'fa-IR',
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: args.image } : {}),
    ...(args.authorName
      ? { author: { '@type': 'Person', name: args.authorName } }
      : {}),
    ...(args.datePublished ? { datePublished: args.datePublished } : {}),
    ...(args.dateModified ? { dateModified: args.dateModified } : {}),
    publisher: { '@type': 'Organization', name: 'Zhic' },
  };
}

export function blogJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: args.name,
    url: args.url,
    inLanguage: 'fa-IR',
    ...(args.description ? { description: args.description } : {}),
    publisher: { '@type': 'Organization', name: 'Zhic' },
  };
}

export function websiteJsonLd(args: {
  name: string;
  url: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: args.name,
    url: args.url,
    inLanguage: 'fa-IR',
    publisher: { '@type': 'Organization', name: args.name },
  };
}

// --- Editorial pages (4.2) --------------------------------------------------

export function faqPageJsonLd(
  items: { question: string; answer: string }[],
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fa-IR',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

export function aboutPageJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: args.name,
    url: args.url,
    inLanguage: 'fa-IR',
    ...(args.description ? { description: args.description } : {}),
  };
}

export function organizationJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: args.name,
    url: args.url,
    ...(args.description ? { description: args.description } : {}),
  };
}

export function placeJsonLd(args: {
  name: string;
  url: string;
  description?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: args.name,
    url: args.url,
    inLanguage: 'fa-IR',
    ...(args.description ? { description: args.description } : {}),
  };
}
