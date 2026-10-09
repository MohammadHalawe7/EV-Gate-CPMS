/* =============================================================================
 * EV Gate CPMS — seeded network data.
 *
 * A realistic UAE charging network, generated deterministically so that every
 * reload, every screenshot and every test sees the same numbers. Stations,
 * EVSEs and connectors are *derived from hardware profiles* rather than listed
 * by hand — the same code path the product uses when an operator commissions a
 * station, so the seed cannot drift from the real behaviour.
 * ========================================================================== */

import {
  type ActivityEntry,
  type ChargingProfile,
  type ChargingStation,
  type ConfigurationKey,
  type Connector,
  type ConnectorStatus,
  type DiagnosticsJob,
  type Evse,
  type FirmwareJob,
  type HardwareProfile,
  type Location,
  type LocationService,
  type OcppCommand,
  type OcppMessage,
  type PaymentPolicy,
  type StationConfig,
  type StationState,
  type Tariff,
  EV_CHARGING_SERVICE_ID,
} from '@/domain/network';

/* -------------------------------------------------------------------------- */
/* Deterministic pseudo-randomness                                            */
/* -------------------------------------------------------------------------- */

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20260401);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const chance = (p: number) => rng() < p;

/** A fixed "now" so relative timestamps stay stable across reloads. */
export const SEED_NOW = new Date('2026-10-06T09:20:00.000Z');
const ago = (ms: number) => new Date(SEED_NOW.getTime() - ms).toISOString();
const ahead = (ms: number) => new Date(SEED_NOW.getTime() + ms).toISOString();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/* -------------------------------------------------------------------------- */
/* Organisation                                                                */
/* -------------------------------------------------------------------------- */

export const COMPANY_ID = 'cmp-alnoor';
export const TENANT_ID = 'tnt-emirates';

export const COMPANY_PAYMENT_POLICY: PaymentPolicy = {
  methods: ['Wallet', 'Card', 'MobileApp', 'RfidAccount'],
  wallet: 'Platform',
  externalWalletProvider: '',
  topUp: {
    enabled: true,
    minimumTopUp: 50,
    suggestedAmounts: [50, 100, 200, 500],
    autoTopUpEnabled: true,
    autoTopUpThreshold: 25,
    autoTopUpAmount: 100,
  },
  minimumWalletBalance: 20,
  minimumCardPayment: 10,
  preAuthorisationAmount: 150,
  currency: 'AED',
};

/* -------------------------------------------------------------------------- */
/* Hardware profiles — the reusable product catalogue                         */
/* -------------------------------------------------------------------------- */

const noCaps = {
  smartCharging: false,
  reservation: false,
  plugAndCharge: false,
  rfidReader: false,
  anpr: false,
  display: false,
  loadBalancing: false,
  offlineCharging: false,
  certifiedMeter: false,
  paymentTerminal: false,
};

