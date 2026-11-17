import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ContactStrip } from '../components/Layout';
import { SafeImage } from '../components/SafeImage';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function AboutPage() {
  const { data } = useSiteData();
  const page = data?.pages?.about;

  useDocumentMeta({
    title: page?.meta_title || 'About us – DGP LOGISTICS | China to Ghana Cargo Shipping',
    description:
      page?.meta_description ||
      'DGP LOGISTICS helps individuals and businesses arrange cargo shipments from China to Ghana.',
    canonicalPath: '/about',
  });

  const sections = page?.body_sections || [];

  return (
    <div>
      {/* Header Banner */}
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
              About DGP LOGISTICS · China → Ghana
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59] leading-tight">
              {page?.hero_headline || 'Practical cargo shipping from China to Ghana.'}
            </h1>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              {page?.hero_subheadline ||
                'DGP LOGISTICS helps individuals and businesses arrange cargo shipments from China to Ghana. Our services include sea freight, air freight, repacking, supplier payment assistance and door-to-door delivery.'}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/request-quote"
                className="inline-flex items-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] transition-colors"
              >
                Discuss your shipment
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center min-h-[46px] px-5 py-3 rounded-lg bg-[#082B59] text-white font-semibold text-sm hover:bg-[#051d3d] transition-colors"
              >
                Explore our services
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white">
              <SafeImage
                src={
                  page?.hero_image_url ||
                  '/src/assets/images/warehouse_repacking_station_1794939878340.jpg'
                }
                alt={page?.hero_image_alt || 'Cargo cartons staged inside an export warehouse'}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Credible Explanatory Sections */}
      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, idx) => (
            <article
              key={section.id}
              className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white space-y-3"
            >
              <div className="font-mono-tabular text-xs font-bold text-[#082B59]">
                0{idx + 1}.
              </div>
              <h2 className="text-xl font-extrabold text-[#082B59]">{section.heading}</h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {section.content}
              </p>
            </article>
          ))}
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
