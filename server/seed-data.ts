import type {
  CargoCategory,
  EditablePage,
  FAQItem,
  LogisticsService,
  MediaAsset,
  ServiceRate,
  SiteSettings,
} from '../src/types/logistics';

export const SEED_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media-hero-port',
    file_name: 'hero_cargo_port_1794939878382.jpg',
    url: '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    alt_text: 'Commercial container port terminal with stacked navy and yellow shipping containers and gantry cranes',
    source_credit: 'Editorial commercial port logistics photography',
    licence_info: 'Project visual asset — replace with verified Ghana port or DGP operations photo in Admin Media Library when available',
    mime_type: 'image/jpeg',
    size_bytes: 285000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'media-warehouse-repacking',
    file_name: 'warehouse_repacking_station_1794939878340.jpg',
    url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    alt_text: 'Export consolidation warehouse with stacked cartons on pallets and a repacking inspection station',
    source_credit: 'Editorial warehouse consolidation photography',
    licence_info: 'Project visual asset — representative logistics scene, not an owned DGP facility',
    mime_type: 'image/jpeg',
    size_bytes: 264000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'media-air-cargo',
    file_name: 'air_cargo_loading_1794939877714.jpg',
    url: '/src/assets/images/air_cargo_loading_1794939877714.jpg',
    alt_text: 'Air freight cargo aircraft on airport tarmac being loaded with aluminum cargo containers',
    source_credit: 'Editorial air freight photography',
    licence_info: 'Project visual asset — representative air cargo operations',
    mime_type: 'image/jpeg',
    size_bytes: 252000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'media-local-delivery',
    file_name: 'local_cargo_delivery_1794939879425.jpg',
    url: '/src/assets/images/local_cargo_delivery_1794939879425.jpg',
    alt_text: 'Commercial delivery van parked beside strapped cargo parcels on an urban street for local handover',
    source_credit: 'Editorial West African urban delivery photography',
    licence_info: 'Project visual asset — representative delivery vehicle, not a branded DGP vehicle',
    mime_type: 'image/jpeg',
    size_bytes: 271000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'media-electronics-cargo',
    file_name: 'cargo_electronics_clean_1794939915590.jpg',
    url: '/src/assets/images/cargo_electronics_clean_1794939915590.jpg',
    alt_text: 'Sealed smartphone boxes, laptops, and small electronics cushioned in bubble wrap inside a shipping carton',
    source_credit: 'Editorial electronics cargo packing photography',
    licence_info: 'Project visual asset — representative packaged electronics',
    mime_type: 'image/jpeg',
    size_bytes: 248000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'media-wholesale-goods',
    file_name: 'cargo_wholesale_goods_1794939917144.jpg',
    url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    alt_text: 'Wholesale clothing bales, boxed footwear cartons, and handbags staged on warehouse shelves for export',
    source_credit: 'Editorial wholesale trade goods photography',
    licence_info: 'Project visual asset — representative wholesale cargo consolidation',
    mime_type: 'image/jpeg',
    size_bytes: 259000,
    created_at: '2026-01-15T08:00:00.000Z',
  },
];

export const SEED_SITE_SETTINGS: SiteSettings = {
  id: 'default',
  business_name: 'DGP LOGISTICS',
  route_label: 'China → Ghana',
  ghana_whatsapp: '+233266663700',
  china_whatsapp: '+8615820200000',
  logo_media_id: null,
  logo_url: null,
  logo_alt: 'DGP LOGISTICS',
  draft_ghana_office: 'Adabraka, opposite the Police Station (Draft from flyer — confirm full address before publishing)',
  draft_china_office: 'Foshan, Guangdong (Draft from flyer — confirm warehouse receiving address before publishing)',
  confirmed_ghana_office: '',
  confirmed_china_office: '',
  office_details_published: false,
  repacking_heading: 'Free repacking included in shipments',
  repacking_body:
    'Our repacking service helps prepare your goods for onward shipping. Contact us to confirm the packaging arrangements for your shipment.',
  repacking_conditions: '',
  repacking_published: true,
  pricing_fallback_notice: 'Contact us for current rates and shipment terms.',
  updated_at: '2026-01-15T08:00:00.000Z',
};

