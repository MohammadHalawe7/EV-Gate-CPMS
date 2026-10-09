/* =============================================================================
 * EV Gate — Configuration / Lookup registry.
 *
 * ARCHITECTURAL RULE: every configurable or reference value in the product is
 * a lookup, resolved through this module. Screens never hard-code a country, a
 * department, a document type or a service. When the backend arrives, only the
 * loader below changes — every consumer already speaks in lookup ids.
 *
 * A lookup option carries:
 *   id        stable identifier, stored on records
 *   name      English label
 *   nameAr    Arabic label — `useI18n().ln(option)` picks the right one
 *   parentId  for a dependent lookup (city → country, position → department)
 *   meta      per-domain flags that drive behaviour (dial code, requiresChargers)
 * ========================================================================== */

export interface LookupOption {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  order?: number;
  active?: boolean;
  meta?: Record<string, string | number | boolean>;
}

export type LookupKey =
  | 'countries'
  | 'cities'
  | 'mainSectors'
  | 'subSectors'
  | 'departments'
  | 'positions'
  | 'services'
  | 'employeeBands'
  | 'genders'
  | 'documentTypes'
  /* ---- Network / EV charging infrastructure ---------------------------- */
  | 'amenities'
  | 'manufacturers'
  | 'locationTypes'
  | 'ocppConfigGroups';

/** Lookups whose options are filtered by a parent selection. */
export const DEPENDENT_LOOKUPS: Partial<Record<LookupKey, LookupKey>> = {
  cities: 'countries',
  subSectors: 'mainSectors',
  positions: 'departments',
};

/* -------------------------------------------------------------------------- */
/* Countries — `meta.dial` is the phone dial code                              */
/* -------------------------------------------------------------------------- */

