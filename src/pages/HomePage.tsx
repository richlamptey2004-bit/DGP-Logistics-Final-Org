import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck } from 'lucide-react';
import { ContactStrip } from '../components/Layout';
import { SafeImage } from '../components/SafeImage';
import { ServiceIcon } from '../components/ServiceIcon';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const SHIPPING_STEPS = [
  {
    step: '01',
    title: 'Tell us what you want to ship',
    description:
      'Share your cargo details, destination in Ghana, and preferred service or category using the quote form or WhatsApp.',
  },
  {
    step: '02',
    title: 'Confirm the quotation and receiving instructions',
    description:
      'Our team reviews item acceptance, explains the applicable shipping options, and confirms how to label your goods.',
  },
  {
    step: '03',
    title: 'Deliver goods to the designated receiving point in China',
    description:
      'Once instructions are confirmed, arrange for your supplier or courier to drop off the goods at the designated receiving point.',
  },
  {
    step: '04',
    title: 'Receive your goods in Ghana',
    description:
      'Collect your shipment or receive it via your agreed collection or door-to-door delivery arrangement in Ghana.',
  },
];

export function HomePage() {
  const { data, loading } = useSiteData();

  const homePage = data?.pages?.home;
  const settings = data?.settings;
  const homeServices = (data?.services || []).filter((s) => s.show_on_home).slice(0, 6);
  const categories = data?.categories || [];

  useDocumentMeta({
    title: homePage?.meta_title || 'DGP LOGISTICS – From China to Ghana. We deliver.',
    description:
      homePage?.meta_description ||
      'Shipping, repacking and door-to-door delivery for your goods from China to Ghana.',
    canonicalPath: '/',
  });

  const heroHeadline = homePage?.hero_headline || 'From China to Ghana. We deliver.';
  const heroSubheadline =
    homePage?.hero_subheadline ||
    'Arrange shipping, repacking and door-to-door delivery with DGP LOGISTICS. Tell us what you are sending, and our team will help you with the next steps.';
  const heroImage =
    homePage?.hero_image_url || '/src/assets/images/hero_cargo_port_1794939878382.jpg';
  const heroAlt =
    homePage?.hero_image_alt ||
    'Commercial container port terminal with stacked shipping containers and cranes';

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-[#082B59] text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={heroImage}
            alt={heroAlt}
            loading="eager"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#051d3d]/95 via-[#082B59]/85 to-[#082B59]/45"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="text-xs sm:text-sm font-bold tracking-wide text-[#FFD43B]">
              {settings?.route_label || 'China → Ghana'}
            </div>

            <h1
              className="font-extrabold tracking-tight text-white leading-[1.1]"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)', textWrap: 'balance' }}
            >
              {heroHeadline}
            </h1>

            <p className="text-base sm:text-lg text-slate-100 leading-relaxed max-w-xl">
              {heroSubheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/request-quote"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm sm:text-base hover:bg-[#f5c418] transition-colors whitespace-nowrap"
              >
                Request a shipping quote
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-lg border border-white/40 bg-white/10 text-white font-semibold text-sm sm:text-base hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                Explore our services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Highlights */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082B59]">
                Shipping and support services
              </h2>
              <p className="text-base text-slate-600">
                Select a service to see what information is required for a quotation.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#082B59] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              View all services
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loading && homeServices.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 rounded-xl bg-[#F3F6FA] animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeServices.map((service) => (
                <article
                  key={service.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-[#082B59]/40 transition-colors"
                >
                  <div className="aspect-[4/3] bg-[#F3F6FA] overflow-hidden">
                    <SafeImage
                      src={service.image_url}
                      alt={service.image_alt || service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-[#082B59]">
                        <ServiceIcon name={service.icon_name} className="w-5 h-5 shrink-0" />
                        <h3 className="text-lg font-extrabold text-[#082B59]">{service.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {service.short_description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        to={`/services/${service.slug}`}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d] transition-colors whitespace-nowrap"
                      >
                        View service
                      </Link>
                      <Link
                        to={`/request-quote?service=${encodeURIComponent(service.slug)}`}
                        className="text-xs font-bold text-[#082B59] hover:underline underline-offset-4 whitespace-nowrap"
                      >
                        Request quote
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Repacking Feature */}
      {settings?.repacking_published !== false && (
        <section className="bg-[#F3F6FA] border-y border-slate-200 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-5 aspect-[4/3] lg:aspect-auto bg-slate-100">
                <SafeImage
                  src="/src/assets/images/warehouse_repacking_station_1794939878340.jpg"
                  alt="Warehouse repacking station preparing cartons for shipment"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B59]">
                  <PackageCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Cargo preparation</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082B59]">
                  {settings?.repacking_heading || 'Free repacking included in shipments'}
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  {settings?.repacking_body ||
                    'Our repacking service helps prepare your goods for onward shipping. Contact us to confirm the packaging arrangements for your shipment.'}
                </p>
                {settings?.repacking_conditions && (
                  <p className="text-sm text-slate-600 bg-[#F3F6FA] border border-slate-200 rounded-lg px-4 py-3">
                    <strong className="text-[#082B59]">Eligibility &amp; terms: </strong>
                    {settings.repacking_conditions}
                  </p>
                )}
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    to="/services/repacking"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#082B59] text-white text-sm font-bold hover:bg-[#051d3d] transition-colors"
                  >
                    View repacking service
                  </Link>
                  <Link
                    to="/request-quote?service=repacking"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] text-sm font-extrabold hover:bg-[#f5c418] transition-colors"
                  >
                    Ask about repacking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How Shipping Works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082B59]">
              How shipping works
            </h2>
            <p className="text-base text-slate-600">
              Four clear steps from your initial quote enquiry to receiving your goods in Ghana.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SHIPPING_STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-[#F3F6FA] border border-slate-200 rounded-xl p-6 space-y-3"
              >
                <div className="font-mono-tabular text-sm font-bold text-[#082B59]">
                  {item.step}.
                </div>
                <h3 className="text-base font-extrabold text-[#082B59] leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Ship Preview */}
      <section className="bg-[#F3F6FA] border-t border-slate-200 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082B59]">
                What we ship
              </h2>
              <p className="text-base text-slate-600">
                Select a cargo category to start an enquiry with your item type prefilled.
              </p>
            </div>
            <Link
              to="/what-we-ship"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#082B59] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              View full catalogue
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/request-quote?category=${encodeURIComponent(cat.slug)}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-[#082B59] transition-colors"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={cat.image_url}
                    alt={cat.image_alt || cat.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#082B59]">{cat.name}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#082B59] inline-flex items-center gap-1 pt-1">
                    Enquire
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">
            <strong className="text-[#082B59]">Important acceptance note: </strong>
            Acceptance depends on the item, shipping method and applicable requirements. Please
            confirm before sending batteries, liquids, food, cosmetics or other restricted goods.
          </div>
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
