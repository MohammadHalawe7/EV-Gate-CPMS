/* =============================================================================
 * EV Gate CPMS — Network domain.
 *
 * The charging infrastructure hierarchy:
 *
 *   Location → Service → (EV Charging) → Charging Station → EVSE → Connector
 *
 * Two ideas carry most of the weight here and are worth stating plainly.
 *
 * 1. A HARDWARE PROFILE is not a CHARGING STATION.
 *    A profile is the *product* — "Alpitronic HYC300, 300 kW DC, two EVSEs,
 *    CCS2 + CHAdeMO". It is defined once and reused. A station is an *installed
 *    instance* of that product: a serial number bolted to a plinth at a
 *    location, with its own OCPP identity, firmware and live state. Creating a
 *    station from a profile generates its EVSEs and connectors automatically,
 *    so nobody hand-types a connector layout that the manufacturer already
 *    determined.
 *
 * 2. TARIFF AND PAYMENT RESOLVE BY INHERITANCE, they are not copied.
 *    A tariff is assigned once and inherited down the hierarchy; any level may
 *    override it. The same is true of payment policy, which belongs to the
 *    company by default and is overridden per site only where a site genuinely
 *    differs. `resolveTariff` and `resolvePayment` below are the single
 *    implementations of that walk — no screen re-implements it.
 *
 * Every reference value (country, city, service, amenity, connector type …)
 * resolves through the Configuration / Lookup layer in `src/data/lookups.ts`.
 * See CLAUDE.md: no business constant is hard-coded in a screen.
 * ========================================================================== */

export type ID = string;
export type ISODate = string;

/* ==========================================================================
 * Enumerations — OCPP vocabulary where one exists, so the prototype maps 1:1
 * onto a real CSMS later.
 * ======================================================================== */

export const OCPP_VERSIONS = ['1.6J', '2.0.1', '2.1'] as const;
export type OcppVersion = (typeof OCPP_VERSIONS)[number];

/** OCPP 1.6 StatusNotification.status, unified with 2.0.1 ConnectorStatus. */
export const CONNECTOR_STATUSES = [
  'Available',
  'Preparing',
  'Charging',
  'SuspendedEVSE',
  'SuspendedEV',
  'Finishing',
  'Reserved',
  'Unavailable',
  'Faulted',
] as const;
export type ConnectorStatus = (typeof CONNECTOR_STATUSES)[number];

/**
 * Station state. `Provisioning` is the commissioning gap most CPMS interfaces
 * skip: the record exists and the installer has the credentials, but the
 * charger has not yet sent its first BootNotification.
 */
export const STATION_STATES = [
  'Draft',
  'Provisioning',
  'Online',
  'Offline',
  'Faulted',
  'Maintenance',
  'Decommissioned',
] as const;
export type StationState = (typeof STATION_STATES)[number];

export const CONNECTOR_TYPES = [
  'Type2',
  'Type2Cable',
  'CCS2',
  'CHAdeMO',
  'GBT',
  'Type1',
  'Tesla',
  'Schuko',
] as const;
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export const POWER_TYPES = ['AC_1_PHASE', 'AC_3_PHASE', 'DC'] as const;
export type PowerType = (typeof POWER_TYPES)[number];