export const HARDWARE_PROFILES: HardwareProfile[] = [
  {
    id: 'hwp-alpi-hyc300',
    code: 'HWP-0001',
    name: 'Alpitronic HYC300',
    nameAr: 'ألبيترونيك HYC300',
    manufacturer: 'alpitronic',
    model: 'HYC300',
    category: 'DC',
    maxPowerKw: 300,
    evses: [
      {
        ordinal: 1,
        maxPowerKw: 150,
        powerType: 'DC',
        connectors: [
          { type: 'CCS2', powerType: 'DC', maxPowerKw: 150, maxAmperage: 500, voltage: 920, cableAttached: true },
          { type: 'CHAdeMO', powerType: 'DC', maxPowerKw: 100, maxAmperage: 200, voltage: 500, cableAttached: true },
        ],
      },
      {
        ordinal: 2,
        maxPowerKw: 150,
        powerType: 'DC',
        connectors: [
          { type: 'CCS2', powerType: 'DC', maxPowerKw: 150, maxAmperage: 500, voltage: 920, cableAttached: true },
        ],
      },
    ],
    ocppVersions: ['1.6J', '2.0.1'],
    capabilities: {
      ...noCaps,
      smartCharging: true, reservation: true, plugAndCharge: true, rfidReader: true,
      display: true, loadBalancing: true, offlineCharging: true, certifiedMeter: true, paymentTerminal: true,
    },
    countryOfManufacture: 'IT',
    yearOfManufacture: 2024,
    ingressProtection: 'IP54',
    operatingTempMinC: -35,
    operatingTempMaxC: 55,
    certifications: ['CE', 'Eichrecht', 'IEC 61851', 'ISO 15118'],
    status: 'Active',
    notes: 'High-power hypercharger for highway and retail flagship sites. Dynamic power sharing across both EVSEs.',
    createdAt: ago(240 * DAY),
  },
  {
    id: 'hwp-abb-terra-ac',
    code: 'HWP-0002',
    name: 'ABB Terra AC Wallbox 22',
    nameAr: 'إيه بي بي تيرا AC 22',
    manufacturer: 'abb',
    model: 'Terra AC W22-T-R',
    category: 'AC',
    maxPowerKw: 22,
    evses: [
      {
        ordinal: 1,
        maxPowerKw: 22,
        powerType: 'AC_3_PHASE',
        connectors: [
          { type: 'Type2', powerType: 'AC_3_PHASE', maxPowerKw: 22, maxAmperage: 32, voltage: 400, cableAttached: false },
        ],
      },
    ],
    ocppVersions: ['1.6J'],
    capabilities: {
      ...noCaps,
      smartCharging: true, rfidReader: true, loadBalancing: true, offlineCharging: true, certifiedMeter: true,
    },
    countryOfManufacture: 'CH',
    yearOfManufacture: 2023,
    ingressProtection: 'IP54',
    operatingTempMinC: -35,
    operatingTempMaxC: 55,
    certifications: ['CE', 'IEC 61851'],
    status: 'Active',
    notes: 'Workhorse AC wallbox for workplace and residential destinations.',
    createdAt: ago(300 * DAY),
  },
  {
    id: 'hwp-kempower-satellite',
    code: 'HWP-0003',
    name: 'Kempower Satellite 200',
    nameAr: 'كيمباور ساتلايت 200',
    manufacturer: 'kempower',
    model: 'Satellite C2',
    category: 'DC',
    maxPowerKw: 200,
    evses: [
      {
        ordinal: 1,
        maxPowerKw: 200,
        powerType: 'DC',
        connectors: [
          { type: 'CCS2', powerType: 'DC', maxPowerKw: 200, maxAmperage: 500, voltage: 920, cableAttached: true },
        ],
      },
      {
        ordinal: 2,
        maxPowerKw: 200,
        powerType: 'DC',
        connectors: [
          { type: 'CCS2', powerType: 'DC', maxPowerKw: 200, maxAmperage: 500, voltage: 920, cableAttached: true },
        ],
      },
    ],
    ocppVersions: ['1.6J', '2.0.1'],
    capabilities: {
      ...noCaps,
      smartCharging: true, reservation: true, rfidReader: true, display: true,
      loadBalancing: true, offlineCharging: true, certifiedMeter: true,
    },
    countryOfManufacture: 'FI',
    yearOfManufacture: 2025,
    ingressProtection: 'IP54',
    operatingTempMinC: -30,
    operatingTempMaxC: 50,
    certifications: ['CE', 'IEC 61851', 'ISO 15118'],
    status: 'Active',
    notes: 'Satellite dispensers fed from a central power unit — best density per square metre.',
    createdAt: ago(180 * DAY),
  },
  {
    id: 'hwp-delta-ac-max',
    code: 'HWP-0004',
    name: 'Delta AC Max Twin 22',
    nameAr: 'دلتا AC ماكس توين 22',
    manufacturer: 'delta',
    model: 'AC Max Twin',
    category: 'AC',
    maxPowerKw: 44,
    evses: [
      { ordinal: 1, maxPowerKw: 22, powerType: 'AC_3_PHASE', connectors: [{ type: 'Type2', powerType: 'AC_3_PHASE', maxPowerKw: 22, maxAmperage: 32, voltage: 400, cableAttached: false }] },
      { ordinal: 2, maxPowerKw: 22, powerType: 'AC_3_PHASE', connectors: [{ type: 'Type2', powerType: 'AC_3_PHASE', maxPowerKw: 22, maxAmperage: 32, voltage: 400, cableAttached: false }] },
    ],
    ocppVersions: ['1.6J', '2.0.1'],
    capabilities: { ...noCaps, smartCharging: true, rfidReader: true, display: true, loadBalancing: true, offlineCharging: true },
    countryOfManufacture: 'TW',
    yearOfManufacture: 2024,
    ingressProtection: 'IP55',
    operatingTempMinC: -30,
    operatingTempMaxC: 55,
    certifications: ['CE', 'IEC 61851'],
    status: 'Active',
    notes: 'Twin-socket pedestal — two bays from one grid connection.',
    createdAt: ago(210 * DAY),
  },
  {
    id: 'hwp-autel-maxicharger-dc',
    code: 'HWP-0005',
    name: 'Autel MaxiCharger DC Compact',
    nameAr: 'أوتيل ماكسي تشارجر DC',
    manufacturer: 'autel',
    model: 'MaxiCharger DC Compact 60',
    category: 'DC',
    maxPowerKw: 60,
    evses: [
      {
        ordinal: 1,
        maxPowerKw: 60,
        powerType: 'DC',
        connectors: [
          { type: 'CCS2', powerType: 'DC', maxPowerKw: 60, maxAmperage: 150, voltage: 500, cableAttached: true },
          { type: 'Type2', powerType: 'AC_3_PHASE', maxPowerKw: 22, maxAmperage: 32, voltage: 400, cableAttached: false },
        ],
      },
    ],
    ocppVersions: ['1.6J'],
    capabilities: { ...noCaps, smartCharging: true, rfidReader: true, display: true, offlineCharging: true, paymentTerminal: true },
    countryOfManufacture: 'CN',
    yearOfManufacture: 2024,
    ingressProtection: 'IP54',
    operatingTempMinC: -25,
    operatingTempMaxC: 55,
    certifications: ['CE', 'IEC 61851'],
    status: 'Active',
    notes: 'Compact hybrid unit — DC fast plus an AC socket in a single enclosure.',
    createdAt: ago(150 * DAY),
  },
  {
    id: 'hwp-siemens-versicharge',
    code: 'HWP-0006',
    name: 'Siemens VersiCharge Ultra 175',
    nameAr: 'سيمنس فيرسي تشارج ألترا 175',
    manufacturer: 'siemens',
    model: 'VersiCharge Ultra 175',
    category: 'DC',
    maxPowerKw: 175,
    evses: [
      { ordinal: 1, maxPowerKw: 175, powerType: 'DC', connectors: [{ type: 'CCS2', powerType: 'DC', maxPowerKw: 175, maxAmperage: 400, voltage: 920, cableAttached: true }] },
    ],
    ocppVersions: ['2.0.1', '2.1'],
    capabilities: { ...noCaps, smartCharging: true, reservation: true, plugAndCharge: true, display: true, loadBalancing: true, certifiedMeter: true },
    countryOfManufacture: 'DE',
    yearOfManufacture: 2025,
    ingressProtection: 'IP55',
    operatingTempMinC: -30,
    operatingTempMaxC: 50,
    certifications: ['CE', 'Eichrecht', 'ISO 15118-20'],
    status: 'Draft',
    notes: 'Evaluation unit. Not yet approved for rollout — pending OCPP 2.0.1 certification on our CSMS.',
    createdAt: ago(40 * DAY),
  },
];

/* -------------------------------------------------------------------------- */
/* Tariffs                                                                     */
/* -------------------------------------------------------------------------- */

const noFees = {
  sessionFee: 0,
  idleFeePerMinute: 0,
  idleGraceMinutes: 10,
  idleFeeCap: 0,
  reservationFee: 0,
  rebookingFee: 0,
  cancellationFee: 0,
  cancellationGraceMinutes: 15,
  noShowFee: 0,
  minimumCharge: 0,
};