export const SEED_PAGES: Record<string, EditablePage> = {
  home: {
    slug: 'home',
    title: 'Home',
    meta_title: 'DGP LOGISTICS – From China to Ghana. We deliver.',
    meta_description:
      'Shipping, repacking and door-to-door delivery for your goods from China to Ghana. Request a sea freight, air freight or phone shipping quotation.',
    hero_headline: 'From China to Ghana. We deliver.',
    hero_subheadline:
      'Arrange shipping, repacking and door-to-door delivery with DGP LOGISTICS. Tell us what you are sending, and our team will help you with the next steps.',
    hero_media_id: 'media-hero-port',
    hero_image_url: '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    hero_image_alt: 'Commercial container port terminal with stacked shipping containers and cranes',
    body_sections: [
      {
        id: 'steps-heading',
        heading: 'How shipping works',
        content: 'Four straightforward steps from your enquiry to receiving your goods in Ghana.',
      },
    ],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  about: {
    slug: 'about',
    title: 'About us',
    meta_title: 'About Us – DGP LOGISTICS | China to Ghana Cargo Shipping',
    meta_description:
      'Learn how DGP LOGISTICS helps Ghanaian traders, businesses, and individuals ship goods from China to Ghana via sea and air freight.',
    hero_headline: 'Practical cargo shipping from China to Ghana.',
    hero_subheadline:
      'DGP LOGISTICS helps individuals and businesses arrange cargo shipments from China to Ghana. Our services include sea freight, air freight, repacking, supplier payment assistance and door-to-door delivery.',
    hero_media_id: 'media-warehouse-repacking',
    hero_image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    hero_image_alt: 'Export warehouse packing station with stacked shipping cartons',
    body_sections: [
      {
        id: 'who-we-help',
        heading: 'Who we help',
        content:
          'We work with Ghanaian traders, online shop owners, small businesses, and individuals sourcing goods from suppliers in China. Whether you are bringing in wholesale stock or personal items, our team guides you through the right shipping option.',
      },
      {
        id: 'route-and-services',
        heading: 'The China to Ghana shipping route',
        content:
          'We coordinate cargo movement from China to Ghana with options for sea freight, air freight for eligible general goods, phone shipping, supplier payment assistance, RMB services, repacking, and door-to-door delivery in Ghana.',
      },
      {
        id: 'quotation-process',
        heading: 'How customers request a quotation',
        content:
          'Start by submitting your shipment details on our Request Quote page. Once submitted, your enquiry reference is generated and you can continue directly on WhatsApp with our Ghana or China team to confirm rates, receiving instructions, and delivery options.',
      },
      {
        id: 'accurate-cargo',
        heading: 'Why accurate cargo information matters',
        content:
          'Sharing clear details about what you are shipping, item quantities, batteries or liquids, and approximate weight or dimensions helps our team recommend the right freight method, confirm item acceptance, and give you an accurate quotation without delays.',
      },
    ],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  services: {
    slug: 'services',
    title: 'Services',
    meta_title: 'Services – DGP LOGISTICS | Sea Freight, Air Freight & Delivery',
    meta_description:
      'Explore sea freight, air freight, repacking, phone shipping, supplier payment assistance, RMB services, and door-to-door delivery from China to Ghana.',
    hero_headline: 'Logistics services from China to Ghana.',
    hero_subheadline:
      'Select a service to review what information we need and request a shipping quotation from our team.',
    hero_media_id: 'media-air-cargo',
    hero_image_url: '/src/assets/images/air_cargo_loading_1794939877714.jpg',
    hero_image_alt: 'Cargo aircraft loading freight containers on the tarmac',
    body_sections: [],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  'what-we-ship': {
    slug: 'what-we-ship',
    title: 'What we ship',
    meta_title: 'What We Ship – DGP LOGISTICS | Eligible Cargo Categories',
    meta_description:
      'View cargo categories we handle from China to Ghana including electronics, fashion, bags, home appliances, beauty items, wigs, and spare parts.',
    hero_headline: 'Eligible goods we ship from China to Ghana.',
    hero_subheadline:
      'Choose a cargo category below to start your shipping enquiry with the category preselected.',
    hero_media_id: 'media-wholesale-goods',
    hero_image_url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    hero_image_alt: 'Wholesale cartons of apparel, footwear, and bags staged for export',
    body_sections: [
      {
        id: 'acceptance-notice',
        heading: 'Cargo acceptance notice',
        content:
          'Acceptance depends on the item, shipping method and applicable requirements. Please confirm before sending batteries, liquids, food, cosmetics or other restricted goods.',
      },
    ],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  contact: {
    slug: 'contact',
    title: 'Contact',
    meta_title: 'Contact DGP LOGISTICS – Ghana & China WhatsApp Teams',
    meta_description:
      'Speak with DGP LOGISTICS in Ghana (+233266663700) or China (+8615820200000), or submit your shipment details to continue on WhatsApp.',
    hero_headline: 'Let’s discuss your shipment.',
    hero_subheadline:
      'Tell us what you want to ship from China to Ghana. Contact our Ghana or China team, or complete the form below to continue on WhatsApp.',
    hero_media_id: 'media-local-delivery',
    hero_image_url: '/src/assets/images/local_cargo_delivery_1794939879425.jpg',
    hero_image_alt: 'Commercial cargo delivery van prepared for local handover',
    body_sections: [],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  'request-quote': {
    slug: 'request-quote',
    title: 'Request a shipping quote',
    meta_title: 'Request a Shipping Quote – DGP LOGISTICS',
    meta_description:
      'Submit your cargo details for sea freight, air freight, repacking, or door-to-door delivery from China to Ghana and continue on WhatsApp.',
    hero_headline: 'Request a shipping quote',
    hero_subheadline:
      'Provide your cargo details below. If you do not yet know the exact weight or CBM, select "Not sure" and our team will guide you.',
    hero_media_id: null,
    hero_image_url: null,
    hero_image_alt: '',
    body_sections: [],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    meta_title: 'Privacy Information – DGP LOGISTICS',
    meta_description:
      'How DGP LOGISTICS collects, stores, and uses shipment enquiry details and WhatsApp handover information.',
    hero_headline: 'Privacy & enquiry data handling',
    hero_subheadline:
      'How we handle the shipment and contact information you provide when requesting a quotation.',
    hero_media_id: null,
    hero_image_url: null,
    hero_image_alt: '',
    body_sections: [
      {
        id: 'data-collected',
        heading: 'Information we collect',
        content:
          'When you submit a shipment enquiry, we collect your name, phone or WhatsApp number, optional email address, destination city or town in Ghana, cargo description, and optional shipment measurements so our team can prepare a quotation.',
      },
      {
        id: 'how-used',
        heading: 'How we use your information',
        content:
          'Your enquiry details are stored securely for our logistics staff to review your request, confirm item eligibility, prepare rates, and communicate with you via your chosen Ghana or China WhatsApp contact.',
      },
      {
        id: 'whatsapp-handover',
        heading: 'WhatsApp handover',
        content:
          'Submitting the enquiry form prepares a WhatsApp message containing your enquiry reference and shipment summary. You remain in control and must tap Send inside WhatsApp to start the chat with our team.',
      },
      {
        id: 'contact-privacy',
        heading: 'Questions or updates',
        content:
          'To update or ask about a submitted enquiry, message our Ghana team (+233266663700) or China team (+8615820200000) with your enquiry reference.',
      },
    ],
    updated_at: '2026-01-15T08:00:00.000Z',
  },
};

export const SEED_SERVICES: LogisticsService[] = [
  {
    id: 'srv-sea-freight',
    slug: 'sea-freight',
    title: 'Sea freight',
    short_description:
      'For customers shipping larger or bulkier consignments from China to Ghana.',
    full_description:
      'For customers shipping larger or bulkier consignments from China to Ghana. Share your cargo details, dimensions and destination to request a quotation.',
    suitable_for:
      'Bulk wholesale stock, heavy cartons, home appliances, commercial inventory, furniture, and non-urgent restocks.',
    quote_requirements:
      'Item description, carton count or quantity, approximate dimensions (cm) or volume in CBM (or "Not sure"), and your destination city in Ghana.',
    conditions:
      'Cargo acceptance, container consolidation schedules, and transit estimates are confirmed by the team once item details are reviewed.',
    icon_name: 'Ship',
    media_id: 'media-hero-port',
    image_url: '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    image_alt: 'Shipping containers stacked at a commercial sea port terminal',
    sort_order: 1,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-air-freight',
    slug: 'air-freight',
    title: 'Air freight',
    short_description:
      'For customers who want an air-shipping option for eligible general goods.',
    full_description:
      'For customers who want an air-shipping option for eligible goods. Provide the item type, weight and destination so the team can confirm the available arrangements.',
    suitable_for:
      'Time-sensitive stock, clothing, shoes, bags, wigs, light commercial parcels, and eligible electronics.',
    quote_requirements:
      'Item type, whether batteries or liquids are included, estimated weight in kg (or "Not sure"), and Ghana destination city.',
    conditions:
      'Air freight acceptance depends on airline safety rules. Batteries, liquids, powders, and restricted goods must be declared before dispatch.',
    icon_name: 'Plane',
    media_id: 'media-air-cargo',
    image_url: '/src/assets/images/air_cargo_loading_1794939877714.jpg',
    image_alt: 'Air cargo freighter being loaded with cargo containers on tarmac',
    sort_order: 2,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-repacking',
    slug: 'repacking',
    title: 'Repacking',
    short_description:
      'Preparation and repacking of goods before onward shipping from China.',
    full_description:
      'Preparation and repacking of goods before onward shipping. Contact the team about packaging requirements and the arrangements available for your shipment.',
    suitable_for:
      'Multiple supplier orders being combined, fragile items needing stronger cartons, or bulky supplier packaging that needs consolidation.',
    quote_requirements:
      'Number of supplier parcels expected, item type, fragile handling requirements, and preferred shipping method.',
    conditions:
      'Repacking eligibility and any special crating or protective material arrangements are confirmed with the team prior to receiving goods.',
    icon_name: 'PackageCheck',
    media_id: 'media-warehouse-repacking',
    image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    image_alt: 'Warehouse repacking table with bubble wrap and export cartons',
    sort_order: 3,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-door-to-door',
    slug: 'door-to-door-delivery',
    title: 'Door-to-door delivery',
    short_description:
      'Request delivery to your preferred location in Ghana.',
    full_description:
      'Request delivery to your preferred location in Ghana. Availability and charges depend on the destination and shipment.',
    suitable_for:
      'Customers who prefer delivery directly to their shop, office, or preferred area in Accra, Kumasi, or other reachable towns in Ghana.',
    quote_requirements:
      'Destination city or town, landmark or delivery area (no exact home address needed at initial enquiry), and cargo size/weight.',
    conditions:
      'Local delivery availability and any onward dispatch fee depend on the destination city and cargo dimensions.',
    icon_name: 'Truck',
    media_id: 'media-local-delivery',
    image_url: '/src/assets/images/local_cargo_delivery_1794939879425.jpg',
    image_alt: 'White delivery van beside strapped parcels on an urban street',
    sort_order: 4,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-supplier-payment',
    slug: 'supplier-payment-assistance',
    title: 'Supplier payment assistance',
    short_description:
      'Assistance with settling payments to suppliers in China.',
    full_description:
      'Contact the team to discuss assistance with supplier payments in China. Confirm the transaction details and applicable terms before proceeding.',
    suitable_for:
      'Importers paying Chinese factories, 1688/Alibaba vendors, or market suppliers when arranging cargo shipments.',
    quote_requirements:
      'Supplier payment amount, currency details, and whether the goods will also ship through DGP LOGISTICS.',
    conditions:
      'All supplier payment terms, applicable service charges, and verification checks must be confirmed directly with our team before sending funds.',
    icon_name: 'Landmark',
    media_id: 'media-wholesale-goods',
    image_url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    image_alt: 'Consolidated wholesale trade cartons staged for export',
    sort_order: 5,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-phone-shipping',
    slug: 'phone-shipping',
    title: 'Phone shipping',
    short_description:
      'Dedicated shipping enquiries for iPhone and Android devices.',
    full_description:
      'Request shipping information for iPhone and Android devices. Provide the device type and quantity so the team can confirm acceptance, pricing and shipping arrangements.',
    suitable_for:
      'New or boxed iPhone and Android smartphones shipped individually or in trader batches.',
    quote_requirements:
      'Device brand/type (iPhone or Android), quantity, whether devices are sealed or loose, and your destination in Ghana.',
    conditions:
      'Device acceptance, battery declarations, packaging requirements, and per-item or parcel terms are confirmed on enquiry.',
    icon_name: 'Smartphone',
    media_id: 'media-electronics-cargo',
    image_url: '/src/assets/images/cargo_electronics_clean_1794939915590.jpg',
    image_alt: 'Cushioned smartphone and laptop boxes packed inside an export carton',
    sort_order: 6,
    status: 'published',
    show_on_home: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'srv-rmb-services',
    slug: 'rmb-services',
    title: 'RMB services',
    short_description:
      'Enquire about RMB-related payment services and applicable rates.',
    full_description:
      'Enquire about RMB-related payment services and the applicable rate. Rates and transaction terms must be confirmed with the team.',
    suitable_for:
      'Customers needing RMB payment facilitation for China sourcing and supplier settlements.',
    quote_requirements:
      'Amount needed, payment method (e.g. supplier account), and timeline.',
    conditions:
      'Exchange rates and transaction terms fluctuate and must always be confirmed directly with the team before making a transfer.',
    icon_name: 'Banknote',
    media_id: 'media-warehouse-repacking',
    image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    image_alt: 'Warehouse logistics coordination bench',
    sort_order: 7,
    status: 'published',
    show_on_home: false,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
];

// Flyer figures stored strictly as UNPUBLISHED draft rates until owner confirms them
export const SEED_SERVICE_RATES: ServiceRate[] = [
  {
    id: 'rate-flyer-sea',
    service_id: 'srv-sea-freight',
    label: 'Flyer draft — Sea freight',
    amount_display: 'US$240',
    currency: 'USD',
    unit: 'per CBM',
    estimated_transit: '50 days to Accra and Kumasi (flyer draft — unconfirmed, not a guaranteed arrival date)',
    conditions: 'Unpublished draft from flyer. Confirm current rate, port charges, and transit expectations before publishing.',
    effective_date: '',
    is_published: false,
    internal_note: 'Imported from reference flyer. Keep unpublished until owner confirms.',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'rate-flyer-air',
    service_id: 'srv-air-freight',
    label: 'Flyer draft — Air / general goods',
    amount_display: 'US$15',
    currency: 'USD',
    unit: 'per kg',
    estimated_transit: '',
    conditions: 'Unpublished draft from flyer. Confirm eligible general goods scope and minimum weight before publishing.',
    effective_date: '',
    is_published: false,
    internal_note: 'Imported from reference flyer. Keep unpublished until owner confirms.',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'rate-flyer-phones',
    service_id: 'srv-phone-shipping',
    label: 'Flyer draft — iPhone and Android phones',
    amount_display: '150 yuan',
    currency: 'CNY',
    unit: 'unit unspecified in flyer (confirm per device or per parcel)',
    estimated_transit: '',
    conditions: 'Unpublished draft from flyer. Unit (per phone vs per parcel) must be clarified by owner before publishing.',
    effective_date: '',
    is_published: false,
    internal_note: 'Flyer states "150 yuan" without specifying unit. Do not publish without clarification.',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'rate-flyer-rmb',
    service_id: 'srv-rmb-services',
    label: 'Flyer draft — Reference exchange-rate figure',
    amount_display: '0.546',
    currency: 'Unspecified',
    unit: 'Currency pair and calculation basis unspecified',
    estimated_transit: '',
    conditions: 'Unpublished draft from flyer. Never publish as a live rate; currency pair and calculation basis must be confirmed.',
    effective_date: '',
    is_published: false,
    internal_note: 'Flyer lists 0.546 without currency pair or calculation direction.',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
];

export const SEED_CARGO_CATEGORIES: CargoCategory[] = [
  {
    id: 'cat-electronics',
    slug: 'electronics',
    name: 'Electronics',
    description: 'Share the item type and whether batteries are included so the team can confirm acceptance.',
    restricted_notice: 'Battery-powered electronics require confirmation before dispatch.',
    media_id: 'media-electronics-cargo',
    image_url: '/src/assets/images/cargo_electronics_clean_1794939915590.jpg',
    image_alt: 'Packaged electronics including smartphones, laptops, and accessories',
    sort_order: 1,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-fashion-shoes',
    slug: 'fashion-and-shoes',
    name: 'Fashion and shoes',
    description: 'Shipping enquiries for wholesale or personal clothing, sneakers, and boxed footwear from China to Ghana.',
    restricted_notice: '',
    media_id: 'media-wholesale-goods',
    image_url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    image_alt: 'Wholesale apparel bales and boxed footwear staged in warehouse',
    sort_order: 2,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-bags-accessories',
    slug: 'bags-and-accessories',
    name: 'Bags and accessories',
    description: 'Shipping enquiries for handbags, backpacks and related accessories from China to Ghana.',
    restricted_notice: '',
    media_id: 'media-wholesale-goods',
    image_url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    image_alt: 'Handbags and fashion accessories packed for international freight',
    sort_order: 3,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-home-appliances',
    slug: 'home-appliances',
    name: 'Home appliances',
    description: 'Tell us the appliance type, quantity and package dimensions so we can advise on the shipping options.',
    restricted_notice: '',
    media_id: 'media-warehouse-repacking',
    image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    image_alt: 'Sturdy export cartons strapped on wooden pallets for appliance shipping',
    sort_order: 4,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-beauty-cosmetics',
    slug: 'beauty-and-cosmetics',
    name: 'Beauty and cosmetics',
    description: 'Confirm item type, packaging, and whether liquids, creams, or aerosols are included before sending.',
    restricted_notice: 'Liquids, creams, and sprays require prior confirmation.',
    media_id: 'media-warehouse-repacking',
    image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    image_alt: 'Protective bubble wrap and packing station for boxed goods',
    sort_order: 5,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-food-agricultural',
    slug: 'food-and-agricultural-goods',
    name: 'Food and agricultural goods',
    description: 'Share the exact item, packaging seal, and quantity so our team can confirm acceptance and freight rules.',
    restricted_notice: 'Perishable, liquid, and agricultural items require explicit confirmation.',
    media_id: 'media-hero-port',
    image_url: '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    image_alt: 'Container terminal handling international freight shipments',
    sort_order: 6,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-printing-supplies',
    slug: 'printing-supplies',
    name: 'Printing supplies',
    description: 'Enquire about shipping paper stocks, packaging boxes, banners, and non-restricted printing consumables.',
    restricted_notice: 'Inks and solvents require confirmation before shipping.',
    media_id: 'media-warehouse-repacking',
    image_url: '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    image_alt: 'Warehouse stacks of corrugated packaging and printing stock',
    sort_order: 7,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-school-materials',
    slug: 'school-materials',
    name: 'School materials',
    description: 'Stationery, bags, books, and educational supplies consolidated for sea or air shipment to Ghana.',
    restricted_notice: '',
    media_id: 'media-wholesale-goods',
    image_url: '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    image_alt: 'Export cartons containing bulk trade and stationery supplies',
    sort_order: 8,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-wigs-hair',
    slug: 'wigs-and-hair',
    name: 'Wigs and hair',
    description: 'Shipping enquiries for hair extensions, wigs, and salon hair products from China to Ghana.',
    restricted_notice: '',
    media_id: 'media-air-cargo',
    image_url: '/src/assets/images/air_cargo_loading_1794939877714.jpg',
    image_alt: 'Air freight cargo loading for fast salon and retail stock',
    sort_order: 9,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-vehicle-parts',
    slug: 'vehicle-spare-parts',
    name: 'Vehicle spare parts',
    description: 'Tell us the part type, approximate weight, and dimensions so we can advise on sea or air options.',
    restricted_notice: 'Oils, batteries, or pressurised parts must be declared before shipping.',
    media_id: 'media-local-delivery',
    image_url: '/src/assets/images/local_cargo_delivery_1794939879425.jpg',
    image_alt: 'Commercial delivery vehicle beside boxed spare part cartons',
    sort_order: 10,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cat-other-goods',
    slug: 'other-goods',
    name: 'Other goods',
    description: 'Shipping something else from China to Ghana? Describe your items and our team will confirm eligibility.',
    restricted_notice: '',
    media_id: 'media-hero-port',
    image_url: '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    image_alt: 'Container port handling diverse commercial cargo',
    sort_order: 11,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
];

export const SEED_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What if I do not know the exact weight or CBM of my goods yet?',
    answer:
      'You can select "Not sure" in the enquiry form for weight, dimensions, or CBM. Describe the items and quantity as clearly as you can, and our team will guide you on how measurements are checked when the goods arrive at the China receiving point.',
    sort_order: 1,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'faq-2',
    question: 'How do I get the China receiving address for my supplier?',
    answer:
      'Submit a shipping enquiry first or speak with our Ghana or China WhatsApp team. Once your shipment details and eligibility are confirmed, we provide the correct receiving instructions and shipping mark.',
    sort_order: 2,
    is_published: true,
    is_published_check: undefined,
    updated_at: '2026-01-15T08:00:00.000Z',
  } as FAQItem,
  {
    id: 'faq-3',
    question: 'Are batteries, liquids, food, or cosmetics accepted?',
    answer:
      'Acceptance depends on the specific item, shipping method (sea or air), and applicable carrier rules. Always declare batteries, liquids, creams, food, or cosmetics in your enquiry before sending goods to the receiving point.',
    sort_order: 3,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'faq-4',
    question: 'Does submitting the quote form automatically book my shipment?',
    answer:
      'No. Submitting the form saves your enquiry and prepares a pre-filled WhatsApp message with your reference number. You must tap Send in WhatsApp so our team can confirm current rates, acceptance, and arrangements.',
    sort_order: 4,
    is_published: true,
    updated_at: '2026-01-15T08:00:00.000Z',
  },
];