const countries: LookupOption[] = [
  { id: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', meta: { dial: '+971' } },
  { id: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', meta: { dial: '+966' } },
  { id: 'QA', name: 'Qatar', nameAr: 'قطر', meta: { dial: '+974' } },
  { id: 'KW', name: 'Kuwait', nameAr: 'الكويت', meta: { dial: '+965' } },
  { id: 'BH', name: 'Bahrain', nameAr: 'البحرين', meta: { dial: '+973' } },
  { id: 'OM', name: 'Oman', nameAr: 'عُمان', meta: { dial: '+968' } },
  { id: 'JO', name: 'Jordan', nameAr: 'الأردن', meta: { dial: '+962' } },
  { id: 'EG', name: 'Egypt', nameAr: 'مصر', meta: { dial: '+20' } },
  { id: 'LB', name: 'Lebanon', nameAr: 'لبنان', meta: { dial: '+961' } },
  { id: 'IQ', name: 'Iraq', nameAr: 'العراق', meta: { dial: '+964' } },
  { id: 'MA', name: 'Morocco', nameAr: 'المغرب', meta: { dial: '+212' } },
  { id: 'TR', name: 'Türkiye', nameAr: 'تركيا', meta: { dial: '+90' } },
  { id: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', meta: { dial: '+44' } },
  { id: 'DE', name: 'Germany', nameAr: 'ألمانيا', meta: { dial: '+49' } },
  { id: 'NL', name: 'Netherlands', nameAr: 'هولندا', meta: { dial: '+31' } },
  { id: 'FR', name: 'France', nameAr: 'فرنسا', meta: { dial: '+33' } },
  { id: 'ES', name: 'Spain', nameAr: 'إسبانيا', meta: { dial: '+34' } },
  { id: 'IN', name: 'India', nameAr: 'الهند', meta: { dial: '+91' } },
  { id: 'PK', name: 'Pakistan', nameAr: 'باكستان', meta: { dial: '+92' } },
  { id: 'SG', name: 'Singapore', nameAr: 'سنغافورة', meta: { dial: '+65' } },
  { id: 'US', name: 'United States', nameAr: 'الولايات المتحدة', meta: { dial: '+1' } },
];

const cities: LookupOption[] = [
  { id: 'AE-DXB', parentId: 'AE', name: 'Dubai', nameAr: 'دبي' },
  { id: 'AE-AUH', parentId: 'AE', name: 'Abu Dhabi', nameAr: 'أبوظبي' },
  { id: 'AE-SHJ', parentId: 'AE', name: 'Sharjah', nameAr: 'الشارقة' },
  { id: 'AE-AJM', parentId: 'AE', name: 'Ajman', nameAr: 'عجمان' },
  { id: 'AE-RAK', parentId: 'AE', name: 'Ras Al Khaimah', nameAr: 'رأس الخيمة' },
  { id: 'AE-FUJ', parentId: 'AE', name: 'Fujairah', nameAr: 'الفجيرة' },
  { id: 'AE-UAQ', parentId: 'AE', name: 'Umm Al Quwain', nameAr: 'أم القيوين' },
  { id: 'AE-AAN', parentId: 'AE', name: 'Al Ain', nameAr: 'العين' },
  { id: 'SA-RUH', parentId: 'SA', name: 'Riyadh', nameAr: 'الرياض' },
  { id: 'SA-JED', parentId: 'SA', name: 'Jeddah', nameAr: 'جدة' },
  { id: 'SA-DMM', parentId: 'SA', name: 'Dammam', nameAr: 'الدمام' },
  { id: 'SA-MED', parentId: 'SA', name: 'Madinah', nameAr: 'المدينة المنورة' },
  { id: 'SA-KHO', parentId: 'SA', name: 'Khobar', nameAr: 'الخبر' },
  { id: 'SA-NEO', parentId: 'SA', name: 'NEOM', nameAr: 'نيوم' },
  { id: 'QA-DOH', parentId: 'QA', name: 'Doha', nameAr: 'الدوحة' },
  { id: 'QA-RAY', parentId: 'QA', name: 'Al Rayyan', nameAr: 'الريان' },
  { id: 'KW-KWI', parentId: 'KW', name: 'Kuwait City', nameAr: 'مدينة الكويت' },
  { id: 'KW-HAW', parentId: 'KW', name: 'Hawalli', nameAr: 'حولي' },
  { id: 'BH-BAH', parentId: 'BH', name: 'Manama', nameAr: 'المنامة' },
  { id: 'BH-MUH', parentId: 'BH', name: 'Muharraq', nameAr: 'المحرق' },
  { id: 'OM-MCT', parentId: 'OM', name: 'Muscat', nameAr: 'مسقط' },
  { id: 'OM-SLL', parentId: 'OM', name: 'Salalah', nameAr: 'صلالة' },
  { id: 'JO-AMM', parentId: 'JO', name: 'Amman', nameAr: 'عمّان' },
  { id: 'JO-ZAR', parentId: 'JO', name: 'Zarqa', nameAr: 'الزرقاء' },
  { id: 'JO-AQB', parentId: 'JO', name: 'Aqaba', nameAr: 'العقبة' },
  { id: 'JO-IRB', parentId: 'JO', name: 'Irbid', nameAr: 'إربد' },
  { id: 'EG-CAI', parentId: 'EG', name: 'Cairo', nameAr: 'القاهرة' },
  { id: 'EG-ALY', parentId: 'EG', name: 'Alexandria', nameAr: 'الإسكندرية' },
  { id: 'EG-NCA', parentId: 'EG', name: 'New Administrative Capital', nameAr: 'العاصمة الإدارية الجديدة' },
  { id: 'LB-BEY', parentId: 'LB', name: 'Beirut', nameAr: 'بيروت' },
  { id: 'IQ-BGW', parentId: 'IQ', name: 'Baghdad', nameAr: 'بغداد' },
  { id: 'IQ-BSR', parentId: 'IQ', name: 'Basra', nameAr: 'البصرة' },
  { id: 'IQ-EBL', parentId: 'IQ', name: 'Erbil', nameAr: 'أربيل' },
  { id: 'MA-CAS', parentId: 'MA', name: 'Casablanca', nameAr: 'الدار البيضاء' },
  { id: 'MA-RBA', parentId: 'MA', name: 'Rabat', nameAr: 'الرباط' },
  { id: 'TR-IST', parentId: 'TR', name: 'Istanbul', nameAr: 'إسطنبول' },
  { id: 'TR-ESB', parentId: 'TR', name: 'Ankara', nameAr: 'أنقرة' },
  { id: 'GB-LON', parentId: 'GB', name: 'London', nameAr: 'لندن' },
  { id: 'GB-MAN', parentId: 'GB', name: 'Manchester', nameAr: 'مانشستر' },
  { id: 'GB-EDI', parentId: 'GB', name: 'Edinburgh', nameAr: 'إدنبرة' },
  { id: 'DE-BER', parentId: 'DE', name: 'Berlin', nameAr: 'برلين' },
  { id: 'DE-MUC', parentId: 'DE', name: 'Munich', nameAr: 'ميونخ' },
  { id: 'DE-HAM', parentId: 'DE', name: 'Hamburg', nameAr: 'هامبورغ' },
  { id: 'NL-AMS', parentId: 'NL', name: 'Amsterdam', nameAr: 'أمستردام' },
  { id: 'NL-RTM', parentId: 'NL', name: 'Rotterdam', nameAr: 'روتردام' },
  { id: 'FR-PAR', parentId: 'FR', name: 'Paris', nameAr: 'باريس' },
  { id: 'FR-LYS', parentId: 'FR', name: 'Lyon', nameAr: 'ليون' },
  { id: 'ES-MAD', parentId: 'ES', name: 'Madrid', nameAr: 'مدريد' },
  { id: 'ES-BCN', parentId: 'ES', name: 'Barcelona', nameAr: 'برشلونة' },
  { id: 'IN-BOM', parentId: 'IN', name: 'Mumbai', nameAr: 'مومباي' },
  { id: 'IN-DEL', parentId: 'IN', name: 'New Delhi', nameAr: 'نيودلهي' },
  { id: 'IN-BLR', parentId: 'IN', name: 'Bengaluru', nameAr: 'بنغالورو' },
  { id: 'PK-KHI', parentId: 'PK', name: 'Karachi', nameAr: 'كراتشي' },
  { id: 'PK-LHE', parentId: 'PK', name: 'Lahore', nameAr: 'لاهور' },
  { id: 'SG-SIN', parentId: 'SG', name: 'Singapore', nameAr: 'سنغافورة' },
  { id: 'US-NYC', parentId: 'US', name: 'New York', nameAr: 'نيويورك' },
  { id: 'US-SFO', parentId: 'US', name: 'San Francisco', nameAr: 'سان فرانسيسكو' },
  { id: 'US-AUS', parentId: 'US', name: 'Austin', nameAr: 'أوستن' },
];

/* -------------------------------------------------------------------------- */
/* Sectors                                                                     */
/* -------------------------------------------------------------------------- */

const mainSectors: LookupOption[] = [
  { id: 'energy', name: 'Energy & Utilities', nameAr: 'الطاقة والمرافق' },
  { id: 'mobility', name: 'Transportation & Mobility', nameAr: 'النقل والتنقل' },
  { id: 'realestate', name: 'Real Estate & Facilities', nameAr: 'العقارات والمرافق' },
  { id: 'retail', name: 'Retail & Hospitality', nameAr: 'التجزئة والضيافة' },
  { id: 'government', name: 'Government & Public Sector', nameAr: 'الحكومة والقطاع العام' },
  { id: 'industrial', name: 'Industrial & Manufacturing', nameAr: 'الصناعة والتصنيع' },
  { id: 'financial', name: 'Financial Services', nameAr: 'الخدمات المالية' },
  { id: 'healthcare', name: 'Healthcare', nameAr: 'الرعاية الصحية' },
  { id: 'education', name: 'Education', nameAr: 'التعليم' },
  { id: 'technology', name: 'Technology & Telecom', nameAr: 'التقنية والاتصالات' },
];

const subSectors: LookupOption[] = [
  { id: 'energy-power', parentId: 'energy', name: 'Power Generation', nameAr: 'توليد الطاقة' },
  { id: 'energy-dso', parentId: 'energy', name: 'Distribution Network Operator', nameAr: 'مشغل شبكة التوزيع' },
  { id: 'energy-renew', parentId: 'energy', name: 'Renewables', nameAr: 'الطاقة المتجددة' },
  { id: 'energy-oil', parentId: 'energy', name: 'Oil & Gas', nameAr: 'النفط والغاز' },
  { id: 'energy-water', parentId: 'energy', name: 'Water & Waste', nameAr: 'المياه والنفايات' },
  { id: 'mobility-fleet', parentId: 'mobility', name: 'Fleet Operations', nameAr: 'تشغيل الأساطيل' },
  { id: 'mobility-rental', parentId: 'mobility', name: 'Car Rental & Leasing', nameAr: 'تأجير السيارات' },
  { id: 'mobility-ride', parentId: 'mobility', name: 'Ride Hailing', nameAr: 'خدمات النقل الذكي' },
  { id: 'mobility-logistics', parentId: 'mobility', name: 'Logistics & Delivery', nameAr: 'الخدمات اللوجستية' },
  { id: 'mobility-transit', parentId: 'mobility', name: 'Public Transit', nameAr: 'النقل العام' },
  { id: 'mobility-oem', parentId: 'mobility', name: 'Automotive OEM & Dealership', nameAr: 'تصنيع ووكالات السيارات' },
  { id: 'realestate-mall', parentId: 'realestate', name: 'Malls & Retail Centres', nameAr: 'المراكز التجارية' },
  { id: 'realestate-resi', parentId: 'realestate', name: 'Residential Communities', nameAr: 'المجمعات السكنية' },
  { id: 'realestate-office', parentId: 'realestate', name: 'Commercial Offices', nameAr: 'المكاتب التجارية' },
  { id: 'realestate-fm', parentId: 'realestate', name: 'Facility Management', nameAr: 'إدارة المرافق' },
  { id: 'realestate-parking', parentId: 'realestate', name: 'Parking Operators', nameAr: 'مشغلو المواقف' },
  { id: 'retail-fuel', parentId: 'retail', name: 'Fuel & Convenience', nameAr: 'محطات الوقود' },
  { id: 'retail-grocery', parentId: 'retail', name: 'Grocery & Supermarkets', nameAr: 'التجزئة الغذائية' },
  { id: 'retail-hotel', parentId: 'retail', name: 'Hotels & Resorts', nameAr: 'الفنادق والمنتجعات' },
  { id: 'retail-fnb', parentId: 'retail', name: 'Food & Beverage', nameAr: 'الأغذية والمشروبات' },
  { id: 'gov-municipality', parentId: 'government', name: 'Municipality', nameAr: 'البلدية' },
  { id: 'gov-authority', parentId: 'government', name: 'Transport Authority', nameAr: 'هيئة النقل' },
  { id: 'gov-regulator', parentId: 'government', name: 'Energy Regulator', nameAr: 'الجهة التنظيمية للطاقة' },
  { id: 'gov-defence', parentId: 'government', name: 'Defence & Security', nameAr: 'الدفاع والأمن' },
  { id: 'ind-manufacturing', parentId: 'industrial', name: 'Manufacturing', nameAr: 'التصنيع' },
  { id: 'ind-construction', parentId: 'industrial', name: 'Construction & Contracting', nameAr: 'الإنشاءات والمقاولات' },
  { id: 'ind-mining', parentId: 'industrial', name: 'Mining & Materials', nameAr: 'التعدين والمواد' },
  { id: 'ind-ports', parentId: 'industrial', name: 'Ports & Airports', nameAr: 'الموانئ والمطارات' },
  { id: 'fin-bank', parentId: 'financial', name: 'Banking', nameAr: 'الخدمات المصرفية' },
  { id: 'fin-insurance', parentId: 'financial', name: 'Insurance', nameAr: 'التأمين' },
  { id: 'fin-invest', parentId: 'financial', name: 'Investment & Asset Management', nameAr: 'الاستثمار وإدارة الأصول' },
  { id: 'health-hospital', parentId: 'healthcare', name: 'Hospitals & Clinics', nameAr: 'المستشفيات والعيادات' },
  { id: 'health-pharma', parentId: 'healthcare', name: 'Pharmaceuticals', nameAr: 'الأدوية' },
  { id: 'edu-university', parentId: 'education', name: 'Universities', nameAr: 'الجامعات' },
  { id: 'edu-school', parentId: 'education', name: 'Schools', nameAr: 'المدارس' },
  { id: 'edu-training', parentId: 'education', name: 'Training & Research', nameAr: 'التدريب والبحث' },
  { id: 'tech-software', parentId: 'technology', name: 'Software & Platforms', nameAr: 'البرمجيات والمنصات' },
  { id: 'tech-telecom', parentId: 'technology', name: 'Telecom Operators', nameAr: 'مشغلو الاتصالات' },
  { id: 'tech-datacenter', parentId: 'technology', name: 'Data Centres', nameAr: 'مراكز البيانات' },
  { id: 'tech-si', parentId: 'technology', name: 'Systems Integration', nameAr: 'تكامل الأنظمة' },
];

/* -------------------------------------------------------------------------- */
/* People                                                                      */
/* -------------------------------------------------------------------------- */

const departments: LookupOption[] = [
  { id: 'exec', name: 'Executive Management', nameAr: 'الإدارة التنفيذية' },
  { id: 'ops', name: 'Operations', nameAr: 'العمليات' },
  { id: 'tech', name: 'Technical & Engineering', nameAr: 'الشؤون الفنية والهندسية' },
  { id: 'it', name: 'Information Technology', nameAr: 'تقنية المعلومات' },
  { id: 'finance', name: 'Finance', nameAr: 'المالية' },
  { id: 'procurement', name: 'Procurement', nameAr: 'المشتريات' },
  { id: 'sales', name: 'Sales & Business Development', nameAr: 'المبيعات وتطوير الأعمال' },
  { id: 'marketing', name: 'Marketing', nameAr: 'التسويق' },
  { id: 'support', name: 'Customer Support', nameAr: 'دعم العملاء' },
  { id: 'hr', name: 'Human Resources', nameAr: 'الموارد البشرية' },
  { id: 'legal', name: 'Legal & Compliance', nameAr: 'الشؤون القانونية والامتثال' },
  { id: 'hse', name: 'Health, Safety & Environment', nameAr: 'الصحة والسلامة والبيئة' },
];

const positions: LookupOption[] = [
  { id: 'exec-ceo', parentId: 'exec', name: 'Chief Executive Officer', nameAr: 'الرئيس التنفيذي' },
  { id: 'exec-coo', parentId: 'exec', name: 'Chief Operating Officer', nameAr: 'الرئيس التنفيذي للعمليات' },
  { id: 'exec-cto', parentId: 'exec', name: 'Chief Technology Officer', nameAr: 'الرئيس التنفيذي للتقنية' },
  { id: 'exec-cfo', parentId: 'exec', name: 'Chief Financial Officer', nameAr: 'الرئيس التنفيذي للمالية' },
  { id: 'exec-md', parentId: 'exec', name: 'Managing Director', nameAr: 'العضو المنتدب' },
  { id: 'exec-gm', parentId: 'exec', name: 'General Manager', nameAr: 'المدير العام' },
  { id: 'ops-director', parentId: 'ops', name: 'Operations Director', nameAr: 'مدير العمليات التنفيذي' },
  { id: 'ops-manager', parentId: 'ops', name: 'Operations Manager', nameAr: 'مدير العمليات' },
  { id: 'ops-network', parentId: 'ops', name: 'Charging Network Manager', nameAr: 'مدير شبكة الشحن' },
  { id: 'ops-site', parentId: 'ops', name: 'Site Supervisor', nameAr: 'مشرف الموقع' },
  { id: 'ops-dispatch', parentId: 'ops', name: 'Dispatch Coordinator', nameAr: 'منسق الإرسال' },
  { id: 'tech-head', parentId: 'tech', name: 'Head of Engineering', nameAr: 'رئيس الهندسة' },
  { id: 'tech-electrical', parentId: 'tech', name: 'Electrical Engineer', nameAr: 'مهندس كهربائي' },
  { id: 'tech-field', parentId: 'tech', name: 'Field Service Engineer', nameAr: 'مهندس خدمة ميدانية' },
  { id: 'tech-maintenance', parentId: 'tech', name: 'Maintenance Supervisor', nameAr: 'مشرف الصيانة' },
  { id: 'tech-commissioning', parentId: 'tech', name: 'Commissioning Engineer', nameAr: 'مهندس التشغيل' },
  { id: 'it-manager', parentId: 'it', name: 'IT Manager', nameAr: 'مدير تقنية المعلومات' },
  { id: 'it-sysadmin', parentId: 'it', name: 'Systems Administrator', nameAr: 'مسؤول الأنظمة' },
  { id: 'it-security', parentId: 'it', name: 'Information Security Officer', nameAr: 'مسؤول أمن المعلومات' },
  { id: 'it-integration', parentId: 'it', name: 'Integration Specialist', nameAr: 'أخصائي التكامل' },
  { id: 'fin-manager', parentId: 'finance', name: 'Finance Manager', nameAr: 'مدير مالي' },
  { id: 'fin-controller', parentId: 'finance', name: 'Financial Controller', nameAr: 'المراقب المالي' },
  { id: 'fin-accountant', parentId: 'finance', name: 'Accountant', nameAr: 'محاسب' },
  { id: 'fin-billing', parentId: 'finance', name: 'Billing Specialist', nameAr: 'أخصائي الفوترة' },
  { id: 'proc-manager', parentId: 'procurement', name: 'Procurement Manager', nameAr: 'مدير المشتريات' },
  { id: 'proc-buyer', parentId: 'procurement', name: 'Buyer', nameAr: 'مسؤول شراء' },
  { id: 'proc-contracts', parentId: 'procurement', name: 'Contracts Officer', nameAr: 'مسؤول العقود' },
  { id: 'sales-director', parentId: 'sales', name: 'Sales Director', nameAr: 'مدير المبيعات التنفيذي' },
  { id: 'sales-manager', parentId: 'sales', name: 'Business Development Manager', nameAr: 'مدير تطوير الأعمال' },
  { id: 'sales-account', parentId: 'sales', name: 'Account Manager', nameAr: 'مدير حسابات' },
  { id: 'sales-partnerships', parentId: 'sales', name: 'Partnerships Lead', nameAr: 'مسؤول الشراكات' },
  { id: 'mkt-manager', parentId: 'marketing', name: 'Marketing Manager', nameAr: 'مدير التسويق' },
  { id: 'mkt-brand', parentId: 'marketing', name: 'Brand Specialist', nameAr: 'أخصائي العلامة التجارية' },
  { id: 'mkt-digital', parentId: 'marketing', name: 'Digital Marketing Specialist', nameAr: 'أخصائي التسويق الرقمي' },
  { id: 'sup-manager', parentId: 'support', name: 'Support Manager', nameAr: 'مدير الدعم' },
  { id: 'sup-lead', parentId: 'support', name: 'Contact Centre Lead', nameAr: 'رئيس مركز الاتصال' },
  { id: 'sup-agent', parentId: 'support', name: 'Support Agent', nameAr: 'موظف دعم' },
  { id: 'hr-manager', parentId: 'hr', name: 'HR Manager', nameAr: 'مدير الموارد البشرية' },
  { id: 'hr-partner', parentId: 'hr', name: 'HR Business Partner', nameAr: 'شريك الموارد البشرية' },
  { id: 'hr-admin', parentId: 'hr', name: 'HR Administrator', nameAr: 'إداري الموارد البشرية' },
  { id: 'legal-counsel', parentId: 'legal', name: 'Legal Counsel', nameAr: 'المستشار القانوني' },
  { id: 'legal-compliance', parentId: 'legal', name: 'Compliance Officer', nameAr: 'مسؤول الامتثال' },
  { id: 'legal-contracts', parentId: 'legal', name: 'Contracts Manager', nameAr: 'مدير العقود' },
  { id: 'hse-manager', parentId: 'hse', name: 'HSE Manager', nameAr: 'مدير الصحة والسلامة والبيئة' },
  { id: 'hse-officer', parentId: 'hse', name: 'Safety Officer', nameAr: 'مسؤول السلامة' },
];

const genders: LookupOption[] = [
  { id: 'male', name: 'Male', nameAr: 'ذكر' },
  { id: 'female', name: 'Female', nameAr: 'أنثى' },
  { id: 'undisclosed', name: 'Prefer not to say', nameAr: 'أفضل عدم الإفصاح' },
];

const employeeBands: LookupOption[] = [
  { id: 'b1', name: '1 – 10', order: 1 },
  { id: 'b2', name: '11 – 50', order: 2 },
  { id: 'b3', name: '51 – 200', order: 3 },
  { id: 'b4', name: '201 – 500', order: 4 },
  { id: 'b5', name: '501 – 1,000', order: 5 },
  { id: 'b6', name: '1,001 – 5,000', order: 6 },
  { id: 'b7', name: 'More than 5,000', nameAr: 'أكثر من 5,000', order: 7 },
];

/* -------------------------------------------------------------------------- */
/* Services — `meta.requiresChargers` drives the conditional field             */
/* -------------------------------------------------------------------------- */

const services: LookupOption[] = [
  { id: 'ev-charging', name: 'EV Charging', nameAr: 'شحن المركبات الكهربائية', meta: { requiresChargers: true } },
  { id: 'fleet', name: 'Fleet Management', nameAr: 'إدارة الأساطيل' },
  { id: 'energy', name: 'Energy Management', nameAr: 'إدارة الطاقة' },
  { id: 'parking', name: 'Parking Operations', nameAr: 'تشغيل المواقف' },
  { id: 'roaming', name: 'Roaming & Interoperability', nameAr: 'التجوال وقابلية التشغيل البيني' },
  { id: 'solar', name: 'Solar & Storage', nameAr: 'الطاقة الشمسية والتخزين' },
  { id: 'facility', name: 'Facility Management', nameAr: 'إدارة المرافق' },
  { id: 'retail-services', name: 'Retail & Hospitality Services', nameAr: 'خدمات التجزئة والضيافة' },
  { id: 'maintenance', name: 'Maintenance & Field Services', nameAr: 'الصيانة والخدمات الميدانية' },
  { id: 'consulting', name: 'Consulting & Advisory', nameAr: 'الاستشارات' },
];

const documentTypes: LookupOption[] = [
  { id: 'trade-license', name: 'Trade License', nameAr: 'الرخصة التجارية' },
  { id: 'commercial-registration', name: 'Commercial Registration', nameAr: 'السجل التجاري' },
  { id: 'vat-certificate', name: 'VAT Registration Certificate', nameAr: 'شهادة التسجيل الضريبي' },
  { id: 'chamber-certificate', name: 'Chamber of Commerce Certificate', nameAr: 'شهادة الغرفة التجارية' },
  { id: 'signatory-letter', name: 'Authorised Signatory Letter', nameAr: 'خطاب المفوض بالتوقيع' },
  { id: 'national-address', name: 'National Address Certificate', nameAr: 'شهادة العنوان الوطني' },
  { id: 'power-of-attorney', name: 'Power of Attorney', nameAr: 'التوكيل الرسمي' },
  { id: 'bank-letter', name: 'Bank Account Letter', nameAr: 'خطاب الحساب البنكي' },
  { id: 'iso-certificate', name: 'ISO Certificate', nameAr: 'شهادة الأيزو' },
  { id: 'other', name: 'Other Supporting Document', nameAr: 'مستند داعم آخر' },
];

/* -------------------------------------------------------------------------- */
/* Network — site amenities, hardware vendors, site classification            */
/* -------------------------------------------------------------------------- */

const amenities: LookupOption[] = [
  { id: 'restroom', name: 'Restrooms', nameAr: 'دورات المياه' },
  { id: 'cafe', name: 'Café', nameAr: 'مقهى' },
  { id: 'restaurant', name: 'Restaurant', nameAr: 'مطعم' },
  { id: 'retail', name: 'Retail', nameAr: 'متاجر' },
  { id: 'supermarket', name: 'Supermarket', nameAr: 'سوبر ماركت' },
  { id: 'wifi', name: 'Wi-Fi', nameAr: 'واي فاي' },
  { id: 'lounge', name: 'Waiting lounge', nameAr: 'صالة انتظار' },
  { id: 'covered', name: 'Covered parking', nameAr: 'مواقف مظللة' },
  { id: 'lighting', name: 'Lighting', nameAr: 'إنارة' },
  { id: 'cctv', name: 'CCTV', nameAr: 'كاميرات مراقبة' },
  { id: 'security', name: '24/7 security', nameAr: 'أمن على مدار الساعة' },
  { id: 'accessible', name: 'Accessible bay', nameAr: 'موقف لذوي الهمم' },
  { id: 'valet', name: 'Valet', nameAr: 'خدمة صف السيارات' },
  { id: 'carwash', name: 'Car wash', nameAr: 'غسيل سيارات' },
  { id: 'prayer', name: 'Prayer room', nameAr: 'مصلى' },
  { id: 'atm', name: 'ATM', nameAr: 'صراف آلي' },
];

const manufacturers: LookupOption[] = [
  { id: 'abb', name: 'ABB', nameAr: 'إيه بي بي', meta: { country: 'CH' } },
  { id: 'alpitronic', name: 'Alpitronic', nameAr: 'ألبيترونيك', meta: { country: 'IT' } },
  { id: 'kempower', name: 'Kempower', nameAr: 'كيمباور', meta: { country: 'FI' } },
  { id: 'delta', name: 'Delta Electronics', nameAr: 'دلتا إلكترونيكس', meta: { country: 'TW' } },
  { id: 'siemens', name: 'Siemens', nameAr: 'سيمنس', meta: { country: 'DE' } },
  { id: 'autel', name: 'Autel Energy', nameAr: 'أوتيل إنرجي', meta: { country: 'CN' } },
  { id: 'wallbox', name: 'Wallbox', nameAr: 'وول بوكس', meta: { country: 'ES' } },
  { id: 'schneider', name: 'Schneider Electric', nameAr: 'شنايدر إلكتريك', meta: { country: 'FR' } },
  { id: 'tritium', name: 'Tritium', nameAr: 'تريتيوم', meta: { country: 'AU' } },
  { id: 'star-charge', name: 'Star Charge', nameAr: 'ستار تشارج', meta: { country: 'CN' } },
];

const locationTypes: LookupOption[] = [
  { id: 'Public', name: 'Public', nameAr: 'عام' },
  { id: 'Retail', name: 'Retail', nameAr: 'تجزئة' },
  { id: 'Workplace', name: 'Workplace', nameAr: 'مكان عمل' },
  { id: 'Residential', name: 'Residential', nameAr: 'سكني' },
  { id: 'Fleet', name: 'Fleet depot', nameAr: 'مستودع أسطول' },
  { id: 'Hotel', name: 'Hotel', nameAr: 'فندق' },
  { id: 'Highway', name: 'Highway', nameAr: 'طريق سريع' },
  { id: 'Parking', name: 'Parking operator', nameAr: 'مشغل مواقف' },
];

/** Groups the OCPP configuration keys so the list is navigable. */
const ocppConfigGroups: LookupOption[] = [
  { id: 'core', name: 'Core', nameAr: 'أساسي' },
  { id: 'connectivity', name: 'Connectivity', nameAr: 'الاتصال' },
  { id: 'metering', name: 'Metering', nameAr: 'القياس' },
  { id: 'authorization', name: 'Authorisation', nameAr: 'التفويض' },
  { id: 'smart-charging', name: 'Smart charging', nameAr: 'الشحن الذكي' },
  { id: 'security', name: 'Security', nameAr: 'الأمان' },
  { id: 'local-auth', name: 'Local auth list', nameAr: 'قائمة التفويض المحلية' },
  { id: 'reservation', name: 'Reservation', nameAr: 'الحجز' },
];

/* -------------------------------------------------------------------------- */
/* Registry + accessors                                                        */
/* -------------------------------------------------------------------------- */

const REGISTRY: Record<LookupKey, LookupOption[]> = {
  countries,
  cities,
  mainSectors,
  subSectors,
  departments,
  positions,
  services,
  employeeBands,
  genders,
  documentTypes,
  amenities,
  manufacturers,
  locationTypes,
  ocppConfigGroups,
};

/** Every active option of a lookup, in registry order. */
export function getLookup(key: LookupKey): LookupOption[] {
  return REGISTRY[key].filter((o) => o.active !== false);
}

/**
 * Options of a dependent lookup for one parent id. Returns `[]` when no parent
 * is chosen yet — which is what disables the dependent control in the UI.
 */
export function getDependentLookup(key: LookupKey, parentId: string | null | undefined): LookupOption[] {
  if (!parentId) return [];
  return getLookup(key).filter((o) => o.parentId === parentId);
}

export function findLookup(key: LookupKey, id: string | null | undefined): LookupOption | undefined {
  if (!id) return undefined;
  return REGISTRY[key].find((o) => o.id === id);
}

/** `true` when any selected service requires a charger count. */
export function servicesRequireChargers(serviceIds: string[]): boolean {
  return serviceIds.some((id) => findLookup('services', id)?.meta?.requiresChargers === true);
}

/** Country lookups reshaped for `PhoneInput`. */
export function dialCodes(): { code: string; label: string; dial: string }[] {
  return getLookup('countries').map((c) => ({
    code: c.id,
    label: c.name,
    dial: String(c.meta?.dial ?? ''),
  }));
}

export function dialCodeOf(countryId: string): string {
  return String(findLookup('countries', countryId)?.meta?.dial ?? '');
}
