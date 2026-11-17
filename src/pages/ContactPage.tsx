import { MessageCircle, MapPin } from 'lucide-react';
import { EnquiryForm } from '../components/EnquiryForm';
import { ContactStrip } from '../components/Layout';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function ContactPage() {
  const { data } = useSiteData();
  const page = data?.pages?.contact;
  const settings = data?.settings;
  const ghanaWa = settings?.ghana_whatsapp || '+233266663700';
  const chinaWa = settings?.china_whatsapp || '+8615820200000';
  const officePublished = Boolean(settings?.office_details_published);

  useDocumentMeta({
    title: page?.meta_title || 'Contact DGP LOGISTICS – Ghana & China WhatsApp',
    description:
      page?.meta_description ||
      'Speak with DGP LOGISTICS Ghana (+233266663700) or China (+8615820200000), or submit your shipment details to continue on WhatsApp.',
    canonicalPath: '/contact',
  });

  return (
    <div>
      {/* Header */}
      <section className="bg-[#F3F6FA] border-b border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
            Contact DGP LOGISTICS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59] max-w-2xl">
            {page?.hero_headline || 'Let’s discuss your shipment.'}
          </h1>
          <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
            {page?.hero_subheadline ||
              'Tell us what you want to ship from China to Ghana. Contact our Ghana or China team, or complete the form below to continue on WhatsApp.'}
          </p>
        </div>
      </section>

      {/* Contact Cards + Form */}
      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Direct WhatsApp Cards */}
          <div className="lg:col-span-4 space-y-5">
            <div className="border border-slate-200 rounded-xl p-6 bg-[#F3F6FA] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
                Ghana team
              </div>
              <div className="font-mono-tabular text-xl font-extrabold text-[#082B59]">
                {ghanaWa}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                For quotations, Accra and Ghana delivery enquiries, and payment guidance.
              </p>
              {officePublished && settings?.confirmed_ghana_office && (
                <div className="flex items-start gap-2 text-xs text-slate-700 pt-1">
                  <MapPin className="w-4 h-4 text-[#082B59] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{settings.confirmed_ghana_office}</span>
                </div>
              )}
              <a
                href={`https://wa.me/${ghanaWa.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp Ghana
              </a>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-[#F3F6FA] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#082B59]">
                China team
              </div>
              <div className="font-mono-tabular text-xl font-extrabold text-[#082B59]">
                {chinaWa}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                For supplier drop-off coordination, repacking arrangements, and China receiving instructions.
              </p>
              {officePublished && settings?.confirmed_china_office && (
                <div className="flex items-start gap-2 text-xs text-slate-700 pt-1">
                  <MapPin className="w-4 h-4 text-[#082B59] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{settings.confirmed_china_office}</span>
                </div>
              )}
              <a
                href={`https://wa.me/${chinaWa.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-lg bg-[#082B59] text-white font-bold text-sm hover:bg-[#051d3d] transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp China
              </a>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 text-xs text-slate-600 leading-relaxed">
              Receiving warehouse addresses and shipping marks are shared after you submit your
              enquiry or confirm arrangements with our team.
            </div>
          </div>

          {/* Right Column: Enquiry Form */}
          <div className="lg:col-span-8">
            <EnquiryForm />
          </div>
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