export const TARIFFS: Tariff[] = [
  {
    id: 'trf-standard-ac',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0001',
    name: 'Standard AC',
    nameAr: 'التعرفة القياسية للتيار المتردد',
    description: 'Default public AC rate. Flat energy price with a short idle grace period.',
    type: 'Energy',
    status: 'Active',
    currency: 'AED',
    basePricePerKwh: 0.7,
    basePricePerMinute: 0,
    fees: { ...noFees, idleFeePerMinute: 0.5, idleGraceMinutes: 15, idleFeeCap: 60, minimumCharge: 5 },
    twentyFourSeven: true,
    windows: [],
    appliesTo: 'AC',
    vatPct: 5,
    validFrom: ago(300 * DAY),
    validTo: null,
    isCompanyDefault: true,
    createdAt: ago(300 * DAY),
    updatedAt: ago(42 * DAY),
  },
  {
    id: 'trf-standard-dc',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0002',
    name: 'Standard DC Fast',
    nameAr: 'التعرفة القياسية للشحن السريع',
    description: 'Public DC rate with peak and off-peak windows. Overstay charged after 10 minutes.',
    type: 'Hybrid',
    status: 'Active',
    currency: 'AED',
    basePricePerKwh: 1.2,
    basePricePerMinute: 0,
    fees: { ...noFees, sessionFee: 2, idleFeePerMinute: 1.5, idleGraceMinutes: 10, idleFeeCap: 120, reservationFee: 5, cancellationFee: 2, noShowFee: 10, minimumCharge: 10 },
    twentyFourSeven: false,
    windows: [
      { id: 'w-peak', label: 'Peak', days: [0, 1, 2, 3, 4], fromHour: 16, toHour: 22, pricePerKwh: 1.45, pricePerMinute: 0 },
      { id: 'w-offpeak', label: 'Off-peak', days: [0, 1, 2, 3, 4], fromHour: 22, toHour: 7, pricePerKwh: 0.95, pricePerMinute: 0 },
      { id: 'w-weekend', label: 'Weekend', days: [5, 6], fromHour: 0, toHour: 24, pricePerKwh: 1.1, pricePerMinute: 0 },
    ],
    appliesTo: 'DC',
    vatPct: 5,
    validFrom: ago(300 * DAY),
    validTo: null,
    isCompanyDefault: false,
    createdAt: ago(300 * DAY),
    updatedAt: ago(12 * DAY),
  },
  {
    id: 'trf-workplace-free',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0003',
    name: 'Workplace — Free to staff',
    nameAr: 'مكان العمل — مجاني للموظفين',
    description: 'Zero-rated energy for authorised staff cards. Overstay fee still applies so bays turn over.',
    type: 'Flat',
    status: 'Active',
    currency: 'AED',
    basePricePerKwh: 0,
    basePricePerMinute: 0,
    fees: { ...noFees, idleFeePerMinute: 1, idleGraceMinutes: 30, idleFeeCap: 80 },
    twentyFourSeven: true,
    windows: [],
    appliesTo: 'All',
    vatPct: 0,
    validFrom: ago(220 * DAY),
    validTo: null,
    isCompanyDefault: false,
    createdAt: ago(220 * DAY),
    updatedAt: ago(88 * DAY),
  },
  {
    id: 'trf-highway-premium',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0004',
    name: 'Highway Premium',
    nameAr: 'تعرفة الطريق السريع المميزة',
    description: 'Highway corridor pricing. Higher energy rate, aggressive overstay, reservation supported.',
    type: 'Hybrid',
    status: 'Active',
    currency: 'AED',
    basePricePerKwh: 1.55,
    basePricePerMinute: 0,
    fees: { ...noFees, sessionFee: 3, idleFeePerMinute: 2.5, idleGraceMinutes: 5, idleFeeCap: 150, reservationFee: 10, rebookingFee: 5, cancellationFee: 5, cancellationGraceMinutes: 10, noShowFee: 15, minimumCharge: 15 },
    twentyFourSeven: true,
    windows: [],
    appliesTo: 'DC',
    vatPct: 5,
    validFrom: ago(120 * DAY),
    validTo: null,
    isCompanyDefault: false,
    createdAt: ago(120 * DAY),
    updatedAt: ago(5 * DAY),
  },
  {
    id: 'trf-fleet-night',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0005',
    name: 'Fleet Overnight',
    nameAr: 'تعرفة الأسطول الليلية',
    description: 'Depot rate built to push charging into the overnight window.',
    type: 'Energy',
    status: 'Active',
    currency: 'AED',
    basePricePerKwh: 0.85,
    basePricePerMinute: 0,
    fees: { ...noFees },
    twentyFourSeven: false,
    windows: [
      { id: 'w-night', label: 'Overnight', days: [0, 1, 2, 3, 4, 5, 6], fromHour: 21, toHour: 6, pricePerKwh: 0.42, pricePerMinute: 0 },
      { id: 'w-day', label: 'Daytime', days: [0, 1, 2, 3, 4, 5, 6], fromHour: 6, toHour: 21, pricePerKwh: 0.95, pricePerMinute: 0 },
    ],
    appliesTo: 'All',
    vatPct: 5,
    validFrom: ago(90 * DAY),
    validTo: null,
    isCompanyDefault: false,
    createdAt: ago(90 * DAY),
    updatedAt: ago(30 * DAY),
  },
  {
    id: 'trf-retail-promo',
    companyId: COMPANY_ID, tenantId: TENANT_ID,
    code: 'TRF-0006',
    name: 'Retail Launch Promotion',
    nameAr: 'عرض إطلاق التجزئة',
    description: 'Time-limited launch rate for the Marina site. Expires automatically.',
    type: 'Energy',
    status: 'Draft',
    currency: 'AED',
    basePricePerKwh: 0.55,
    basePricePerMinute: 0,
    fees: { ...noFees, idleFeePerMinute: 1, idleGraceMinutes: 20 },
    twentyFourSeven: true,
    windows: [],
    appliesTo: 'All',
    vatPct: 5,
    validFrom: ahead(7 * DAY),
    validTo: ahead(97 * DAY),
    isCompanyDefault: false,
    createdAt: ago(3 * DAY),
    updatedAt: ago(3 * DAY),
  },
];

/* -------------------------------------------------------------------------- */
/* Locations                                                                   */
/* -------------------------------------------------------------------------- */

const allDays = (from: string, to: string) =>
  Array.from({ length: 7 }, (_, day) => ({ day, open: true, from, to }));

const workWeek = (from: string, to: string) =>
  Array.from({ length: 7 }, (_, day) => ({ day, open: day <= 4, from, to }));

interface LocationSeed {
  id: string;
  name: string;
  nameAr: string;
  type: Location['type'];
  cityId: string;
  address: string;
  addressAr: string;
  lat: number;
  lng: number;
  bays: number;
  grid: number;
  amenities: string[];
  access: Location['accessType'];
  hours: Location['openingHours'];
  status: Location['status'];
  contact: [string, string, string];
  /** Hardware profile id → how many of that unit are installed. */
  fleet: [string, number][];
  tariffId: string | null;
  siteLimitKw: number;
  paymentOverride?: Partial<PaymentPolicy>;
  notes: string;
}

