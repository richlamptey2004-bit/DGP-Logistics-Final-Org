-- DGP LOGISTICS - Storage Bucket Configuration & Seed Data (Idempotent)
-- Note: Unverified flyer rates and draft office addresses are strictly seeded as UNPUBLISHED (is_published = false).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "Public view public-media" on storage.objects;
create policy "Public view public-media"
  on storage.objects for select
  using (bucket_id = 'public-media');

drop policy if exists "Admins upload public-media" on storage.objects;
create policy "Admins upload public-media"
  on storage.objects for insert
  with check (bucket_id = 'public-media' and public.is_dgp_admin());

drop policy if exists "Admins update public-media" on storage.objects;
create policy "Admins update public-media"
  on storage.objects for update
  using (bucket_id = 'public-media' and public.is_dgp_admin());

drop policy if exists "Admins delete public-media" on storage.objects;
create policy "Admins delete public-media"
  on storage.objects for delete
  using (bucket_id = 'public-media' and public.is_dgp_admin());

-- 1. Seed Media Assets
insert into public.media_assets (id, file_name, storage_path, url, alt_text, source_credit, licence_info, mime_type, size_bytes)
values
  ('10000000-0000-4000-8000-000000000001', 'hero_cargo_port_1794939878382.jpg', '/src/assets/images/hero_cargo_port_1794939878382.jpg', '/src/assets/images/hero_cargo_port_1794939878382.jpg', 'Commercial container port terminal with stacked navy and yellow shipping containers and gantry cranes', 'Editorial commercial port logistics photography', 'Project visual asset — replace with verified Ghana port or DGP operations photo in Admin Media Library when available', 'image/jpeg', 285000),
  ('10000000-0000-4000-8000-000000000002', 'warehouse_repacking_station_1794939878340.jpg', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Export consolidation warehouse with stacked cartons on pallets and a repacking inspection station', 'Editorial warehouse consolidation photography', 'Project visual asset — representative logistics scene, not an owned DGP facility', 'image/jpeg', 264000),
  ('10000000-0000-4000-8000-000000000003', 'air_cargo_loading_1794939877714.jpg', '/src/assets/images/air_cargo_loading_1794939877714.jpg', '/src/assets/images/air_cargo_loading_1794939877714.jpg', 'Air freight cargo aircraft on airport tarmac being loaded with aluminum cargo containers', 'Editorial air freight photography', 'Project visual asset — representative air cargo operations', 'image/jpeg', 252000),
  ('10000000-0000-4000-8000-000000000004', 'local_cargo_delivery_1794939879425.jpg', '/src/assets/images/local_cargo_delivery_1794939879425.jpg', '/src/assets/images/local_cargo_delivery_1794939879425.jpg', 'Commercial delivery van parked beside strapped cargo parcels on an urban street for local handover', 'Editorial West African urban delivery photography', 'Project visual asset — representative delivery vehicle, not a branded DGP vehicle', 'image/jpeg', 271000),
  ('10000000-0000-4000-8000-000000000005', 'cargo_electronics_clean_1794939915590.jpg', '/src/assets/images/cargo_electronics_clean_1794939915590.jpg', '/src/assets/images/cargo_electronics_clean_1794939915590.jpg', 'Sealed smartphone boxes, laptops, and small electronics cushioned in bubble wrap inside a shipping carton', 'Editorial electronics cargo packing photography', 'Project visual asset — representative packaged electronics', 'image/jpeg', 248000),
  ('10000000-0000-4000-8000-000000000006', 'cargo_wholesale_goods_1794939917144.jpg', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', 'Wholesale clothing bales, boxed footwear cartons, and handbags staged on warehouse shelves for export', 'Editorial wholesale trade goods photography', 'Project visual asset — representative wholesale cargo consolidation', 'image/jpeg', 259000)
on conflict (id) do nothing;

-- 2. Default Site Settings (Draft office locations kept unpublished until owner confirms)
insert into public.site_settings (
  id, business_name, route_label, ghana_whatsapp, china_whatsapp,
  draft_ghana_office, draft_china_office, office_details_published,
  repacking_heading, repacking_body, repacking_conditions, repacking_published,
  pricing_fallback_notice
) values (
  'default',
  'DGP LOGISTICS',
  'China → Ghana',
  '+233266663700',
  '+8615820200000',
  'Adabraka, opposite the Police Station (Draft from flyer — confirm full address before publishing)',
  'Foshan, Guangdong (Draft from flyer — confirm warehouse receiving address before publishing)',
  false,
  'Free repacking included in shipments',
  'Our repacking service helps prepare your goods for onward shipping. Contact us to confirm the packaging arrangements for your shipment.',
  '',
  true,
  'Contact us for current rates and shipment terms.'
)
on conflict (id) do nothing;

-- 3. Seed Editable Pages
insert into public.pages (slug, title, meta_title, meta_description, hero_headline, hero_subheadline, hero_media_id, hero_image_url, hero_image_alt, body_sections)
values
  (
    'home',
    'Home',
    'DGP LOGISTICS – From China to Ghana. We deliver.',
    'Shipping, repacking and door-to-door delivery for your goods from China to Ghana. Request a sea freight, air freight or phone shipping quotation.',
    'From China to Ghana. We deliver.',
    'Arrange shipping, repacking and door-to-door delivery with DGP LOGISTICS. Tell us what you are sending, and our team will help you with the next steps.',
    '10000000-0000-4000-8000-000000000001',
    '/src/assets/images/hero_cargo_port_1794939878382.jpg',
    'Commercial container port terminal with stacked shipping containers and cranes',
    '[{"id":"steps-heading","heading":"How shipping works","content":"Four straightforward steps from your enquiry to receiving your goods in Ghana."}]'::jsonb
  ),
  (
    'about',
    'About us',
    'About Us – DGP LOGISTICS | China to Ghana Cargo Shipping',
    'Learn how DGP LOGISTICS helps Ghanaian traders, businesses, and individuals ship goods from China to Ghana via sea and air freight.',
    'Practical cargo shipping from China to Ghana.',
    'DGP LOGISTICS helps individuals and businesses arrange cargo shipments from China to Ghana. Our services include sea freight, air freight, repacking, supplier payment assistance and door-to-door delivery.',
    '10000000-0000-4000-8000-000000000002',
    '/src/assets/images/warehouse_repacking_station_1794939878340.jpg',
    'Export warehouse packing station with stacked shipping cartons',
    '[
      {"id":"who-we-help","heading":"Who we help","content":"We work with Ghanaian traders, online shop owners, small businesses, and individuals sourcing goods from suppliers in China. Whether you are bringing in wholesale stock or personal items, our team guides you through the right shipping option."},
      {"id":"route-and-services","heading":"The China to Ghana shipping route","content":"We coordinate cargo movement from China to Ghana with options for sea freight, air freight for eligible general goods, phone shipping, supplier payment assistance, RMB services, repacking, and door-to-door delivery in Ghana."},
      {"id":"quotation-process","heading":"How customers request a quotation","content":"Start by submitting your shipment details on our Request Quote page. Once submitted, your enquiry reference is generated and you can continue directly on WhatsApp with our Ghana or China team to confirm rates, receiving instructions, and delivery options."},
      {"id":"accurate-cargo","heading":"Why accurate cargo information matters","content":"Sharing clear details about what you are shipping, item quantities, batteries or liquids, and approximate weight or dimensions helps our team recommend the right freight method, confirm item acceptance, and give you an accurate quotation without delays."}
    ]'::jsonb
  ),
  (
    'services',
    'Services',
    'Services – DGP LOGISTICS | Sea Freight, Air Freight & Delivery',
    'Explore sea freight, air freight, repacking, phone shipping, supplier payment assistance, RMB services, and door-to-door delivery from China to Ghana.',
    'Logistics services from China to Ghana.',
    'Select a service to review what information we need and request a shipping quotation from our team.',
    '10000000-0000-4000-8000-000000000003',
    '/src/assets/images/air_cargo_loading_1794939877714.jpg',
    'Cargo aircraft loading freight containers on the tarmac',
    '[]'::jsonb
  ),
  (
    'what-we-ship',
    'What we ship',
    'What We Ship – DGP LOGISTICS | Eligible Cargo Categories',
    'View cargo categories we handle from China to Ghana including electronics, fashion, bags, home appliances, beauty items, wigs, and spare parts.',
    'Eligible goods we ship from China to Ghana.',
    'Choose a cargo category below to start your shipping enquiry with the category preselected.',
    '10000000-0000-4000-8000-000000000006',
    '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg',
    'Wholesale cartons of apparel, footwear, and bags staged for export',
    '[{"id":"acceptance-notice","heading":"Cargo acceptance notice","content":"Acceptance depends on the item, shipping method and applicable requirements. Please confirm before sending batteries, liquids, food, cosmetics or other restricted goods."}]'::jsonb
  ),
  (
    'contact',
    'Contact',
    'Contact DGP LOGISTICS – Ghana & China WhatsApp Teams',
    'Speak with DGP LOGISTICS in Ghana (+233266663700) or China (+8615820200000), or submit your shipment details to continue on WhatsApp.',
    'Let’s discuss your shipment.',
    'Tell us what you want to ship from China to Ghana. Contact our Ghana or China team, or complete the form below to continue on WhatsApp.',
    '10000000-0000-4000-8000-000000000004',
    '/src/assets/images/local_cargo_delivery_1794939879425.jpg',
    'Commercial cargo delivery van prepared for local handover',
    '[]'::jsonb
  ),
  (
    'request-quote',
    'Request a shipping quote',
    'Request a Shipping Quote – DGP LOGISTICS',
    'Submit your cargo details for sea freight, air freight, repacking, or door-to-door delivery from China to Ghana and continue on WhatsApp.',
    'Request a shipping quote',
    'Provide your cargo details below. If you do not yet know the exact weight or CBM, select "Not sure" and our team will guide you.',
    null,
    null,
    '',
    '[]'::jsonb
  ),
  (
    'privacy',
    'Privacy Policy',
    'Privacy Information – DGP LOGISTICS',
    'How DGP LOGISTICS collects, stores, and uses shipment enquiry details and WhatsApp handover information.',
    'Privacy & enquiry data handling',
    'How we handle the shipment and contact information you provide when requesting a quotation.',
    null,
    null,
    '',
    '[
      {"id":"data-collected","heading":"Information we collect","content":"When you submit a shipment enquiry, we collect your name, phone or WhatsApp number, optional email address, destination city or town in Ghana, cargo description, and optional shipment measurements so our team can prepare a quotation."},
      {"id":"how-used","heading":"How we use your information","content":"Your enquiry details are stored securely for our logistics staff to review your request, confirm item eligibility, prepare rates, and communicate with you via your chosen Ghana or China WhatsApp contact."},
      {"id":"whatsapp-handover","heading":"WhatsApp handover","content":"Submitting the enquiry form prepares a WhatsApp message containing your enquiry reference and shipment summary. You remain in control and must tap Send inside WhatsApp to start the chat with our team."},
      {"id":"contact-privacy","heading":"Questions or updates","content":"To update or ask about a submitted enquiry, message our Ghana team (+233266663700) or China team (+8615820200000) with your enquiry reference."}
    ]'::jsonb
  )