export const ENTITY_STATUSES = ['Active', 'Draft', 'Suspended', 'Archived'] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const LOCATION_TYPES = [
  'Public',
  'Retail',
  'Workplace',
  'Residential',
  'Fleet',
  'Hotel',
  'Highway',
  'Parking',
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const ACCESS_TYPES = ['Public', 'Restricted', 'Private'] as const;
export type AccessType = (typeof ACCESS_TYPES)[number];

/** How a driver may start a session. */
export const AUTH_METHODS = [
  'MobileApp',
  'RfidCard',
  'AdHocCard',
  'PlugAndCharge',
  'Anpr',
  'FreeVend',
] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

/** What the charger does when it cannot reach the CSMS. */
export const OFFLINE_BEHAVIOURS = ['Reject', 'AllowKnown', 'AllowAll'] as const;
export type OfflineBehaviour = (typeof OFFLINE_BEHAVIOURS)[number];

export const LOAD_BALANCING_MODES = ['Off', 'Static', 'Dynamic'] as const;
export type LoadBalancingMode = (typeof LOAD_BALANCING_MODES)[number];

export const PAYMENT_METHODS = ['Wallet', 'Card', 'RfidAccount', 'MobileApp', 'Invoice', 'Free'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const WALLET_KINDS = ['Platform', 'External', 'None'] as const;
export type WalletKind = (typeof WALLET_KINDS)[number];

export const TARIFF_TYPES = ['Energy', 'Time', 'Flat', 'Hybrid'] as const;
export type TariffType = (typeof TARIFF_TYPES)[number];

export const HARDWARE_CATEGORIES = ['AC', 'DC', 'Hybrid'] as const;
export type HardwareCategory = (typeof HARDWARE_CATEGORIES)[number];

/** OCPP 1.6 security profiles 0–3. */
export const SECURITY_PROFILES = [0, 1, 2, 3] as const;
export type SecurityProfile = (typeof SECURITY_PROFILES)[number];

export const OCPP_ACTIONS_OUT = [
  'RemoteStartTransaction',
  'RemoteStopTransaction',
  'Reset',
  'UnlockConnector',
  'ChangeAvailability',
  'ChangeConfiguration',
  'GetConfiguration',
  'ClearCache',
  'TriggerMessage',
  'ReserveNow',
  'CancelReservation',
  'SetChargingProfile',
  'ClearChargingProfile',
  'GetCompositeSchedule',
  'UpdateFirmware',
  'GetDiagnostics',
  'SendLocalList',
  'GetLocalListVersion',
  'DataTransfer',
] as const;
export type OcppOutboundAction = (typeof OCPP_ACTIONS_OUT)[number];

export const OCPP_ACTIONS_IN = [
  'BootNotification',
  'Heartbeat',
  'StatusNotification',
  'MeterValues',
  'StartTransaction',
  'StopTransaction',
  'Authorize',
  'DataTransfer',
  'DiagnosticsStatusNotification',
  'FirmwareStatusNotification',
] as const;
export type OcppInboundAction = (typeof OCPP_ACTIONS_IN)[number];

export type OcppAction = OcppInboundAction | OcppOutboundAction;

export const COMMAND_STATUSES = ['Queued', 'Sent', 'Accepted', 'Rejected', 'TimedOut', 'Failed'] as const;
export type CommandStatus = (typeof COMMAND_STATUSES)[number];

export const FIRMWARE_STATUSES = [
  'Idle',
  'Scheduled',
  'Downloading',
  'Downloaded',
  'Installing',
  'Installed',
  'DownloadFailed',
  'InstallationFailed',
] as const;
export type FirmwareStatus = (typeof FIRMWARE_STATUSES)[number];

export const DIAGNOSTICS_STATUSES = ['Idle', 'Uploading', 'Uploaded', 'UploadFailed'] as const;
export type DiagnosticsStatus = (typeof DIAGNOSTICS_STATUSES)[number];

export const CHARGING_PROFILE_PURPOSES = [
  'ChargePointMaxProfile',
  'TxDefaultProfile',
  'TxProfile',
] as const;
export type ChargingProfilePurpose = (typeof CHARGING_PROFILE_PURPOSES)[number];

export const CHARGING_RATE_UNITS = ['W', 'A'] as const;
export type ChargingRateUnit = (typeof CHARGING_RATE_UNITS)[number];

/* ==========================================================================
 * Location
 * ======================================================================== */

export interface DayWindow {
  /** 0 = Sunday, matching `Date.getDay()`. */
  day: number;
  open: boolean;
  from: string;
  to: string;
}

export interface OpeningHours {
  twentyFourSeven: boolean;
  windows: DayWindow[];
}

export interface Location {
  id: ID;
  companyId: ID;
  tenantId: ID;
  /** Human reference — EVG-LOC-0001. */
  code: string;
  name: string;
  nameAr: string;
  type: LocationType;
  status: EntityStatus;
  address: string;
  addressAr: string;
  /** Lookup ids — see src/data/lookups.ts. */
  countryId: string;
  cityId: string;
  lat: number;
  lng: number;
  parkingSpaces: number;
  /** Lookup ids from `amenities`. */
  amenityIds: string[];
  openingHours: OpeningHours;
  accessType: AccessType;
  /** The grid connection at the site. Caps everything installed beneath it. */
  gridCapacityKw: number;
  siteContactName: string;
  siteContactPhone: string;
  siteContactEmail: string;
  notes: string;
  /** Deterministic hue for the location avatar — no image store in the mock. */
  imageHue: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/**
 * A service switched on at a location. `serviceId` is a lookup id from the
 * `services` registry, so the set of offerable services is configuration.
 */
export interface LocationService {
  id: ID;
  locationId: ID;
  serviceId: string;
  status: EntityStatus;
  enabledAt: ISODate;
  /** Present only for the EV charging service. */
  evCharging?: EvChargingServiceConfig;
}

export interface EvChargingServiceConfig {
  /** `null` means inherit the company default. */
  defaultTariffId: ID | null;
  /** `null` means inherit the company payment policy. */
  payment: PaymentPolicy | null;
  /** Site-wide ceiling for load management. Must not exceed grid capacity. */
  siteLoadLimitKw: number;
  /** Listed in the driver app and on roaming platforms. */
  publicListing: boolean;
  roamingEnabled: boolean;
  supportPhone: string;
}

/* ==========================================================================
 * Payment policy
 *
 * Commercial policy, not hardware configuration. It lives on the company and
 * is overridden per site only where a site genuinely differs — a workplace
 * car park that is free to staff, say, beside a retail site that takes cards.
 * It is deliberately NOT a charger-level setting: repeating it per charger is
 * how operators end up with sites that price inconsistently.
 * ======================================================================== */

export interface TopUpPolicy {
  enabled: boolean;
  minimumTopUp: number;
  suggestedAmounts: number[];
  autoTopUpEnabled: boolean;
  autoTopUpThreshold: number;
  autoTopUpAmount: number;
}

export interface PaymentPolicy {
  methods: PaymentMethod[];
  wallet: WalletKind;
  externalWalletProvider: string;
  topUp: TopUpPolicy;
  /** A driver below this cannot start a session on wallet. */
  minimumWalletBalance: number;
  /** Cards are not charged below this; the difference goes to the wallet. */
  minimumCardPayment: number;
  /** Held on the card at session start. */
  preAuthorisationAmount: number;
  currency: string;
}

/* ==========================================================================
 * Hardware profile — the reusable product definition
 * ======================================================================== */

export interface ConnectorTemplate {
  type: ConnectorType;
  powerType: PowerType;
  maxPowerKw: number;
  maxAmperage: number;
  voltage: number;
  cableAttached: boolean;
}

export interface EvseTemplate {
  ordinal: number;
  maxPowerKw: number;
  powerType: PowerType;
  connectors: ConnectorTemplate[];
}

export interface HardwareCapabilities {
  smartCharging: boolean;
  reservation: boolean;
  plugAndCharge: boolean;
  rfidReader: boolean;
  anpr: boolean;
  display: boolean;
  loadBalancing: boolean;
  offlineCharging: boolean;
  certifiedMeter: boolean;
  paymentTerminal: boolean;
}

export interface HardwareProfile {
  id: ID;
  code: string;
  name: string;
  nameAr: string;
  manufacturer: string;
  model: string;
  category: HardwareCategory;
  maxPowerKw: number;
  /** The connector layout every station built from this profile receives. */
  evses: EvseTemplate[];
  ocppVersions: OcppVersion[];
  capabilities: HardwareCapabilities;
  countryOfManufacture: string;
  yearOfManufacture: number;
  ingressProtection: string;
  operatingTempMinC: number;
  operatingTempMaxC: number;
  certifications: string[];
  status: EntityStatus;
  notes: string;
  createdAt: ISODate;
}

/** Total connectors a profile yields — shown wherever a profile is chosen. */
export function profileConnectorCount(profile: HardwareProfile): number {
  return profile.evses.reduce((n, e) => n + e.connectors.length, 0);
}

export function profileConnectorTypes(profile: HardwareProfile): ConnectorType[] {
  const seen = new Set<ConnectorType>();
  for (const evse of profile.evses) for (const c of evse.connectors) seen.add(c.type);
  return [...seen];
}

/* ==========================================================================
 * Charging station — an installed instance
 * ======================================================================== */

export interface StationAccessConfig {
  visibility: AccessType;
  roamingEnabled: boolean;
  authMethods: AuthMethod[];
  reservationEnabled: boolean;
  reservationMaxMinutes: number;
}

export interface StationPolicyConfig {
  offlineBehaviour: OfflineBehaviour;
  /** `0` means no limit. */
  maxSessionMinutes: number;
  maxSessionKwh: number;
  maxSessionCost: number;
  /** Minutes of occupancy after a session completes before overstay applies. */
  idleGraceMinutes: number;
  stopOnFullCharge: boolean;
  allowSimultaneousCharging: boolean;
}

export interface StationSmartConfig {
  enabled: boolean;
  maxCurrentA: number;
  loadBalancing: LoadBalancingMode;
  /** 0 = lowest. Used when the site budget is contended. */
  priority: number;
}

export interface StationOcppConfig {
  endpointUrl: string;
  securityProfile: SecurityProfile;
  hasCredentials: boolean;
  heartbeatIntervalSec: number;
  connectionTimeoutSec: number;
  meterValueIntervalSec: number;
  resetRetries: number;
  allowUnknownChargePoint: boolean;
}

export interface StationConfig {
  access: StationAccessConfig;
  policy: StationPolicyConfig;
  smart: StationSmartConfig;
  ocpp: StationOcppConfig;
}

export interface ChargingStation {
  id: ID;
  locationId: ID;
  /** The EV charging service this station belongs to. */
  serviceId: ID;
  companyId: ID;
  tenantId: ID;
  code: string;
  name: string;
  nameAr: string;
  hardwareProfileId: ID;
  serialNumber: string;
  /** The OCPP identity used in the websocket URL. Immutable once connected. */
  chargePointId: string;
  ocppVersion: OcppVersion;
  firmwareVersion: string;
  state: StationState;
  config: StationConfig;
  /** `null` inherits from the location's EV charging service. */
  tariffId: ID | null;
  installedAt: ISODate;
  warrantyEndsAt: ISODate;
  commissionedAt: ISODate | null;
  lastBootAt: ISODate | null;
  lastHeartbeatAt: ISODate | null;
  networkSignalPct: number;
  uptimePct: number;
  notes: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Evse {
  id: ID;
  stationId: ID;
  locationId: ID;
  /** eMI3 identifier — AE*EVG*E000123*1. */
  evseCode: string;
  ordinal: number;
  maxPowerKw: number;
  powerType: PowerType;
  status: ConnectorStatus;
  /** `null` inherits from the station. */
  tariffId: ID | null;
  createdAt: ISODate;
}

export interface Connector {
  id: ID;
  evseId: ID;
  stationId: ID;
  locationId: ID;
  /** The OCPP connectorId — 1-based within the station. */
  connectorNumber: number;
  type: ConnectorType;
  powerType: PowerType;
  maxPowerKw: number;
  maxAmperage: number;
  voltage: number;
  cableAttached: boolean;
  status: ConnectorStatus;
  errorCode: string | null;
  lastStatusAt: ISODate;
  /** `null` inherits from the EVSE. */
  tariffId: ID | null;
  lifetimeKwh: number;
  lifetimeSessions: number;
}

/* ==========================================================================
 * Tariff
 * ======================================================================== */

export interface TariffWindow {
  id: ID;
  label: string;
  /** 0 = Sunday. */
  days: number[];
  fromHour: number;
  toHour: number;
  pricePerKwh: number;
  pricePerMinute: number;
}

export interface TariffFees {
  /** Charged once per session. */
  sessionFee: number;
  /** Per minute, after the idle grace period, while still plugged in. */
  idleFeePerMinute: number;
  idleGraceMinutes: number;
  idleFeeCap: number;
  reservationFee: number;
  rebookingFee: number;
  cancellationFee: number;
  cancellationGraceMinutes: number;
  noShowFee: number;
  minimumCharge: number;
}

export interface Tariff {
  id: ID;
  companyId: ID;
  tenantId: ID;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  type: TariffType;
  status: EntityStatus;
  currency: string;
  /** The rate used outside every defined window. */
  basePricePerKwh: number;
  basePricePerMinute: number;
  fees: TariffFees;
  /** When true the base rate applies at all times and `windows` is ignored. */
  twentyFourSeven: boolean;
  windows: TariffWindow[];
  appliesTo: 'AC' | 'DC' | 'All';
  vatPct: number;
  validFrom: ISODate;
  validTo: ISODate | null;
  /** Exactly one tariff per company carries this. */
  isCompanyDefault: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ==========================================================================
 * OCPP
 * ======================================================================== */

export interface OcppMessage {
  id: ID;
  stationId: ID;
  chargePointId: string;
  direction: 'IN' | 'OUT';
  /** OCPP message type: 2 = CALL, 3 = CALLRESULT, 4 = CALLERROR. */
  messageType: 2 | 3 | 4;
  action: OcppAction;
  uniqueId: string;
  payload: Record<string, unknown>;
  ocppVersion: OcppVersion;
  at: ISODate;
  latencyMs: number | null;
  ok: boolean;
}

export interface OcppCommand {
  id: ID;
  stationId: ID;
  chargePointId: string;
  action: OcppOutboundAction;
  payload: Record<string, unknown>;
  status: CommandStatus;
  response: Record<string, unknown> | null;
  requestedByName: string;
  createdAt: ISODate;
  completedAt: ISODate | null;
  durationMs: number | null;
  error: string | null;
}

export interface ConfigurationKey {
  id: ID;
  stationId: ID;
  key: string;
  value: string;
  readonly: boolean;
  unit: string;
  description: string;
  /** Lookup id from `ocppConfigGroups` — sections the key list. */
  group: string;
  updatedAt: ISODate;
}

export interface ChargingProfile {
  id: ID;
  /** Exactly one of these is set — the scope the profile is bound to. */
  stationId: ID | null;
  locationId: ID | null;
  name: string;
  profileId: number;
  stackLevel: number;
  purpose: ChargingProfilePurpose;
  kind: 'Absolute' | 'Recurring' | 'Relative';
  recurrency: 'Daily' | 'Weekly' | null;
  chargingRateUnit: ChargingRateUnit;
  validFrom: ISODate;
  validTo: ISODate | null;
  periods: { startSec: number; limit: number; numberPhases: number }[];
  status: EntityStatus;
  createdAt: ISODate;
}

export interface FirmwareJob {
  id: ID;
  stationId: ID;
  chargePointId: string;
  fromVersion: string;
  toVersion: string;
  status: FirmwareStatus;
  scheduledAt: ISODate;
  startedAt: ISODate | null;
  completedAt: ISODate | null;
  progressPct: number;
  retries: number;
  requestedByName: string;
  error: string | null;
}

export interface DiagnosticsJob {
  id: ID;
  stationId: ID;
  chargePointId: string;
  status: DiagnosticsStatus;
  requestedAt: ISODate;
  completedAt: ISODate | null;
  fileName: string | null;
  sizeKb: number | null;
  fromTime: ISODate;
  toTime: ISODate;
  requestedByName: string;
}

/* ==========================================================================
 * Activity — one timeline per entity, so "what changed" is always answerable
 * ======================================================================== */

export interface ActivityEntry {
  id: ID;
  /** `location:<id>`, `station:<id>`, `tariff:<id>` … */
  subject: string;
  action: string;
  detail: string;
  actorName: string;
  at: ISODate;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

/* ==========================================================================
 * Inheritance resolution
 *
 * The one implementation of the walk. Screens call these rather than guessing,
 * which is what keeps "where did this price come from?" answerable.
 * ======================================================================== */

export type TariffSource = 'connector' | 'evse' | 'station' | 'location' | 'company' | 'none';

export interface ResolvedTariff {
  tariffId: ID | null;
  /** The level that supplied the value — rendered as "Inherited from …". */
  source: TariffSource;
}

export function resolveTariff(input: {
  connector?: Pick<Connector, 'tariffId'> | null;
  evse?: Pick<Evse, 'tariffId'> | null;
  station?: Pick<ChargingStation, 'tariffId'> | null;
  service?: Pick<EvChargingServiceConfig, 'defaultTariffId'> | null;
  companyDefaultTariffId?: ID | null;
}): ResolvedTariff {
  if (input.connector?.tariffId) return { tariffId: input.connector.tariffId, source: 'connector' };
  if (input.evse?.tariffId) return { tariffId: input.evse.tariffId, source: 'evse' };
  if (input.station?.tariffId) return { tariffId: input.station.tariffId, source: 'station' };
  if (input.service?.defaultTariffId) return { tariffId: input.service.defaultTariffId, source: 'location' };
  if (input.companyDefaultTariffId) return { tariffId: input.companyDefaultTariffId, source: 'company' };
  return { tariffId: null, source: 'none' };
}

export type PaymentSource = 'location' | 'company';

export interface ResolvedPayment {
  policy: PaymentPolicy;
  source: PaymentSource;
}

export function resolvePayment(
  servicePolicy: PaymentPolicy | null | undefined,
  companyPolicy: PaymentPolicy,
): ResolvedPayment {
  return servicePolicy
    ? { policy: servicePolicy, source: 'location' }
    : { policy: companyPolicy, source: 'company' };
}

/* ==========================================================================
 * Derived helpers
 * ======================================================================== */

/** Connector statuses that mean the connector is earning. */
export const BUSY_STATUSES: ConnectorStatus[] = ['Charging', 'SuspendedEV', 'SuspendedEVSE', 'Finishing'];

/** Connector statuses that need somebody's attention. */
export const ATTENTION_STATUSES: ConnectorStatus[] = ['Faulted', 'Unavailable'];

export function isStationLive(state: StationState): boolean {
  return state === 'Online' || state === 'Faulted';
}

/** Installed power beneath a location — compared against grid capacity. */
export function installedPowerKw(stations: Pick<ChargingStation, 'id'>[], evses: Evse[]): number {
  const ids = new Set(stations.map((s) => s.id));
  return evses.filter((e) => ids.has(e.stationId)).reduce((n, e) => n + e.maxPowerKw, 0);
}

/** A location is oversubscribed when installed power exceeds the grid feed. */
export function loadHeadroom(gridCapacityKw: number, installedKw: number) {
  const usedPct = gridCapacityKw > 0 ? (installedKw / gridCapacityKw) * 100 : 0;
  return {
    usedPct: Math.round(usedPct),
    overSubscribed: installedKw > gridCapacityKw,
    headroomKw: Math.round((gridCapacityKw - installedKw) * 10) / 10,
  };
}

export const EV_CHARGING_SERVICE_ID = 'ev-charging';