const LOCATION_SEEDS: LocationSeed[] = [
  {
    id: 'loc-marina-mall', name: 'Marina Mall Dubai', nameAr: 'مارينا مول دبي', type: 'Retail',
    cityId: 'AE-DXB', address: 'Marina Mall, Sheikh Zayed Road, Dubai Marina',
    addressAr: 'مارينا مول، شارع الشيخ زايد، دبي مارينا',
    lat: 25.0772, lng: 55.1403, bays: 420, grid: 900,
    amenities: ['restroom', 'cafe', 'restaurant', 'retail', 'wifi', 'covered', 'cctv', 'security', 'accessible', 'prayer'],
    access: 'Public', hours: { twentyFourSeven: true, windows: allDays('00:00', '23:59') }, status: 'Active',
    contact: ['Rashid Al Marri', '+971 50 118 2204', 'rashid.marri@alnoor.example'],
    fleet: [['hwp-alpi-hyc300', 2], ['hwp-abb-terra-ac', 6]],
    tariffId: 'trf-standard-dc', siteLimitKw: 760,
    notes: 'Flagship retail site. Level 2 of the north car park, bays N2-01 to N2-14.',
  },
  {
    id: 'loc-business-bay-hq', name: 'Al Noor HQ — Business Bay', nameAr: 'المقر الرئيسي — الخليج التجاري', type: 'Workplace',
    cityId: 'AE-DXB', address: 'Al Noor Tower, Marasi Drive, Business Bay',
    addressAr: 'برج النور، شارع مراسي، الخليج التجاري',
    lat: 25.1853, lng: 55.2654, bays: 180, grid: 260,
    amenities: ['restroom', 'cafe', 'wifi', 'covered', 'cctv', 'accessible', 'prayer'],
    access: 'Restricted', hours: { twentyFourSeven: false, windows: workWeek('06:00', '20:00') }, status: 'Active',
    contact: ['Amal Saeed', '+971 50 334 7781', 'amal.saeed@alnoor.example'],
    fleet: [['hwp-abb-terra-ac', 8], ['hwp-delta-ac-max', 2]],
    tariffId: 'trf-workplace-free', siteLimitKw: 220,
    paymentOverride: { methods: ['RfidAccount', 'MobileApp', 'Free'], wallet: 'None', minimumCardPayment: 0, preAuthorisationAmount: 0 },
    notes: 'Staff only. Access by company RFID card or the staff app.',
  },
  {
    id: 'loc-e11-highway', name: 'E11 Ghantoot Service Plaza', nameAr: 'محطة الغنتوت E11', type: 'Highway',
    cityId: 'AE-AUH', address: 'E11 Sheikh Zayed Road, Ghantoot southbound',
    addressAr: 'طريق الشيخ زايد E11، الغنتوت باتجاه الجنوب',
    lat: 24.8867, lng: 54.9931, bays: 60, grid: 1400,
    amenities: ['restroom', 'cafe', 'supermarket', 'wifi', 'lighting', 'cctv', 'security', 'prayer', 'atm'],
    access: 'Public', hours: { twentyFourSeven: true, windows: allDays('00:00', '23:59') }, status: 'Active',
    contact: ['Faisal Al Hammadi', '+971 55 902 1145', 'faisal.h@alnoor.example'],
    fleet: [['hwp-alpi-hyc300', 3], ['hwp-kempower-satellite', 2]],
    tariffId: 'trf-highway-premium', siteLimitKw: 1200,
    notes: 'Corridor site between Dubai and Abu Dhabi. Highest utilisation in the network.',
  },
  {
    id: 'loc-jumeirah-resort', name: 'Jumeirah Shoreline Resort', nameAr: 'منتجع جميرا شورلاين', type: 'Hotel',
    cityId: 'AE-DXB', address: 'Jumeirah Beach Road, Umm Suqeim 3',
    addressAr: 'شارع شاطئ جميرا، أم سقيم 3',
    lat: 25.1413, lng: 55.1853, bays: 95, grid: 180,
    amenities: ['restroom', 'restaurant', 'lounge', 'valet', 'covered', 'cctv', 'security', 'accessible'],
    access: 'Public', hours: { twentyFourSeven: true, windows: allDays('00:00', '23:59') }, status: 'Active',
    contact: ['Layla Nasser', '+971 52 441 9087', 'layla.nasser@alnoor.example'],
    fleet: [['hwp-abb-terra-ac', 4], ['hwp-autel-maxicharger-dc', 1]],
    tariffId: null, siteLimitKw: 160,
    notes: 'Valet-managed bays. Guests charge on the room folio via the hotel app.',
  },
  {
    id: 'loc-dip-depot', name: 'Dubai Investments Park Depot', nameAr: 'مستودع مجمع دبي للاستثمار', type: 'Fleet',
    cityId: 'AE-DXB', address: 'DIP 2, Street 18, Warehouse Complex C',
    addressAr: 'مجمع دبي للاستثمار 2، شارع 18، مجمع المستودعات C',
    lat: 24.9857, lng: 55.1766, bays: 48, grid: 650,
    amenities: ['restroom', 'lighting', 'cctv', 'security'],
    access: 'Private', hours: { twentyFourSeven: true, windows: allDays('00:00', '23:59') }, status: 'Active',
    contact: ['Rami Haddad', '+971 50 987 6543', 'rami.haddad@alnoor.example'],
    fleet: [['hwp-delta-ac-max', 6], ['hwp-kempower-satellite', 1]],
    tariffId: 'trf-fleet-night', siteLimitKw: 600,
    paymentOverride: { methods: ['Invoice'], wallet: 'None', minimumCardPayment: 0, preAuthorisationAmount: 0 },
    notes: 'Last-mile delivery fleet. Overnight depot charging under a dynamic site budget.',
  },
  {
    id: 'loc-sharjah-central', name: 'Sharjah Central Souq', nameAr: 'سوق الشارقة المركزي', type: 'Retail',
    cityId: 'AE-SHJ', address: 'Al Majaz, Corniche Street, Sharjah',
    addressAr: 'المجاز، شارع الكورنيش، الشارقة',
    lat: 25.3416, lng: 55.3899, bays: 210, grid: 320,
    amenities: ['restroom', 'cafe', 'retail', 'covered', 'cctv', 'prayer', 'accessible'],
    access: 'Public', hours: { twentyFourSeven: false, windows: allDays('08:00', '23:00') }, status: 'Active',
    contact: ['Noura Al Suwaidi', '+971 56 220 3398', 'noura.s@alnoor.example'],
    fleet: [['hwp-autel-maxicharger-dc', 2], ['hwp-abb-terra-ac', 3]],
    tariffId: 'trf-standard-dc', siteLimitKw: 300,
    notes: '',
  },
  {
    id: 'loc-yas-island', name: 'Yas Island Arena Parking', nameAr: 'مواقف حلبة جزيرة ياس', type: 'Public',
    cityId: 'AE-AUH', address: 'Yas Island, West Arena Car Park P3',
    addressAr: 'جزيرة ياس، موقف الحلبة الغربي P3',
    lat: 24.4672, lng: 54.6031, bays: 340, grid: 520,
    amenities: ['restroom', 'lighting', 'cctv', 'security', 'accessible', 'wifi'],
    access: 'Public', hours: { twentyFourSeven: true, windows: allDays('00:00', '23:59') }, status: 'Active',
    contact: ['Khalid Al Dhaheri', '+971 50 773 4412', 'khalid.d@alnoor.example'],
    fleet: [['hwp-kempower-satellite', 2], ['hwp-abb-terra-ac', 4]],
    tariffId: 'trf-standard-dc', siteLimitKw: 480,
    notes: 'Event-driven demand. Load management is essential on race weekends.',
  },
  {
    id: 'loc-al-ain-oasis', name: 'Al Ain Oasis Visitor Centre', nameAr: 'مركز زوار واحة العين', type: 'Public',
    cityId: 'AE-AAN', address: 'Al Ain Oasis, Central District',
    addressAr: 'واحة العين، المنطقة المركزية',
    lat: 24.2111, lng: 55.7606, bays: 70, grid: 120,
    amenities: ['restroom', 'cafe', 'lighting', 'accessible', 'prayer'],
    access: 'Public', hours: { twentyFourSeven: false, windows: allDays('07:00', '19:00') }, status: 'Draft',
    contact: ['Mariam Al Kaabi', '+971 54 118 2290', 'mariam.k@alnoor.example'],
    fleet: [['hwp-abb-terra-ac', 2]],
    tariffId: null, siteLimitKw: 100,
    notes: 'Awaiting final DEWA energisation certificate before the site goes live.',
  },
];

/* -------------------------------------------------------------------------- */
/* Generators — the same path the product uses to commission a station        */
/* -------------------------------------------------------------------------- */

