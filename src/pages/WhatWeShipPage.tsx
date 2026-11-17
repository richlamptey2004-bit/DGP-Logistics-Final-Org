import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ContactStrip } from '../components/Layout';
import { SafeImage } from '../components/SafeImage';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function WhatWeShipPage() {
  const { data, loading } = useSiteData();
  const page = data?.pages?.['what-we-ship'];
  const categories = data?.categories || [];

  useDocumentMeta({
    title: page?.meta_title || 'What we ship – DGP LOGISTICS | China to Ghana Cargo',
    description:
      page?.meta_description ||
      'Browse eligible cargo categories shipped from China to Ghana including electronics, fashion, bags, appliances, beauty items, wigs, and spare parts.',
    canonicalPath: '/what-we-ship',
  });

  return (
    <div>
      {/* Header */}
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
            Cargo catalogue · China → Ghana
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59] max-w-3xl">
            {page?.hero_headline || 'Eligible goods we ship from China to Ghana.'}
          </h1>
          <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
            {page?.hero_subheadline ||
              'Choose a cargo category below to start your shipping enquiry with the category preselected.'}
          </p>
        </div>
      </section>

      {/* Cargo Acceptance Notice */}
      <section className="bg-white pt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F3F6FA] border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">
            <strong className="text-[#082B59]">Important cargo acceptance notice: </strong>
            Acceptance depends on the item, shipping method and applicable requirements. Please
            confirm before sending batteries, liquids, food, cosmetics or other restricted goods.
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && categories.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 rounded-xl bg-[#F3F6FA] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <article
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#F3F6FA] overflow-hidden">
                    <SafeImage
                      src={cat.image_url}
                      alt={cat.image_alt || cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-extrabold text-[#082B59]">{cat.name}</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">{cat.description}</p>
                      {cat.restricted_notice && (
                        <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                          {cat.restricted_notice}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <Link
                        to={`/request-quote?category=${encodeURIComponent(cat.slug)}`}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-lg bg-[#082B59] text-white text-sm font-bold hover:bg-[#051d3d] transition-colors"
                      >
                        Enquire about shipping
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
