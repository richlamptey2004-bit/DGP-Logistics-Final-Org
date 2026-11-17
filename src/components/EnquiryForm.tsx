import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, AlertCircle, MessageCircle } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import type { OfficePreference } from '../types/logistics';

interface EnquiryFormProps {
  initialServiceSlug?: string;
  initialCategorySlug?: string;
  compactHeading?: boolean;
}

interface SubmissionSuccess {
  reference_code: string;
  preferred_office: OfficePreference;
  whatsapp_message: string;
  whatsapp_url: string;
}

function createSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildFallbackWhatsApp(
  office: OfficePreference,
  ghanaNumber: string,
  chinaNumber: string,
  fields: {
    fullName: string;
    phoneWhatsapp: string;
    serviceName: string;
    categoryName: string;
    goodsDescription: string;
    destinationCity: string;
    deliveryArea: string;
    doorToDoor: boolean;
  },
) {
  const lines = [
    'Hello DGP LOGISTICS,',
    '',
    'I would like a shipping quotation.',
    '',
    `Name: ${fields.fullName || 'Not provided'}`,
    `Phone: ${fields.phoneWhatsapp || 'Not provided'}`,
    `Service: ${fields.serviceName || 'Not sure'}`,
    fields.categoryName ? `Cargo category: ${fields.categoryName}` : '',
    `Goods: ${fields.goodsDescription || 'Not provided'}`,
    `Destination: ${fields.deliveryArea ? `${fields.destinationCity} (${fields.deliveryArea})` : fields.destinationCity || 'Not provided'}`,
    `Door-to-door delivery: ${fields.doorToDoor ? 'Yes' : 'No'}`,
    '',
    'Please confirm the available shipping options and quotation.',
  ].filter(Boolean);
  const msg = lines.join('\n');
  const raw = office === 'China' ? chinaNumber : ghanaNumber;
  const digits = raw.replace(/[^0-9]/g, '');
  return {
    message: msg,
    url: `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`,
  };
}