export function defaultStationConfig(profile: HardwareProfile, overrides?: Partial<StationConfig>): StationConfig {
  const caps = profile.capabilities;
  return {
    access: {
      visibility: 'Public',
      roamingEnabled: false,
      authMethods: [
        'MobileApp',
        ...(caps.rfidReader ? (['RfidCard'] as const) : []),
        ...(caps.paymentTerminal ? (['AdHocCard'] as const) : []),
        ...(caps.plugAndCharge ? (['PlugAndCharge'] as const) : []),
      ],
      reservationEnabled: caps.reservation,
      reservationMaxMinutes: 30,
    },
    policy: {
      offlineBehaviour: caps.offlineCharging ? 'AllowKnown' : 'Reject',
      maxSessionMinutes: 0,
      maxSessionKwh: 0,
      maxSessionCost: 0,
      idleGraceMinutes: 10,
      stopOnFullCharge: true,
      allowSimultaneousCharging: profile.evses.length > 1,
    },
    smart: {
      enabled: caps.smartCharging,
      maxCurrentA: profile.category === 'DC' ? 500 : 32,
      loadBalancing: caps.loadBalancing ? 'Dynamic' : 'Off',
      priority: 5,
    },
    ocpp: {
      endpointUrl: 'wss://ocpp.evgate.ae/1.6/alnoor',
      securityProfile: 2,
      hasCredentials: true,
      heartbeatIntervalSec: 300,
      connectionTimeoutSec: 60,
      meterValueIntervalSec: 60,
      resetRetries: 3,
      allowUnknownChargePoint: false,
    },
    ...overrides,
  };
}

/** Builds the EVSEs and connectors a profile prescribes for one station. */
export function materialiseHardware(
  station: Pick<ChargingStation, 'id' | 'locationId' | 'code'>,
  profile: HardwareProfile,
  startedAt: string,
): { evses: Evse[]; connectors: Connector[] } {
  const evses: Evse[] = [];
  const connectors: Connector[] = [];
  let connectorNumber = 1;

  profile.evses.forEach((template) => {
    const evseId = `${station.id}-e${template.ordinal}`;
    evses.push({
      id: evseId,
      stationId: station.id,
      locationId: station.locationId,
      evseCode: `AE*EVG*E${station.code.replace(/\D/g, '').padStart(6, '0')}*${template.ordinal}`,
      ordinal: template.ordinal,
      maxPowerKw: template.maxPowerKw,
      powerType: template.powerType,
      status: 'Available',
      tariffId: null,
      createdAt: startedAt,
    });

    template.connectors.forEach((c, ci) => {
      connectors.push({
        id: `${evseId}-c${ci + 1}`,
        evseId,
        stationId: station.id,
        locationId: station.locationId,
        connectorNumber: connectorNumber++,
        type: c.type,
        powerType: c.powerType,
        maxPowerKw: c.maxPowerKw,
        maxAmperage: c.maxAmperage,
        voltage: c.voltage,
        cableAttached: c.cableAttached,
        status: 'Available',
        errorCode: null,
        lastStatusAt: startedAt,
        tariffId: null,
        lifetimeKwh: 0,
        lifetimeSessions: 0,
      });
    });
  });

  return { evses, connectors };
}

/* -------------------------------------------------------------------------- */
/* Build the network                                                           */
/* -------------------------------------------------------------------------- */

const PROFILE_BY_ID = new Map(HARDWARE_PROFILES.map((p) => [p.id, p]));

const STATION_NAME_HINTS = ['North', 'South', 'East', 'West', 'Central', 'Level 1', 'Level 2', 'Bay A', 'Bay B', 'Plaza'];

