import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Database, MapPinned, ShieldCheck } from 'lucide-react';
import { AreaAIChat } from '@/components/AreaAIChat';

const pageUrl = 'https://whatchangedaround.me/ai';
const pageDescription =
  'Ask questions about neighborhood change by US ZIP code. Explore demographic context, recently edited local place records, evidence, and data limitations.';

export const metadata: Metadata = {
  title: 'AI Neighborhood Change Assistant by ZIP Code',
  description: pageDescription,
  keywords: [
    'AI neighborhood assistant',
    'neighborhood change by ZIP code',
    'ask AI about an area',
    'local demographic trends',
    'recent place record changes',
    'US ZIP code research',
    'neighborhood intelligence AI',
    'public data neighborhood analysis'
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'What Changed Around Me',
    title: 'AI Neighborhood Change Assistant by ZIP Code',
    description: pageDescription,
    images: [
      {
        url: '/architecture.png',
        width: 1200,
        height: 630,
        alt: 'AI neighborhood change assistant for US ZIP codes'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Neighborhood Change Assistant by ZIP Code',
    description: pageDescription,
    creator: '@nilaymallikX',
    images: ['/architecture.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  category: 'technology'
};

const faqs = [
  {
    question: 'What can the neighborhood AI assistant answer?',
    answer:
      'It can explain available demographic context, compare published estimates over time, and summarize recently edited local place records for a five-digit US ZIP code.'
  },
  {
    question: 'Does a map edit prove that a business opened or closed?',
    answer:
      'No. A map edit date shows when a public record changed. The assistant only identifies an opening, closure, or rename when the source includes supporting status or date fields.'
  },
  {
    question: 'Are demographic values exact?',
    answer:
      'No. Demographic values are published estimates and may use a broader state baseline when ZIP-level history is unavailable. The answer labels that limitation when it applies.'
  },
  {
    question: 'Which locations are supported?',
    answer:
      'The assistant accepts five-digit US ZIP codes. Available detail varies by ZIP because public demographic and place-record coverage is not uniform.'
  }
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: 'AI Neighborhood Change Assistant by ZIP Code',
      description: pageDescription,
      isPartOf: { '@id': 'https://whatchangedaround.me/#website' },
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` }
    },
    {
      '@type': 'WebApplication',
      '@id': `${pageUrl}#application`,
      name: 'What Changed Around Me AI',
      url: pageUrl,
      applicationCategory: 'GeographicApplication',
      operatingSystem: 'Any',
      description: pageDescription,
      featureList: [
        'ZIP code neighborhood questions',
        'Structured demographic explanations',
        'Recently edited local place records',
        'Visible source and uncertainty notes'
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://whatchangedaround.me'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'AI Neighborhood Assistant',
          item: pageUrl
        }
      ]
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    }
  ]
};

export default function AINeighborhoodPage() {
  return (
    <main className="overflow-hidden bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="border-b border-zinc-800 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100dvh-12rem)] max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="max-w-xl">
            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-400">
              Neighborhood change assistant
            </p>
            <h1 className="font-sans text-5xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Ask AI what changed in any US ZIP
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
              Get evidence-aware answers from public place records and demographic context, with uncertainty stated clearly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#area-ai-chat"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
              >
                Ask a question
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/explore"
                className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Browse ZIP reports
              </Link>
            </div>
          </div>

          <AreaAIChat standalone />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">How answers work</p>
            <h2 className="mt-3 font-sans text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Answers built from evidence
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Each answer separates published estimates from map-record signals so different kinds of evidence stay easy to evaluate.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="min-h-72 rounded-2xl border border-zinc-800 bg-zinc-950 p-7 sm:p-9">
              <Database className="h-7 w-7 text-emerald-400" />
              <h3 className="mt-10 text-2xl font-black uppercase tracking-tight">Demographic context</h3>
              <p className="mt-3 max-w-xl leading-relaxed text-zinc-400">
                Published population, household, income, housing, age, poverty, and education estimates are compared only when compatible history is available.
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-white p-7 text-black sm:p-9">
              <MapPinned className="h-7 w-7" />
              <h3 className="mt-10 text-2xl font-black uppercase tracking-tight">Place-record signals</h3>
              <p className="mt-3 leading-relaxed text-zinc-700">
                Recently edited records can surface shops, services, amenities, and closures near a ZIP center while keeping edit dates distinct from real-world event dates.
              </p>
            </article>
          </div>

          <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-7 sm:flex-row sm:items-center sm:p-9">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-black">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </span>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Uncertainty stays visible</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Every response ends with a data-limits note, including missing coverage, state-level fallbacks, or evidence that cannot establish a physical change.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">Before you ask</p>
            <h2 className="mt-3 font-sans text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Common questions
            </h2>
          </div>
          <div className="divide-y divide-zinc-800 border-y border-zinc-800">
            {faqs.map(faq => (
              <details key={faq.question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-sm font-black text-white marker:hidden sm:text-base">
                  {faq.question}
                  <span className="text-xl font-light text-zinc-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-3xl pt-4 text-sm leading-relaxed text-zinc-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
