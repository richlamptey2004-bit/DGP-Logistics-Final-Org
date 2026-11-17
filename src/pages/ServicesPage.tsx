import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ContactStrip } from '../components/Layout';
import { SafeImage } from '../components/SafeImage';
import { ServiceIcon } from '../components/ServiceIcon';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function ServicesPage() {
  const { data, loading } = useSiteData();
  const page = data?.pages?.services;
  const services = data?.services || [];
  const faqs = data?.faqs || [];
  const fallbackRateText =
    data?.settings?.pricing_fallback_notice || 'Contact us for current rates and shipment terms.';

  useDocumentMeta({
    title: page?.meta_title || 'Services – DGP LOGISTICS | China to Ghana Freight',
    description:
      page?.meta_description ||
      'Sea freight, air freight, repacking, phone shipping, supplier payment assistance, RMB services, and door-to-door delivery from China to Ghana.',
    canonicalPath: '/services',
  });

  return (
    <div>
      {/* Header */}
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
            Services · China → Ghana
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59] max-w-3xl">
            {page?.hero_headline || 'Logistics services from China to Ghana.'}
          </h1>
          <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
            {page?.hero_subheadline ||
              'Select a service to review what information we need and request a shipping quotation from our team.'}
          </p>
        </div>
      </section>

      {/* Services Catalogue */}
      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && services.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-xl bg-[#F3F6FA] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const publishedRates = (service.rates || []).filter((r) => r.is_published);
                return (
                  <article
                    key={service.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-[#F3F6FA] overflow-hidden">
                      <SafeImage
                        src={service.image_url}
                        alt={service.image_alt || service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-[#082B59]">
                          <ServiceIcon name={service.icon_name} className="w-5 h-5 shrink-0" />
                          <h2 className="text-xl font-extrabold text-[#082B59]">{service.title}</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {service.full_description}
                        </p>
                        <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700">
                          {publishedRates.length > 0 ? (
                            <div className="space-y-1">
                              {publishedRates.map((rate) => (
                                <div key={rate.id} className="font-semibold text-[#082B59]">
                                  {rate.amount_display} {rate.unit}
                                  {rate.estimated_transit ? ` · ${rate.estimated_transit}` : ''}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{fallbackRateText}</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        <Link
                          to={`/services/${service.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d] transition-colors"
                        >
                          View service
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                        <Link
                          to={`/request-quote?service=${encodeURIComponent(service.slug)}`}
                          className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold hover:bg-[#f5c418] transition-colors"
                        >
                          Request quote
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="bg-[#F3F6FA] border-t border-slate-200 py-14 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082B59]">
              Frequently asked shipping questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 group"
                >
                  <summary className="cursor-pointer font-bold text-base text-[#082B59] list-none flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-slate-400 text-lg font-normal shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactStrip />
    </div>
  );
}
