import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { ContactStrip } from '../components/Layout';
import { SafeImage } from '../components/SafeImage';
import { ServiceIcon } from '../components/ServiceIcon';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading } = useSiteData();

  const service = data?.services.find((s) => s.slug === slug);
  const fallbackRateText =
    data?.settings?.pricing_fallback_notice || 'Contact us for current rates and shipment terms.';
  const ghanaWa = data?.settings?.ghana_whatsapp || '+233266663700';
  const chinaWa = data?.settings?.china_whatsapp || '+8615820200000';

  useDocumentMeta({
    title: service ? `${service.title} – DGP LOGISTICS` : 'Service not found – DGP LOGISTICS',
    description: service?.short_description || 'DGP LOGISTICS China to Ghana cargo service details.',
    canonicalPath: slug ? `/services/${slug}` : '/services',
  });

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-72 rounded-xl bg-[#F3F6FA] animate-pulse" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-5">
        <h1 className="text-3xl font-extrabold text-[#082B59]">Service not found</h1>
        <p className="text-base text-slate-600">
          This shipping service is not currently published or the link may have changed.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#082B59] text-white text-sm font-bold"
          >
            Browse all services
          </Link>
          <Link
            to="/request-quote"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] text-sm font-extrabold"
          >
            Request quote
          </Link>
        </div>
      </div>
    );
  }

  const publishedRates = (service.rates || []).filter((r) => r.is_published);

  return (
    <div>
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#082B59] hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            All services
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2.5 text-[#082B59]">
                <ServiceIcon name={service.icon_name} className="w-6 h-6 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  China → Ghana service
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59]">
                {service.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                {service.full_description}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to={`/request-quote?service=${encodeURIComponent(service.slug)}`}
                  className="inline-flex items-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] transition-colors"
                >
                  Request this service
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <a
                  href={`https://wa.me/${ghanaWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello DGP LOGISTICS, I would like to ask about your ${service.title} service from China to Ghana.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 min-h-[46px] px-5 py-3 rounded-lg bg-[#082B59] text-white font-semibold text-sm hover:bg-[#051d3d] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  WhatsApp Ghana
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white">
                <SafeImage
                  src={service.image_url}
                  alt={service.image_alt || service.title}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {service.suitable_for && (
              <div className="border border-slate-200 rounded-xl p-6 space-y-2">
                <h2 className="text-lg font-extrabold text-[#082B59]">Suitable shipment types</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {service.suitable_for}
                </p>
              </div>
            )}

            {service.quote_requirements && (
              <div className="border border-slate-200 rounded-xl p-6 space-y-2">
                <h2 className="text-lg font-extrabold text-[#082B59]">
                  Information needed for a quotation
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {service.quote_requirements}
                </p>
              </div>
            )}

            {service.conditions && (
              <div className="border border-slate-200 rounded-xl p-6 space-y-2">
                <h2 className="text-lg font-extrabold text-[#082B59]">Relevant conditions</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {service.conditions}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#F3F6FA] border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-[#082B59]">Rates &amp; terms</h2>
              {publishedRates.length > 0 ? (
                <div className="space-y-4">
                  {publishedRates.map((rate) => (
                    <div key={rate.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500">{rate.label}</div>
                      <div className="text-xl font-extrabold text-[#082B59] tabular-nums">
                        {rate.amount_display}{' '}
                        <span className="text-sm font-semibold text-slate-600">{rate.unit}</span>
                      </div>
                      {rate.estimated_transit && (
                        <div className="text-xs text-slate-700">
                          Estimated transit: {rate.estimated_transit}
                        </div>
                      )}
                      {rate.conditions && (
                        <div className="text-xs text-slate-600 pt-1">{rate.conditions}</div>
                      )}
                      {rate.effective_date && (
                        <div className="text-xs text-slate-400">
                          Effective: {rate.effective_date}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">{fallbackRateText}</p>
              )}

              <Link
                to={`/request-quote?service=${encodeURIComponent(service.slug)}`}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] transition-colors"
              >
                Request this service
              </Link>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 space-y-3 text-sm">
              <h3 className="font-extrabold text-[#082B59]">Direct WhatsApp contacts</h3>
              <div>
                <div className="text-xs text-slate-500">Ghana team</div>
                <a
                  href={`https://wa.me/${ghanaWa.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-tabular font-bold text-[#082B59] hover:underline"
                >
                  {ghanaWa}
                </a>
              </div>
              <div>
                <div className="text-xs text-slate-500">China team</div>
                <a
                  href={`https://wa.me/${chinaWa.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-tabular font-bold text-[#082B59] hover:underline"
                >
                  {chinaWa}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
