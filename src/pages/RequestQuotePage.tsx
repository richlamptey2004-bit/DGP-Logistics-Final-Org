import { useSearchParams } from 'react-router-dom';
import { EnquiryForm } from '../components/EnquiryForm';
import { ContactStrip } from '../components/Layout';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function RequestQuotePage() {
  const [searchParams] = useSearchParams();
  const { data } = useSiteData();
  const page = data?.pages?.['request-quote'];

  const initialServiceSlug = searchParams.get('service') || '';
  const initialCategorySlug = searchParams.get('category') || '';

  useDocumentMeta({
    title: page?.meta_title || 'Request a Shipping Quote – DGP LOGISTICS',
    description:
      page?.meta_description ||
      'Submit your cargo details for China to Ghana sea freight, air freight, repacking, or door-to-door delivery and continue on WhatsApp.',
    canonicalPath: '/request-quote',
  });

  return (
    <div>
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
            Shipment enquiry · China → Ghana
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59]">
            {page?.hero_headline || 'Request a shipping quote'}
          </h1>
          <p className="text-base text-slate-700 leading-relaxed">
            {page?.hero_subheadline ||
              'Provide your cargo details below. If you do not yet know the exact weight or CBM, select "Not sure" and our team will guide you.'}
          </p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EnquiryForm
            initialServiceSlug={initialServiceSlug}
            initialCategorySlug={initialCategorySlug}
          />
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