on conflict (slug) do nothing;

-- 4. Seed Services
insert into public.services (id, slug, title, short_description, full_description, suitable_for, quote_requirements, conditions, icon_name, media_id, image_url, image_alt, sort_order, status, show_on_home)
values
  ('20000000-0000-4000-8000-000000000001', 'sea-freight', 'Sea freight', 'For customers shipping larger or bulkier consignments from China to Ghana.', 'For customers shipping larger or bulkier consignments from China to Ghana. Share your cargo details, dimensions and destination to request a quotation.', 'Bulk wholesale stock, heavy cartons, home appliances, commercial inventory, furniture, and non-urgent restocks.', 'Item description, carton count or quantity, approximate dimensions (cm) or volume in CBM (or "Not sure"), and your destination city in Ghana.', 'Cargo acceptance, container consolidation schedules, and transit estimates are confirmed by the team once item details are reviewed.', 'Ship', '10000000-0000-4000-8000-000000000001', '/src/assets/images/hero_cargo_port_1794939878382.jpg', 'Shipping containers stacked at a commercial sea port terminal', 1, 'published', true),
  ('20000000-0000-4000-8000-000000000002', 'air-freight', 'Air freight', 'For customers who want an air-shipping option for eligible general goods.', 'For customers who want an air-shipping option for eligible goods. Provide the item type, weight and destination so the team can confirm the available arrangements.', 'Time-sensitive stock, clothing, shoes, bags, wigs, light commercial parcels, and eligible electronics.', 'Item type, whether batteries or liquids are included, estimated weight in kg (or "Not sure"), and Ghana destination city.', 'Air freight acceptance depends on airline safety rules. Batteries, liquids, powders, and restricted goods must be declared before dispatch.', 'Plane', '10000000-0000-4000-8000-000000000003', '/src/assets/images/air_cargo_loading_1794939877714.jpg', 'Air cargo freighter being loaded with cargo containers on tarmac', 2, 'published', true),
  ('20000000-0000-4000-8000-000000000003', 'repacking', 'Repacking', 'Preparation and repacking of goods before onward shipping from China.', 'Preparation and repacking of goods before onward shipping. Contact the team about packaging requirements and the arrangements available for your shipment.', 'Multiple supplier orders being combined, fragile items needing stronger cartons, or bulky supplier packaging that needs consolidation.', 'Number of supplier parcels expected, item type, fragile handling requirements, and preferred shipping method.', 'Repacking eligibility and any special crating or protective material arrangements are confirmed with the team prior to receiving goods.', 'PackageCheck', '10000000-0000-4000-8000-000000000002', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Warehouse repacking table with bubble wrap and export cartons', 3, 'published', true),
  ('20000000-0000-4000-8000-000000000004', 'door-to-door-delivery', 'Door-to-door delivery', 'Request delivery to your preferred location in Ghana.', 'Request delivery to your preferred location in Ghana. Availability and charges depend on the destination and shipment.', 'Customers who prefer delivery directly to their shop, office, or preferred area in Accra, Kumasi, or other reachable towns in Ghana.', 'Destination city or town, landmark or delivery area (no exact home address needed at initial enquiry), and cargo size/weight.', 'Local delivery availability and any onward dispatch fee depend on the destination city and cargo dimensions.', 'Truck', '10000000-0000-4000-8000-000000000004', '/src/assets/images/local_cargo_delivery_1794939879425.jpg', 'White delivery van beside strapped parcels on an urban street', 4, 'published', true),
  ('20000000-0000-4000-8000-000000000005', 'supplier-payment-assistance', 'Supplier payment assistance', 'Assistance with settling payments to suppliers in China.', 'Contact the team to discuss assistance with supplier payments in China. Confirm the transaction details and applicable terms before proceeding.', 'Importers paying Chinese factories, 1688/Alibaba vendors, or market suppliers when arranging cargo shipments.', 'Supplier payment amount, currency details, and whether the goods will also ship through DGP LOGISTICS.', 'All supplier payment terms, applicable service charges, and verification checks must be confirmed directly with our team before sending funds.', 'Landmark', '10000000-0000-4000-8000-000000000006', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', 'Consolidated wholesale trade cartons staged for export', 5, 'published', true),
  ('20000000-0000-4000-8000-000000000006', 'phone-shipping', 'Phone shipping', 'Dedicated shipping enquiries for iPhone and Android devices.', 'Request shipping information for iPhone and Android devices. Provide the device type and quantity so the team can confirm acceptance, pricing and shipping arrangements.', 'New or boxed iPhone and Android smartphones shipped individually or in trader batches.', 'Device brand/type (iPhone or Android), quantity, whether devices are sealed or loose, and your destination in Ghana.', 'Device acceptance, battery declarations, packaging requirements, and per-item or parcel terms are confirmed on enquiry.', 'Smartphone', '10000000-0000-4000-8000-000000000005', '/src/assets/images/cargo_electronics_clean_1794939915590.jpg', 'Cushioned smartphone and laptop boxes packed inside an export carton', 6, 'published', true),
  ('20000000-0000-4000-8000-000000000007', 'rmb-services', 'RMB services', 'Enquire about RMB-related payment services and applicable rates.', 'Enquire about RMB-related payment services and the applicable rate. Rates and transaction terms must be confirmed with the team.', 'Customers needing RMB payment facilitation for China sourcing and supplier settlements.', 'Amount needed, payment method (e.g. supplier account), and timeline.', 'Exchange rates and transaction terms fluctuate and must always be confirmed directly with the team before making a transfer.', 'Banknote', '10000000-0000-4000-8000-000000000002', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Warehouse logistics coordination bench', 7, 'published', false)
on conflict (id) do nothing;

-- 5. Seed Flyer Draft Rates (Strictly UNPUBLISHED: is_published = false)
insert into public.service_rates (id, service_id, label, amount_display, currency, unit, estimated_transit, conditions, effective_date, is_published, internal_note)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Flyer draft — Sea freight', 'US$240', 'USD', 'per CBM', '50 days to Accra and Kumasi (flyer draft — unconfirmed, not a guaranteed arrival date)', 'Unpublished draft from flyer. Confirm current rate, port charges, and transit expectations before publishing.', '', false, 'Imported from reference flyer. Keep unpublished until owner confirms.'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Flyer draft — Air / general goods', 'US$15', 'USD', 'per kg', '', 'Unpublished draft from flyer. Confirm eligible general goods scope and minimum weight before publishing.', '', false, 'Imported from reference flyer. Keep unpublished until owner confirms.'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000006', 'Flyer draft — iPhone and Android phones', '150 yuan', 'CNY', 'unit unspecified in flyer (confirm per device or per parcel)', '', 'Unpublished draft from flyer. Unit (per phone vs per parcel) must be clarified by owner before publishing.', '', false, 'Flyer states 150 yuan without specifying unit. Do not publish without clarification.'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000007', 'Flyer draft — Reference exchange-rate figure', '0.546', 'Unspecified', 'Currency pair and calculation basis unspecified', '', 'Unpublished draft from flyer. Never publish as a live rate; currency pair and calculation basis must be confirmed.', '', false, 'Flyer lists 0.546 without currency pair or calculation direction.')
on conflict (id) do nothing;

-- 6. Seed Cargo Categories
insert into public.cargo_categories (id, slug, name, description, restricted_notice, media_id, image_url, image_alt, sort_order, is_published)
values
  ('40000000-0000-4000-8000-000000000001', 'electronics', 'Electronics', 'Share the item type and whether batteries are included so the team can confirm acceptance.', 'Battery-powered electronics require confirmation before dispatch.', '10000000-0000-4000-8000-000000000005', '/src/assets/images/cargo_electronics_clean_1794939915590.jpg', 'Packaged electronics including smartphones, laptops, and accessories', 1, true),
  ('40000000-0000-4000-8000-000000000002', 'fashion-and-shoes', 'Fashion and shoes', 'Shipping enquiries for wholesale or personal clothing, sneakers, and boxed footwear from China to Ghana.', '', '10000000-0000-4000-8000-000000000006', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', 'Wholesale apparel bales and boxed footwear staged in warehouse', 2, true),
  ('40000000-0000-4000-8000-000000000003', 'bags-and-accessories', 'Bags and accessories', 'Shipping enquiries for handbags, backpacks and related accessories from China to Ghana.', '', '10000000-0000-4000-8000-000000000006', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', 'Handbags and fashion accessories packed for international freight', 3, true),
  ('40000000-0000-4000-8000-000000000004', 'home-appliances', 'Home appliances', 'Tell us the appliance type, quantity and package dimensions so we can advise on the shipping options.', '', '10000000-0000-4000-8000-000000000002', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Sturdy export cartons strapped on wooden pallets for appliance shipping', 4, true),
  ('40000000-0000-4000-8000-000000000005', 'beauty-and-cosmetics', 'Beauty and cosmetics', 'Confirm item type, packaging, and whether liquids, creams, or aerosols are included before sending.', 'Liquids, creams, and sprays require prior confirmation.', '10000000-0000-4000-8000-000000000002', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Protective bubble wrap and packing station for boxed goods', 5, true),
  ('40000000-0000-4000-8000-000000000006', 'food-and-agricultural-goods', 'Food and agricultural goods', 'Share the exact item, packaging seal, and quantity so our team can confirm acceptance and freight rules.', 'Perishable, liquid, and agricultural items require explicit confirmation.', '10000000-0000-4000-8000-000000000001', '/src/assets/images/hero_cargo_port_1794939878382.jpg', 'Container terminal handling international freight shipments', 6, true),
  ('40000000-0000-4000-8000-000000000007', 'printing-supplies', 'Printing supplies', 'Enquire about shipping paper stocks, packaging boxes, banners, and non-restricted printing consumables.', 'Inks and solvents require confirmation before shipping.', '10000000-0000-4000-8000-000000000002', '/src/assets/images/warehouse_repacking_station_1794939878340.jpg', 'Warehouse stacks of corrugated packaging and printing stock', 7, true),
  ('40000000-0000-4000-8000-000000000008', 'school-materials', 'School materials', 'Stationery, bags, books, and educational supplies consolidated for sea or air shipment to Ghana.', '', '10000000-0000-4000-8000-000000000006', '/src/assets/images/cargo_wholesale_goods_1794939917144.jpg', 'Export cartons containing bulk trade and stationery supplies', 8, true),
  ('40000000-0000-4000-8000-000000000009', 'wigs-and-hair', 'Wigs and hair', 'Shipping enquiries for hair extensions, wigs, and salon hair products from China to Ghana.', '', '10000000-0000-4000-8000-000000000003', '/src/assets/images/air_cargo_loading_1794939877714.jpg', 'Air freight cargo loading for fast salon and retail stock', 9, true),
  ('40000000-0000-4000-8000-000000000010', 'vehicle-spare-parts', 'Vehicle spare parts', 'Tell us the part type, approximate weight, and dimensions so we can advise on sea or air options.', 'Oils, batteries, or pressurised parts must be declared before shipping.', '10000000-0000-4000-8000-000000000004', '/src/assets/images/local_cargo_delivery_1794939879425.jpg', 'Commercial delivery vehicle beside boxed spare part cartons', 10, true),
  ('40000000-0000-4000-8000-000000000011', 'other-goods', 'Other goods', 'Shipping something else from China to Ghana? Describe your items and our team will confirm eligibility.', '', '10000000-0000-4000-8000-000000000001', '/src/assets/images/hero_cargo_port_1794939878382.jpg', 'Container port handling diverse commercial cargo', 11, true)
on conflict (id) do nothing;

-- 7. Seed FAQs
insert into public.faqs (id, question, answer, sort_order, is_published)
values
  ('50000000-0000-4000-8000-000000000001', 'What if I do not know the exact weight or CBM of my goods yet?', 'You can select "Not sure" in the enquiry form for weight, dimensions, or CBM. Describe the items and quantity as clearly as you can, and our team will guide you on how measurements are checked when the goods arrive at the China receiving point.', 1, true),
  ('50000000-0000-4000-8000-000000000002', 'How do I get the China receiving address for my supplier?', 'Submit a shipping enquiry first or speak with our Ghana or China WhatsApp team. Once your shipment details and eligibility are confirmed, we provide the correct receiving instructions and shipping mark.', 2, true),
  ('50000000-0000-4000-8000-000000000003', 'Are batteries, liquids, food, or cosmetics accepted?', 'Acceptance depends on the specific item, shipping method (sea or air), and applicable carrier rules. Always declare batteries, liquids, creams, food, or cosmetics in your enquiry before sending goods to the receiving point.', 3, true),
  ('50000000-0000-4000-8000-000000000004', 'Does submitting the quote form automatically book my shipment?', 'No. Submitting the form saves your enquiry and prepares a pre-filled WhatsApp message with your reference number. You must tap Send in WhatsApp so our team can confirm current rates, acceptance, and arrangements.', 4, true)
on conflict (id) do nothing;