function buildNetwork() {
  const locations: Location[] = [];
  const services: LocationService[] = [];
  const stations: ChargingStation[] = [];
  const evses: Evse[] = [];
  const connectors: Connector[] = [];

  let stationSeq = 0;

  LOCATION_SEEDS.forEach((seed, li) => {
    const createdAt = ago((320 - li * 28) * DAY);

    locations.push({
      id: seed.id,
      companyId: COMPANY_ID,
      tenantId: TENANT_ID,
      code: `EVG-LOC-${String(li + 1).padStart(4, '0')}`,
      name: seed.name,
      nameAr: seed.nameAr,
      type: seed.type,
      status: seed.status,
      address: seed.address,
      addressAr: seed.addressAr,
      countryId: 'AE',
      cityId: seed.cityId,
      lat: seed.lat,
      lng: seed.lng,
      parkingSpaces: seed.bays,
      amenityIds: seed.amenities,
      openingHours: seed.hours,
      accessType: seed.access,
      gridCapacityKw: seed.grid,
      siteContactName: seed.contact[0],
      siteContactPhone: seed.contact[1],
      siteContactEmail: seed.contact[2],
      notes: seed.notes,
      imageHue: (li * 47 + 265) % 360,
      createdAt,
      updatedAt: ago(int(1, 30) * DAY),
    });

    const serviceId = `${seed.id}-svc-ev`;
    services.push({
      id: serviceId,
      locationId: seed.id,
      serviceId: EV_CHARGING_SERVICE_ID,
      status: seed.status === 'Draft' ? 'Draft' : 'Active',
      enabledAt: createdAt,
      evCharging: {
        defaultTariffId: seed.tariffId,
        payment: seed.paymentOverride
          ? { ...COMPANY_PAYMENT_POLICY, ...seed.paymentOverride }
          : null,
        siteLoadLimitKw: seed.siteLimitKw,
        publicListing: seed.access === 'Public',
        roamingEnabled: seed.access === 'Public' && seed.type !== 'Workplace',
        supportPhone: '+971 800 383 4283',
      },
    });

    /* A couple of sites carry a second, non-EV service so the services panel
       is not a list of one. */
    if (seed.type === 'Retail' || seed.type === 'Hotel') {
      services.push({
        id: `${seed.id}-svc-parking`,
        locationId: seed.id,
        serviceId: 'parking',
        status: 'Active',
        enabledAt: createdAt,
      });
    }
    if (seed.type === 'Fleet') {
      services.push({
        id: `${seed.id}-svc-fleet`,
        locationId: seed.id,
        serviceId: 'fleet',
        status: 'Active',
        enabledAt: createdAt,
      });
    }

    seed.fleet.forEach(([profileId, count]) => {
      const profile = PROFILE_BY_ID.get(profileId)!;
      for (let i = 0; i < count; i += 1) {
        stationSeq += 1;
        const code = `EVG-CS-${String(stationSeq).padStart(4, '0')}`;
        const id = `stn-${String(stationSeq).padStart(4, '0')}`;
        const installedAt = ago(int(20, 300) * DAY);

        /* One site is mid-commissioning and one unit is in the workshop, so
           every lifecycle state is represented somewhere in the seed. */
        let state: StationState = 'Online';
        if (seed.status === 'Draft') state = 'Draft';
        else if (stationSeq === 9) state = 'Provisioning';
        else if (stationSeq === 14) state = 'Maintenance';
        else if (stationSeq === 5 || stationSeq === 23) state = 'Offline';
        else if (stationSeq === 3 || stationSeq === 18) state = 'Faulted';

        const live = state === 'Online' || state === 'Faulted';

        const station: ChargingStation = {
          id,
          locationId: seed.id,
          serviceId,
          companyId: COMPANY_ID,
          tenantId: TENANT_ID,
          code,
          name: `${profile.model} · ${STATION_NAME_HINTS[(stationSeq - 1) % STATION_NAME_HINTS.length]} ${String(i + 1).padStart(2, '0')}`,
          nameAr: `${profile.model} · ${String(i + 1).padStart(2, '0')}`,
          hardwareProfileId: profile.id,
          serialNumber: `${profile.manufacturer.slice(0, 3).toUpperCase()}-${int(2022, 2026)}-${int(100000, 999999)}`,
          chargePointId: `AE-EVG-${code.replace('EVG-CS-', 'CP')}`,
          ocppVersion: profile.ocppVersions[0],
          firmwareVersion: `${int(2, 5)}.${int(0, 9)}.${int(0, 24)}`,
          state,
          config: defaultStationConfig(profile, {
            access: {
              visibility: seed.access,
              roamingEnabled: seed.access === 'Public',
              authMethods: seed.access === 'Private'
                ? ['RfidCard']
                : seed.access === 'Restricted'
                  ? ['RfidCard', 'MobileApp']
                  : [
                      'MobileApp',
                      ...(profile.capabilities.rfidReader ? (['RfidCard'] as const) : []),
                      ...(profile.capabilities.paymentTerminal ? (['AdHocCard'] as const) : []),
                    ],
              reservationEnabled: profile.capabilities.reservation && seed.access === 'Public',
              reservationMaxMinutes: 30,
            },
          }),
          tariffId: null,
          installedAt,
          warrantyEndsAt: ahead(int(60, 900) * DAY),
          commissionedAt: state === 'Draft' || state === 'Provisioning' ? null : installedAt,
          lastBootAt: live ? ago(int(1, 40) * DAY) : state === 'Offline' ? ago(int(2, 9) * DAY) : null,
          lastHeartbeatAt: live ? ago(int(10, 280) * 1000) : state === 'Offline' ? ago(int(3, 52) * HOUR) : null,
          networkSignalPct: live ? int(58, 99) : int(0, 30),
          uptimePct: live ? Math.round((96 + rng() * 3.9) * 10) / 10 : Math.round((60 + rng() * 30) * 10) / 10,
          notes: state === 'Maintenance' ? 'Cable 2 replacement scheduled — parts on order.' : '',
          createdAt: installedAt,
          updatedAt: ago(int(1, 20) * DAY),
        };
        stations.push(station);

        const hw = materialiseHardware(station, profile, installedAt);

        /* Give the live estate a believable spread of OCPP statuses. */
        hw.connectors.forEach((c) => {
          let status: ConnectorStatus = 'Available';
          if (state === 'Draft' || state === 'Provisioning') status = 'Unavailable';
          else if (state === 'Offline') status = 'Unavailable';
          else if (state === 'Maintenance') status = 'Unavailable';
          else if (state === 'Faulted' && chance(0.6)) status = 'Faulted';
          else {
            const roll = rng();
            if (roll < 0.3) status = 'Charging';
            else if (roll < 0.36) status = 'Preparing';
            else if (roll < 0.4) status = 'Finishing';
            else if (roll < 0.44) status = 'SuspendedEV';
            else if (roll < 0.47) status = 'Reserved';
            else if (roll < 0.5) status = 'Unavailable';
          }
          c.status = status;
          c.errorCode = status === 'Faulted' ? pick(['GroundFailure', 'OverCurrentFailure', 'ConnectorLockFailure', 'EVCommunicationError']) : null;
          c.lastStatusAt = ago(int(1, 600) * MIN);
          c.lifetimeKwh = Math.round((state === 'Draft' ? 0 : int(400, 92000)) * 10) / 10;
          c.lifetimeSessions = state === 'Draft' ? 0 : int(20, 3400);
        });

        hw.evses.forEach((e) => {
          const mine = hw.connectors.filter((c) => c.evseId === e.id);
          const busy = mine.find((c) => c.status !== 'Available');
          e.status = busy ? busy.status : 'Available';
        });

        evses.push(...hw.evses);
        connectors.push(...hw.connectors);
      }
    });
  });

  return { locations, services, stations, evses, connectors };
}

const built = buildNetwork();

export const LOCATIONS = built.locations;
export const LOCATION_SERVICES = built.services;
export const STATIONS = built.stations;
export const EVSES = built.evses;
export const CONNECTORS = built.connectors;

/* -------------------------------------------------------------------------- */
/* OCPP                                                                        */
/* -------------------------------------------------------------------------- */

const liveStations = STATIONS.filter((s) => s.state === 'Online' || s.state === 'Faulted');

