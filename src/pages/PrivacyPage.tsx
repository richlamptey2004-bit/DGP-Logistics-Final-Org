import { ContactStrip } from '../components/Layout';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function PrivacyPage() {
  const { data } = useSiteData();
  const page = data?.pages?.privacy;

  useDocumentMeta({
    title: page?.meta_title || 'Privacy Information – DGP LOGISTICS',
    description:
      page?.meta_description ||
      'How DGP LOGISTICS collects, stores, and uses shipment enquiry details and WhatsApp handover information.',
    canonicalPath: '/privacy',
  });

  const sections = page?.body_sections || [];

  return (
    <div>
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
            Privacy &amp; data handling
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59]">
            {page?.hero_headline || 'Privacy & enquiry data handling'}
          </h1>
          <p className="text-base text-slate-700 leading-relaxed">
            {page?.hero_subheadline ||
              'How we handle the shipment and contact information you provide when requesting a quotation.'}
          </p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-slate-200 pb-6 space-y-2">
              <h2 className="text-xl font-extrabold text-[#082B59]">{section.heading}</h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