export function EnquiryForm({
  initialServiceSlug = '',
  initialCategorySlug = '',
  compactHeading = false,
}: EnquiryFormProps) {
  const { data } = useSiteData();
  const services = data?.services || [];
  const categories = data?.categories || [];
  const ghanaWa = data?.settings.ghana_whatsapp || '+233266663700';
  const chinaWa = data?.settings.china_whatsapp || '+8615820200000';

  const formStartedAtRef = useRef<number>(Date.now());
  const [clientSubmissionId, setClientSubmissionId] = useState<string>(() => createSubmissionId());

  const [fullName, setFullName] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug || 'not-sure');
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug || '');
  const [goodsDescription, setGoodsDescription] = useState('');

  const [quantity, setQuantity] = useState('');
  const [quantityNotSure, setQuantityNotSure] = useState(false);

  const [weightKg, setWeightKg] = useState('');
  const [weightNotSure, setWeightNotSure] = useState(false);

  const [dimensionsCm, setDimensionsCm] = useState('');
  const [dimensionsNotSure, setDimensionsNotSure] = useState(false);

  const [volumeCbm, setVolumeCbm] = useState('');
  const [volumeNotSure, setVolumeNotSure] = useState(false);

  const [chinaLocation, setChinaLocation] = useState('');
  const [preferredMethod, setPreferredMethod] = useState('Not sure');
  const [doorToDoor, setDoorToDoor] = useState(false);
  const [preferredOffice, setPreferredOffice] = useState<OfficePreference>('Ghana');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SubmissionSuccess | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialServiceSlug) setServiceSlug(initialServiceSlug);
  }, [initialServiceSlug]);

  useEffect(() => {
    if (initialCategorySlug) setCategorySlug(initialCategorySlug);
  }, [initialCategorySlug]);

  const selectedServiceObj = useMemo(
    () => services.find((s) => s.slug === serviceSlug),
    [services, serviceSlug],
  );
  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  );

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      errs.fullName = 'Enter your full name.';
    }
    if (phoneWhatsapp.replace(/[^0-9+]/g, '').length < 7) {
      errs.phoneWhatsapp = 'Enter a valid phone or WhatsApp number (e.g. +233...).';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address or leave this field blank.';
    }
    if (destinationCity.trim().length < 2) {
      errs.destinationCity = 'Enter your destination city or town in Ghana.';
    }
    if (goodsDescription.trim().length < 3) {
      errs.goodsDescription = 'Briefly describe the goods you want to ship.';
    }
    if (!consentAccepted) {
      errs.consentAccepted =
        'Confirm consent to process your enquiry and continue via WhatsApp.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_submission_id: clientSubmissionId,
          form_started_at: formStartedAtRef.current,
          company_website: honeypot,
          full_name: fullName.trim(),
          phone_whatsapp: phoneWhatsapp.trim(),
          email: email.trim(),
          destination_city: destinationCity.trim(),
          delivery_area: deliveryArea.trim(),
          service_slug: serviceSlug || 'not-sure',
          service_name: selectedServiceObj?.title || 'Not sure',
          cargo_category_slug: categorySlug,
          cargo_category_name: selectedCategoryObj?.name || '',
          goods_description: goodsDescription.trim(),
          quantity: quantityNotSure ? 'Not sure' : quantity.trim() || 'Not sure',
          estimated_weight_kg: weightNotSure ? 'Not sure' : weightKg.trim() || 'Not sure',
          dimensions_cm: dimensionsNotSure ? 'Not sure' : dimensionsCm.trim() || 'Not sure',
          estimated_volume_cbm: volumeNotSure ? 'Not sure' : volumeCbm.trim() || 'Not sure',
          china_location: chinaLocation.trim(),
          preferred_shipping_method: preferredMethod,
          door_to_door_required: doorToDoor,
          preferred_office: preferredOffice,
          additional_notes: additionalNotes.trim(),
          consent_accepted: true,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Submission failed (HTTP ${res.status}).`);
      }

      const enquiry = body.enquiry as SubmissionSuccess;
      setSuccessData(enquiry);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not save your enquiry to the server. Please use the direct WhatsApp link below.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function handleResetNew() {
    setSuccessData(null);
    setSubmitError(null);
    setClientSubmissionId(createSubmissionId());
    formStartedAtRef.current = Date.now();
    setGoodsDescription('');
    setAdditionalNotes('');
  }

  if (successData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Enquiry saved · Reference generated
          </div>
          <h2 className="text-2xl font-extrabold text-[#082B59]">
            Continue on WhatsApp to send your enquiry
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your enquiry has been recorded under reference{' '}
            <span className="font-mono-tabular font-bold text-[#082B59]">
              {successData.reference_code}
            </span>
            . Tap <strong>Open WhatsApp</strong> below, then tap <strong>Send</strong> inside WhatsApp
            to start the conversation with our {successData.preferred_office} team. Opening WhatsApp
            does not automatically confirm a booking until our team replies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={successData.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            Open WhatsApp ({successData.preferred_office} team)
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => void handleCopy(successData.whatsapp_message)}
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-lg border border-slate-300 bg-white text-[#082B59] font-semibold text-sm hover:bg-[#F3F6FA] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                Message copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                Copy message
              </>
            )}
          </button>
        </div>

        <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Prepared WhatsApp message preview
          </div>
          <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#172536] font-sans leading-relaxed">
            {successData.whatsapp_message}
          </pre>
        </div>

        <div>
          <button
            type="button"
            onClick={handleResetNew}
            className="text-sm font-semibold text-[#082B59] underline underline-offset-4 hover:text-slate-700"
          >
            Submit another shipment enquiry
          </button>
        </div>
      </div>
    );
  }

  const fallbackWa = buildFallbackWhatsApp(preferredOffice, ghanaWa, chinaWa, {
    fullName,
    phoneWhatsapp,
    serviceName: selectedServiceObj?.title || 'Not sure',
    categoryName: selectedCategoryObj?.name || '',
    goodsDescription,
    destinationCity,
    deliveryArea,
    doorToDoor,
  });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      {!compactHeading && (
        <div className="space-y-1.5 border-b border-slate-200 pb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#082B59]">
            Shipment enquiry details
          </h2>
          <p className="text-sm text-slate-600">
            This is a shipping enquiry. Prices, acceptance and delivery arrangements will be confirmed by DGP LOGISTICS.
          </p>
        </div>
      )}

      {/* Honeypot anti-spam field */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="company_website">Leave this blank</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">Enquiry could not be saved</p>
              <p className="mt-0.5">{submitError}</p>
            </div>
          </div>
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <a
              href={fallbackWa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d]"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              Continue directly on WhatsApp (not saved to portal)
            </a>
            <button
              type="button"
              onClick={() => void handleCopy(fallbackWa.message)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-red-300 bg-white text-red-900 text-xs font-semibold hover:bg-red-100"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy message
            </button>
          </div>
        </div>
      )}

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="enq-full-name" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Full name <span className="text-red-700">*</span>
          </label>
          <input
            id="enq-full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Kwame Mensah"
            aria-invalid={Boolean(fieldErrors.fullName)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
          {fieldErrors.fullName && (
            <p className="mt-1 text-xs font-medium text-red-700">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="enq-phone" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Phone or WhatsApp number <span className="text-red-700">*</span>
          </label>
          <input
            id="enq-phone"
            type="tel"
            required
            value={phoneWhatsapp}
            onChange={(e) => setPhoneWhatsapp(e.target.value)}
            placeholder="e.g. +233240000000"
            aria-invalid={Boolean(fieldErrors.phoneWhatsapp)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
          {fieldErrors.phoneWhatsapp && (
            <p className="mt-1 text-xs font-medium text-red-700">{fieldErrors.phoneWhatsapp}</p>
          )}
        </div>

        <div>
          <label htmlFor="enq-email" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Email address <span className="text-xs font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="enq-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs font-medium text-red-700">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="enq-city" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Ghana destination city or town <span className="text-red-700">*</span>
          </label>
          <input
            id="enq-city"
            type="text"
            required
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="e.g. Accra, Kumasi, Takoradi, Tamale"
            aria-invalid={Boolean(fieldErrors.destinationCity)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
          {fieldErrors.destinationCity && (
            <p className="mt-1 text-xs font-medium text-red-700">{fieldErrors.destinationCity}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="enq-area" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Delivery area or landmark{' '}
            <span className="text-xs font-normal text-slate-500">
              (optional — no exact residential address needed at enquiry stage)
            </span>
          </label>
          <input
            id="enq-area"
            type="text"
            value={deliveryArea}
            onChange={(e) => setDeliveryArea(e.target.value)}
            placeholder="e.g. Makola, Circle, Adum, East Legon"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
        </div>
      </div>

      {/* Service & Cargo Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
        <div>
          <label htmlFor="enq-service" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Selected service <span className="text-red-700">*</span>
          </label>
          <select
            id="enq-service"
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] focus:border-[#082B59]"
          >
            <option value="not-sure">Not sure — please advise</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.slug}>
                {svc.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="enq-category" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Cargo category <span className="text-xs font-normal text-slate-500">(optional)</span>
          </label>
          <select
            id="enq-category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] focus:border-[#082B59]"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="enq-goods" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Goods description <span className="text-red-700">*</span>
          </label>
          <textarea
            id="enq-goods"
            required
            rows={3}
            value={goodsDescription}
            onChange={(e) => setGoodsDescription(e.target.value)}
            placeholder="Describe the items (e.g. 20 boxes of boxed sneakers, or 5 sealed iPhone units). Mention if batteries or liquids are included."
            aria-invalid={Boolean(fieldErrors.goodsDescription)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#172536] placeholder:text-slate-400 focus:border-[#082B59]"
          />
          {fieldErrors.goodsDescription && (
            <p className="mt-1 text-xs font-medium text-red-700">{fieldErrors.goodsDescription}</p>
          )}
        </div>
      </div>

      {/* Measurements (Optional / Not Sure supported) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="text-sm font-bold text-[#082B59]">
          Shipment measurements &amp; China pickup info (optional)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="enq-qty" className="text-sm font-semibold text-[#172536]">
                Quantity
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quantityNotSure}
                  onChange={(e) => setQuantityNotSure(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Not sure
              </label>
            </div>
            <input
              id="enq-qty"
              type="text"
              disabled={quantityNotSure}
              value={quantityNotSure ? 'Not sure' : quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 3 cartons / 12 pieces"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="enq-weight" className="text-sm font-semibold text-[#172536]">
                Estimated weight (kg)
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weightNotSure}
                  onChange={(e) => setWeightNotSure(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Not sure
              </label>
            </div>
            <input
              id="enq-weight"
              type="text"
              disabled={weightNotSure}
              value={weightNotSure ? 'Not sure' : weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 18 kg"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="enq-dims" className="text-sm font-semibold text-[#172536]">
                Package dimensions (cm)
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dimensionsNotSure}
                  onChange={(e) => setDimensionsNotSure(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Not sure
              </label>
            </div>
            <input
              id="enq-dims"
              type="text"
              disabled={dimensionsNotSure}
              value={dimensionsNotSure ? 'Not sure' : dimensionsCm}
              onChange={(e) => setDimensionsCm(e.target.value)}
              placeholder="e.g. 60 x 40 x 40 cm"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="enq-cbm" className="text-sm font-semibold text-[#172536]">
                Estimated volume (CBM)
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={volumeNotSure}
                  onChange={(e) => setVolumeNotSure(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Not sure
              </label>
            </div>
            <input
              id="enq-cbm"
              type="text"
              disabled={volumeNotSure}
              value={volumeNotSure ? 'Not sure' : volumeCbm}
              onChange={(e) => setVolumeCbm(e.target.value)}
              placeholder="e.g. 0.45 CBM"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="enq-china-loc" className="block text-sm font-semibold text-[#172536] mb-1.5">
              Current location of goods in China{' '}
              <span className="text-xs font-normal text-slate-500">(if known)</span>
            </label>
            <input
              id="enq-china-loc"
              type="text"
              value={chinaLocation}
              onChange={(e) => setChinaLocation(e.target.value)}
              placeholder="e.g. Guangzhou, Yiwu, Shenzhen, Foshan"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm"
            />
          </div>

          <div>
            <label htmlFor="enq-method" className="block text-sm font-semibold text-[#172536] mb-1.5">
              Preferred shipping method
            </label>
            <select
              id="enq-method"
              value={preferredMethod}
              onChange={(e) => setPreferredMethod(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="Not sure">Not sure — advise me</option>
              <option value="Sea freight">Sea freight</option>
              <option value="Air freight">Air freight</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={doorToDoor}
            onChange={(e) => setDoorToDoor(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-[#082B59]"
          />
          <span className="text-sm text-[#172536]">
            Door-to-door delivery required in Ghana (availability and charges depend on destination and shipment)
          </span>
        </label>
      </div>

      {/* Preferred Office & Additional Notes */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div>
          <span className="block text-sm font-semibold text-[#172536] mb-2">
            Preferred WhatsApp office <span className="text-red-700">*</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPreferredOffice('Ghana')}
              className={`min-h-[48px] px-4 py-3 rounded-lg border text-left transition-colors ${
                preferredOffice === 'Ghana'
                  ? 'border-[#082B59] bg-[#F3F6FA] text-[#082B59]'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">Ghana team</div>
              <div className="text-xs font-mono-tabular text-slate-600">{ghanaWa}</div>
            </button>
            <button
              type="button"
              onClick={() => setPreferredOffice('China')}
              className={`min-h-[48px] px-4 py-3 rounded-lg border text-left transition-colors ${
                preferredOffice === 'China'
                  ? 'border-[#082B59] bg-[#F3F6FA] text-[#082B59]'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">China team</div>
              <div className="text-xs font-mono-tabular text-slate-600">{chinaWa}</div>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="enq-notes" className="block text-sm font-semibold text-[#172536] mb-1.5">
            Additional notes <span className="text-xs font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="enq-notes"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any repacking questions, supplier payment questions, or timing details"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>
      </div>

      {/* Consent & Submit */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            aria-invalid={Boolean(fieldErrors.consentAccepted)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-[#082B59]"
          />
          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            I consent to DGP LOGISTICS storing this enquiry and preparing my submitted details to
            continue on WhatsApp.
          </span>
        </label>
        {fieldErrors.consentAccepted && (
          <p className="text-xs font-medium text-red-700">{fieldErrors.consentAccepted}</p>
        )}

        <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600">
          This is a shipping enquiry. Prices, acceptance and delivery arrangements will be confirmed by DGP LOGISTICS.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] disabled:opacity-60 transition-colors"
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitting ? 'Saving enquiry...' : 'Submit enquiry and continue on WhatsApp'}
        </button>
      </div>
    </form>
  );
}