export const OCPP_MESSAGES: OcppMessage[] = (() => {
  const out: OcppMessage[] = [];
  const inbound = ['Heartbeat', 'StatusNotification', 'MeterValues', 'StartTransaction', 'StopTransaction', 'Authorize', 'BootNotification'] as const;
  const outbound = ['RemoteStartTransaction', 'ChangeConfiguration', 'GetConfiguration', 'TriggerMessage', 'Reset', 'UnlockConnector', 'SetChargingProfile'] as const;

  for (let i = 0; i < 260; i += 1) {
    const station = pick(liveStations);
    const isIn = chance(0.72);
    const action = isIn ? pick(inbound) : pick(outbound);
    const ok = chance(0.94);
    const at = ago(i * int(40, 900) * 1000);

    const payload: Record<string, unknown> =
      action === 'Heartbeat'
        ? {}
        : action === 'StatusNotification'
          ? { connectorId: int(1, 2), status: pick(['Available', 'Charging', 'Preparing', 'Finishing', 'Faulted']), errorCode: 'NoError', timestamp: at }
          : action === 'MeterValues'
            ? { connectorId: int(1, 2), transactionId: int(80000, 99999), meterValue: [{ timestamp: at, sampledValue: [{ value: String(int(1000, 48000)), measurand: 'Energy.Active.Import.Register', unit: 'Wh' }] }] }
            : action === 'StartTransaction'
              ? { connectorId: int(1, 2), idTag: `AE${int(100000, 999999)}`, meterStart: int(1000, 40000), timestamp: at }
              : action === 'StopTransaction'
                ? { transactionId: int(80000, 99999), meterStop: int(40000, 90000), reason: pick(['Local', 'Remote', 'EVDisconnected']), timestamp: at }
                : action === 'BootNotification'
                  ? { chargePointVendor: 'EVGate', chargePointModel: 'HYC300', firmwareVersion: '4.2.1' }
                  : action === 'ChangeConfiguration'
                    ? { key: pick(['HeartbeatInterval', 'MeterValueSampleInterval', 'ConnectionTimeOut']), value: String(int(30, 600)) }
                    : action === 'Reset'
                      ? { type: pick(['Soft', 'Hard']) }
                      : { connectorId: int(1, 2) };

    out.push({
      id: `msg-${i}`,
      stationId: station.id,
      chargePointId: station.chargePointId,
      direction: isIn ? 'IN' : 'OUT',
      messageType: ok ? (isIn ? 2 : 3) : 4,
      action,
      uniqueId: String(int(1000000, 9999999)),
      payload,
      ocppVersion: station.ocppVersion,
      at,
      latencyMs: isIn ? null : int(42, 1800),
      ok,
    });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
})();

export const OCPP_COMMANDS: OcppCommand[] = (() => {
  const out: OcppCommand[] = [];
  const actors = ['Amal Saeed', 'Faisal Al Hammadi', 'Noura Al Suwaidi', 'System · Scheduler'];
  const actions = ['Reset', 'RemoteStopTransaction', 'ChangeConfiguration', 'UnlockConnector', 'TriggerMessage', 'ChangeAvailability', 'ClearCache', 'GetConfiguration'] as const;

  for (let i = 0; i < 48; i += 1) {
    const station = pick(STATIONS.filter((s) => s.state !== 'Draft'));
    const action = pick(actions);
    const createdAt = ago(i * int(20, 240) * MIN);
    const status = i < 2 ? 'Queued' : i < 4 ? 'Sent' : chance(0.82) ? 'Accepted' : pick(['Rejected', 'TimedOut', 'Failed'] as const);
    const done = status === 'Accepted' || status === 'Rejected' || status === 'Failed';
    const duration = done ? int(120, 4200) : null;

    out.push({
      id: `cmd-${i}`,
      stationId: station.id,
      chargePointId: station.chargePointId,
      action,
      payload:
        action === 'Reset' ? { type: 'Soft' }
        : action === 'ChangeConfiguration' ? { key: 'HeartbeatInterval', value: '300' }
        : action === 'UnlockConnector' ? { connectorId: 1 }
        : action === 'ChangeAvailability' ? { connectorId: 0, type: 'Inoperative' }
        : action === 'TriggerMessage' ? { requestedMessage: 'StatusNotification' }
        : {},
      status,
      response: status === 'Accepted' ? { status: 'Accepted' } : status === 'Rejected' ? { status: 'Rejected' } : null,
      requestedByName: pick(actors),
      createdAt,
      completedAt: done ? new Date(new Date(createdAt).getTime() + (duration ?? 0)).toISOString() : null,
      durationMs: duration,
      error: status === 'TimedOut' ? 'No CALLRESULT within 30s' : status === 'Failed' ? 'Websocket closed during call' : null,
    });
  }
  return out;
})();

const CONFIG_KEY_TEMPLATE: [string, string, boolean, string, string, string][] = [
  ['HeartbeatInterval', '300', false, 's', 'core', 'Interval between Heartbeat messages.'],
  ['ConnectionTimeOut', '60', false, 's', 'connectivity', 'Seconds before an idle connection is dropped.'],
  ['MeterValueSampleInterval', '60', false, 's', 'metering', 'Sampling interval for MeterValues during a transaction.'],
  ['MeterValuesSampledData', 'Energy.Active.Import.Register,Power.Active.Import', false, '', 'metering', 'Measurands reported in MeterValues.'],
  ['ClockAlignedDataInterval', '900', false, 's', 'metering', 'Interval for clock-aligned meter data.'],
  ['AuthorizeRemoteTxRequests', 'true', false, '', 'authorization', 'Whether a remote start still requires authorisation.'],
  ['LocalAuthorizeOffline', 'true', false, '', 'authorization', 'Authorise from the local list when offline.'],
  ['LocalPreAuthorize', 'false', false, '', 'authorization', 'Authorise locally before contacting the CSMS.'],
  ['AllowOfflineTxForUnknownId', 'false', false, '', 'authorization', 'Start a transaction offline for an unknown idTag.'],
  ['StopTransactionOnEVSideDisconnect', 'true', false, '', 'core', 'End the transaction when the cable is unplugged.'],
  ['StopTransactionOnInvalidId', 'true', false, '', 'core', 'End the transaction when authorisation is revoked.'],
  ['UnlockConnectorOnEVSideDisconnect', 'true', false, '', 'core', 'Release the lock when the vehicle disconnects.'],
  ['ResetRetries', '3', false, '', 'core', 'Attempts before a reset is reported as failed.'],
  ['NumberOfConnectors', '2', true, '', 'core', 'Connectors reported by the charge point.'],
  ['ChargePointVendor', 'Alpitronic', true, '', 'core', 'Vendor reported at boot.'],
  ['SupportedFeatureProfiles', 'Core,FirmwareManagement,SmartCharging,RemoteTrigger,Reservation', true, '', 'core', 'Feature profiles the charge point implements.'],
  ['ChargeProfileMaxStackLevel', '10', true, '', 'smart-charging', 'Highest stack level accepted in a charging profile.'],
  ['ChargingScheduleAllowedChargingRateUnit', 'Current,Power', true, '', 'smart-charging', 'Rate units the charge point accepts.'],
  ['MaxChargingProfilesInstalled', '10', true, '', 'smart-charging', 'Charging profiles that can be stored.'],
  ['SecurityProfile', '2', false, '', 'security', 'OCPP security profile currently in use.'],
  ['LocalAuthListEnabled', 'true', false, '', 'local-auth', 'Whether the local authorisation list is honoured.'],
  ['LocalAuthListMaxLength', '1000', true, '', 'local-auth', 'Entries the local list can hold.'],
  ['ReserveConnectorZeroSupported', 'true', true, '', 'reservation', 'Whether connector 0 may be reserved.'],
  ['WebSocketPingInterval', '30', false, 's', 'connectivity', 'Websocket ping interval.'],
];

export const CONFIGURATION_KEYS: ConfigurationKey[] = STATIONS.filter((s) => s.state !== 'Draft').flatMap((station) =>
  CONFIG_KEY_TEMPLATE.map(([key, value, readonly, unit, group, description], i) => ({
    id: `${station.id}-cfg-${i}`,
    stationId: station.id,
    key,
    value:
      key === 'HeartbeatInterval' ? String(station.config.ocpp.heartbeatIntervalSec)
      : key === 'MeterValueSampleInterval' ? String(station.config.ocpp.meterValueIntervalSec)
      : key === 'ConnectionTimeOut' ? String(station.config.ocpp.connectionTimeoutSec)
      : key === 'ResetRetries' ? String(station.config.ocpp.resetRetries)
      : key === 'SecurityProfile' ? String(station.config.ocpp.securityProfile)
      : key === 'ChargePointVendor' ? (PROFILE_BY_ID.get(station.hardwareProfileId)?.manufacturer ?? value)
      : key === 'NumberOfConnectors' ? String(CONNECTORS.filter((c) => c.stationId === station.id).length)
      : value,
    readonly,
    unit,
    description,
    group,
    updatedAt: ago(int(1, 60) * DAY),
  })),
);

export const CHARGING_PROFILES: ChargingProfile[] = [
  {
    id: 'chp-site-marina', stationId: null, locationId: 'loc-marina-mall',
    name: 'Marina Mall — site ceiling', profileId: 1, stackLevel: 1,
    purpose: 'ChargePointMaxProfile', kind: 'Recurring', recurrency: 'Daily', chargingRateUnit: 'W',
    validFrom: ago(90 * DAY), validTo: null,
    periods: [
      { startSec: 0, limit: 760000, numberPhases: 3 },
      { startSec: 57600, limit: 520000, numberPhases: 3 },
      { startSec: 79200, limit: 760000, numberPhases: 3 },
    ],
    status: 'Active', createdAt: ago(90 * DAY),
  },
  {
    id: 'chp-depot-overnight', stationId: null, locationId: 'loc-dip-depot',
    name: 'Depot overnight ramp', profileId: 2, stackLevel: 2,
    purpose: 'TxDefaultProfile', kind: 'Recurring', recurrency: 'Daily', chargingRateUnit: 'W',
    validFrom: ago(60 * DAY), validTo: null,
    periods: [
      { startSec: 0, limit: 600000, numberPhases: 3 },
      { startSec: 21600, limit: 120000, numberPhases: 3 },
      { startSec: 75600, limit: 600000, numberPhases: 3 },
    ],
    status: 'Active', createdAt: ago(60 * DAY),
  },
  {
    id: 'chp-yas-event', stationId: null, locationId: 'loc-yas-island',
    name: 'Race weekend cap', profileId: 3, stackLevel: 3,
    purpose: 'ChargePointMaxProfile', kind: 'Absolute', recurrency: null, chargingRateUnit: 'W',
    validFrom: ahead(12 * DAY), validTo: ahead(15 * DAY),
    periods: [{ startSec: 0, limit: 420000, numberPhases: 3 }],
    status: 'Draft', createdAt: ago(6 * DAY),
  },
  {
    id: 'chp-hyc-derate', stationId: STATIONS[0]?.id ?? null, locationId: null,
    name: 'HYC300 thermal de-rate', profileId: 4, stackLevel: 5,
    purpose: 'TxDefaultProfile', kind: 'Recurring', recurrency: 'Daily', chargingRateUnit: 'A',
    validFrom: ago(20 * DAY), validTo: null,
    periods: [
      { startSec: 0, limit: 500, numberPhases: 3 },
      { startSec: 43200, limit: 350, numberPhases: 3 },
      { startSec: 64800, limit: 500, numberPhases: 3 },
    ],
    status: 'Active', createdAt: ago(20 * DAY),
  },
];

export const FIRMWARE_JOBS: FirmwareJob[] = (() => {
  const out: FirmwareJob[] = [];
  const targets = STATIONS.filter((s) => s.state !== 'Draft').slice(0, 14);
  targets.forEach((station, i) => {
    const status: FirmwareJob['status'] =
      i < 2 ? 'Scheduled' : i === 2 ? 'Downloading' : i === 3 ? 'Installing' : i === 4 ? 'DownloadFailed' : 'Installed';
    const scheduledAt = i < 2 ? ahead((i + 1) * 2 * DAY) : ago(int(1, 30) * DAY);
    out.push({
      id: `fw-${i}`,
      stationId: station.id,
      chargePointId: station.chargePointId,
      fromVersion: station.firmwareVersion,
      toVersion: `${Number(station.firmwareVersion.split('.')[0]) + 1}.0.0`,
      status,
      scheduledAt,
      startedAt: status === 'Scheduled' ? null : scheduledAt,
      completedAt: status === 'Installed' ? new Date(new Date(scheduledAt).getTime() + 42 * MIN).toISOString() : null,
      progressPct: status === 'Installed' ? 100 : status === 'Downloading' ? 46 : status === 'Installing' ? 82 : status === 'DownloadFailed' ? 23 : 0,
      retries: status === 'DownloadFailed' ? 2 : 0,
      requestedByName: pick(['Amal Saeed', 'System · Campaign']),
      error: status === 'DownloadFailed' ? 'HTTP 504 from firmware host after 2 retries' : null,
    });
  });
  return out;
})();

export const DIAGNOSTICS_JOBS: DiagnosticsJob[] = (() => {
  const out: DiagnosticsJob[] = [];
  const targets = STATIONS.filter((s) => s.state === 'Faulted' || s.state === 'Maintenance' || s.state === 'Offline');
  [...targets, ...STATIONS.slice(0, 4)].slice(0, 9).forEach((station, i) => {
    const status: DiagnosticsJob['status'] = i === 0 ? 'Uploading' : i === 1 ? 'UploadFailed' : 'Uploaded';
    const requestedAt = ago(int(1, 14) * DAY);
    out.push({
      id: `dg-${i}`,
      stationId: station.id,
      chargePointId: station.chargePointId,
      status,
      requestedAt,
      completedAt: status === 'Uploaded' ? new Date(new Date(requestedAt).getTime() + 7 * MIN).toISOString() : null,
      fileName: status === 'Uploaded' ? `${station.chargePointId}-diag-${requestedAt.slice(0, 10)}.tar.gz` : null,
      sizeKb: status === 'Uploaded' ? int(240, 8800) : null,
      fromTime: new Date(new Date(requestedAt).getTime() - 2 * DAY).toISOString(),
      toTime: requestedAt,
      requestedByName: pick(['Faisal Al Hammadi', 'Noura Al Suwaidi']),
    });
  });
  return out;
})();

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

export const ACTIVITY: ActivityEntry[] = (() => {
  const out: ActivityEntry[] = [];
  const actors = ['Amal Saeed', 'Faisal Al Hammadi', 'Noura Al Suwaidi', 'Rashid Al Marri'];
  let n = 0;
  const add = (subject: string, action: string, detail: string, tone: ActivityEntry['tone'], daysAgo: number) => {
    out.push({ id: `act-${n++}`, subject, action, detail, actorName: pick(actors), at: ago(daysAgo * DAY + int(0, 20) * HOUR), tone });
  };

  LOCATIONS.forEach((l, i) => {
    add(`location:${l.id}`, 'Location created', `${l.name} added to the network`, 'neutral', 320 - i * 28);
    add(`location:${l.id}`, 'EV charging enabled', 'EV Charging service switched on for this site', 'success', 318 - i * 28);
    if (i % 2 === 0) add(`location:${l.id}`, 'Tariff changed', 'Default tariff updated for the site', 'info', int(4, 40));
  });

  STATIONS.slice(0, 20).forEach((s, i) => {
    add(`station:${s.id}`, 'Station commissioned', `${s.code} accepted its first BootNotification`, 'success', int(20, 200));
    if (s.state === 'Faulted') add(`station:${s.id}`, 'Fault raised', 'Connector reported GroundFailure', 'danger', int(0, 3));
    if (s.state === 'Maintenance') add(`station:${s.id}`, 'Taken out of service', 'Moved to maintenance for cable replacement', 'warning', int(1, 6));
    if (i % 3 === 0) add(`station:${s.id}`, 'Configuration changed', 'HeartbeatInterval set to 300s', 'info', int(2, 60));
  });

  TARIFFS.forEach((t) => add(`tariff:${t.id}`, 'Tariff updated', `${t.name} pricing revised`, 'info', int(3, 60)));
  HARDWARE_PROFILES.forEach((p) => add(`profile:${p.id}`, 'Profile published', `${p.name} approved for rollout`, 'success', int(30, 240)));

  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
})();
