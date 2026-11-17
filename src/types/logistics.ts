export type ServiceStatus = 'published' | 'draft' | 'archived';
export type EnquiryStatus = 'New' | 'Contacted' | 'Quoted' | 'Booked' | 'Closed';
export type OfficePreference = 'Ghana' | 'China';

export interface MediaAsset {
  id: string;
  file_name: string;
  url: string;
  alt_text: string;
  source_credit: string;
  licence_info: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  business_name: string;
  route_label: string;
  ghana_whatsapp: string;
  china_whatsapp: string;
  logo_media_id: string | null;
  logo_url: string | null;
  logo_alt: string;
  draft_ghana_office: string;
  draft_china_office: string;
  confirmed_ghana_office: string;
  confirmed_china_office: string;
  office_details_published: boolean;
  repacking_heading: string;
  repacking_body: string;
  repacking_conditions: string;
  repacking_published: boolean;
  pricing_fallback_notice: string;
  updated_at: string;
}

export interface EditablePage {
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_media_id: string | null;
  hero_image_url: string | null;
  hero_image_alt: string;
  body_sections: {
    id: string;
    heading: string;
    content: string;
  }[];
  updated_at: string;
}

export interface ServiceRate {
  id: string;
  service_id: string;
  label: string;
  amount_display: string;
  currency: string;
  unit: string;
  estimated_transit: string;
  conditions: string;
  effective_date: string;
  is_published: boolean;
  internal_note: string;
  updated_at: string;
}

export interface LogisticsService {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  suitable_for: string;
  quote_requirements: string;
  conditions: string;
  icon_name: string;
  media_id: string | null;
  image_url: string | null;
  image_alt: string;
  sort_order: number;
  status: ServiceStatus;
  show_on_home: boolean;
  rates?: ServiceRate[];
  updated_at: string;
}

export interface CargoCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  restricted_notice: string;
  media_id: string | null;
  image_url: string | null;
  image_alt: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export interface EnquiryNote {
  id: string;
  enquiry_id: string;
  author_email: string;
  note: string;
  created_at: string;
}

export interface ShipmentEnquiry {
  id: string;
  reference_code: string;
  client_submission_id: string;
  full_name: string;
  phone_whatsapp: string;
  email: string;
  destination_city: string;
  delivery_area: string;
  service_slug: string;
  service_name: string;
  cargo_category_slug: string;
  cargo_category_name: string;
  goods_description: string;
  quantity: string;
  estimated_weight_kg: string;
  dimensions_cm: string;
  estimated_volume_cbm: string;
  china_location: string;
  preferred_shipping_method: string;
  door_to_door_required: boolean;
  preferred_office: OfficePreference;
  additional_notes: string;
  consent_accepted: boolean;
  status: EnquiryStatus;
  whatsapp_message: string;
  whatsapp_url: string;
  created_at: string;
  updated_at: string;
  notes?: EnquiryNote[];
}

export interface AuditLog {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  created_at: string;
}

export interface AdminUserPublic {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin';
  must_change_password: boolean;
  created_at: string;
}

export interface PublicBootstrapPayload {
  settings: Omit<SiteSettings, 'draft_ghana_office' | 'draft_china_office'>;
  pages: Record<string, EditablePage>;
  services: LogisticsService[];
  categories: CargoCategory[];
  faqs: FAQItem[];
  media: MediaAsset[];
}
