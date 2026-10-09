/* =============================================================================
 * EV Gate CPMS — network store.
 *
 * A small observable over the seeded dataset, read through `useSyncExternal-
 * Store`. No backend: every mutation is local and synchronous, which is what
 * makes the prototype feel like a product rather than a slideshow.
 *
 * When the API arrives this file is the seam — the action signatures below are
 * the contract, and only their bodies change.
 * ========================================================================== */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  type ActivityEntry,
  type ChargingProfile,
  type ChargingStation,
  type ConfigurationKey,
  type Connector,
  type ConnectorStatus,
  type DiagnosticsJob,
  type EvChargingServiceConfig,
  type Evse,
  type FirmwareJob,
  type HardwareProfile,
  type Location,
  type LocationService,
  type OcppCommand,
  type OcppMessage,
  type OcppOutboundAction,
  type PaymentPolicy,
  type StationConfig,
  type StationState,
  type Tariff,
  EV_CHARGING_SERVICE_ID,
  resolvePayment,
  resolveTariff,
} from '@/domain/network';
import {
  ACTIVITY,
  CHARGING_PROFILES,
  COMPANY_ID,
  COMPANY_PAYMENT_POLICY,
  CONFIGURATION_KEYS,
  CONNECTORS,
  DIAGNOSTICS_JOBS,
  EVSES,
  FIRMWARE_JOBS,
  HARDWARE_PROFILES,
  LOCATIONS,
  LOCATION_SERVICES,
  OCPP_COMMANDS,
  OCPP_MESSAGES,
  STATIONS,
  TARIFFS,
  TENANT_ID,
  defaultStationConfig,
  materialiseHardware,
} from './networkSeed';
import { nowIso, uid } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* State                                                                       */
/* -------------------------------------------------------------------------- */

export interface NetworkState {
  companyPayment: PaymentPolicy;
  locations: Location[];
  services: LocationService[];
  profiles: HardwareProfile[];
  stations: ChargingStation[];
  evses: Evse[];
  connectors: Connector[];
  tariffs: Tariff[];
  messages: OcppMessage[];
  commands: OcppCommand[];
  configKeys: ConfigurationKey[];
  chargingProfiles: ChargingProfile[];
  firmwareJobs: FirmwareJob[];
  diagnosticsJobs: DiagnosticsJob[];
  activity: ActivityEntry[];
}

let state: NetworkState = {
  companyPayment: COMPANY_PAYMENT_POLICY,
  locations: LOCATIONS,
  services: LOCATION_SERVICES,
  profiles: HARDWARE_PROFILES,
  stations: STATIONS,
  evses: EVSES,
  connectors: CONNECTORS,
  tariffs: TARIFFS,
  messages: OCPP_MESSAGES,
  commands: OCPP_COMMANDS,
  configKeys: CONFIGURATION_KEYS,
  chargingProfiles: CHARGING_PROFILES,
  firmwareJobs: FIRMWARE_JOBS,
  diagnosticsJobs: DIAGNOSTICS_JOBS,
  activity: ACTIVITY,
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function set(patch: Partial<NetworkState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Reads the whole network. Components usually want a narrower hook below. */
export function useNetwork(): NetworkState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* -------------------------------------------------------------------------- */
/* Activity helper                                                             */
/* -------------------------------------------------------------------------- */

function logActivity(
  subject: string,
  action: string,
  detail: string,
  tone: ActivityEntry['tone'] = 'neutral',
  actorName = 'You',
) {
  const entry: ActivityEntry = { id: uid('act'), subject, action, detail, actorName, at: nowIso(), tone };
  state = { ...state, activity: [entry, ...state.activity] };
}

function nextCode(prefix: string, existing: { code: string }[]): string {
  const max = existing.reduce((n, item) => {
    const digits = Number(item.code.replace(/\D/g, ''));
    return Number.isFinite(digits) && digits > n ? digits : n;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

/* ==========================================================================
 * Locations
 * ======================================================================== */

export type LocationDraft = Omit<
  Location,
  'id' | 'code' | 'companyId' | 'tenantId' | 'createdAt' | 'updatedAt' | 'imageHue'
>;

export const networkActions = {
  createLocation(draft: LocationDraft): Location {
    const location: Location = {
      ...draft,
      id: uid('loc'),
      code: nextCode('EVG-LOC', state.locations),
      companyId: COMPANY_ID,
      tenantId: TENANT_ID,
      imageHue: Math.floor(Math.random() * 360),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    logActivity(`location:${location.id}`, 'Location created', `${location.name} added to the network`, 'success');
    set({ locations: [location, ...state.locations] });
    return location;
  },

  updateLocation(id: string, patch: Partial<Location>) {
    logActivity(`location:${id}`, 'Location updated', 'Site details changed', 'info');
    set({
      locations: state.locations.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: nowIso() } : l)),
    });
  },

  setLocationStatus(id: string, status: Location['status']) {
    const label = status === 'Archived' ? 'Location archived' : `Location set to ${status}`;
    logActivity(`location:${id}`, label, '', status === 'Archived' ? 'warning' : 'info');
    set({ locations: state.locations.map((l) => (l.id === id ? { ...l, status, updatedAt: nowIso() } : l)) });
  },

  /* ---- Services --------------------------------------------------------- */

  enableService(locationId: string, serviceId: string, evCharging?: EvChargingServiceConfig): LocationService {
    const service: LocationService = {
      id: uid('svc'),
      locationId,
      serviceId,
      status: 'Active',
      enabledAt: nowIso(),
      evCharging: serviceId === EV_CHARGING_SERVICE_ID ? (evCharging ?? defaultEvChargingConfig()) : undefined,
    };
    logActivity(`location:${locationId}`, 'Service enabled', `${serviceId} switched on`, 'success');
    set({ services: [...state.services, service] });
    return service;
  },

  updateService(id: string, patch: Partial<LocationService>) {
    const service = state.services.find((s) => s.id === id);
    if (service) logActivity(`location:${service.locationId}`, 'Service updated', 'Service configuration changed', 'info');
    set({ services: state.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  },

  updateEvChargingConfig(serviceId: string, patch: Partial<EvChargingServiceConfig>) {
    const service = state.services.find((s) => s.id === serviceId);
    if (service) logActivity(`location:${service.locationId}`, 'EV charging updated', 'Service settings changed', 'info');
    set({
      services: state.services.map((s) =>
        s.id === serviceId && s.evCharging ? { ...s, evCharging: { ...s.evCharging, ...patch } } : s,
      ),
    });
  },

  disableService(id: string) {
    const service = state.services.find((s) => s.id === id);
    if (service) logActivity(`location:${service.locationId}`, 'Service suspended', `${service.serviceId} switched off`, 'warning');
    set({ services: state.services.map((s) => (s.id === id ? { ...s, status: 'Suspended' } : s)) });
  },

  removeService(id: string) {
    set({ services: state.services.filter((s) => s.id !== id) });
  },

  /* ---- Hardware profiles ------------------------------------------------ */

  createProfile(draft: Omit<HardwareProfile, 'id' | 'code' | 'createdAt'>): HardwareProfile {
    const profile: HardwareProfile = {
      ...draft,
      id: uid('hwp'),
      code: nextCode('HWP', state.profiles),
      createdAt: nowIso(),
    };
    logActivity(`profile:${profile.id}`, 'Profile created', `${profile.name} added to the catalogue`, 'success');
    set({ profiles: [profile, ...state.profiles] });
    return profile;
  },

  updateProfile(id: string, patch: Partial<HardwareProfile>) {
    logActivity(`profile:${id}`, 'Profile updated', 'Hardware definition changed', 'info');
    set({ profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  duplicateProfile(id: string): HardwareProfile | undefined {
    const source = state.profiles.find((p) => p.id === id);
    if (!source) return undefined;
    return networkActions.createProfile({
      ...source,
      name: `${source.name} (copy)`,
      nameAr: `${source.nameAr} (نسخة)`,
      status: 'Draft',
    });
  },

  /* ---- Stations --------------------------------------------------------- */

  /**
   * Commissioning. The EVSEs and connectors come from the hardware profile —
   * nobody types a connector layout the manufacturer already decided.
   */
  commissionStation(input: {
    locationId: string;
    serviceId: string;
    hardwareProfileId: string;
    name: string;
    nameAr: string;
    serialNumber: string;
    chargePointId: string;
    ocppVersion: ChargingStation['ocppVersion'];
    firmwareVersion: string;
    installedAt: string;
    warrantyEndsAt: string;
    tariffId: string | null;
    notes: string;
    config?: Partial<StationConfig>;
  }): ChargingStation {
    const profile = state.profiles.find((p) => p.id === input.hardwareProfileId)!;
    const id = uid('stn');
    const code = nextCode('EVG-CS', state.stations);
    const at = nowIso();

    const station: ChargingStation = {
      id,
      locationId: input.locationId,
      serviceId: input.serviceId,
      companyId: COMPANY_ID,
      tenantId: TENANT_ID,
      code,
      name: input.name,
      nameAr: input.nameAr,
      hardwareProfileId: profile.id,
      serialNumber: input.serialNumber,
      chargePointId: input.chargePointId,
      ocppVersion: input.ocppVersion,
      firmwareVersion: input.firmwareVersion,
      /* A new station waits for its first BootNotification before it is live. */
      state: 'Provisioning',
      config: { ...defaultStationConfig(profile), ...input.config },
      tariffId: input.tariffId,
      installedAt: input.installedAt,
      warrantyEndsAt: input.warrantyEndsAt,
      commissionedAt: null,
      lastBootAt: null,
      lastHeartbeatAt: null,
      networkSignalPct: 0,
      uptimePct: 0,
      notes: input.notes,
      createdAt: at,
      updatedAt: at,
    };

    const hw = materialiseHardware(station, profile, at);
    hw.connectors.forEach((c) => { c.status = 'Unavailable'; });
    hw.evses.forEach((e) => { e.status = 'Unavailable'; });

    const keys: ConfigurationKey[] = state.configKeys
      .filter((k) => k.stationId === state.stations[0]?.id)
      .map((k, i) => ({ ...k, id: `${id}-cfg-${i}`, stationId: id, updatedAt: at }));

    logActivity(`station:${id}`, 'Station registered', `${code} awaiting first connection`, 'info');
    logActivity(`location:${input.locationId}`, 'Station added', `${input.name} registered at this site`, 'success');

    set({
      stations: [station, ...state.stations],
      evses: [...state.evses, ...hw.evses],
      connectors: [...state.connectors, ...hw.connectors],
      configKeys: [...state.configKeys, ...keys],
    });
    return station;
  },

  updateStation(id: string, patch: Partial<ChargingStation>) {
    logActivity(`station:${id}`, 'Station updated', 'Station details changed', 'info');
    set({ stations: state.stations.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: nowIso() } : s)) });
  },

  updateStationConfig(id: string, patch: Partial<StationConfig>) {
    logActivity(`station:${id}`, 'Configuration changed', 'Operational settings updated', 'info');
    set({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, ...patch }, updatedAt: nowIso() } : s,
      ),
    });
  },

  setStationState(id: string, next: StationState) {
    const station = state.stations.find((s) => s.id === id);
    const tone = next === 'Online' ? 'success' : next === 'Faulted' ? 'danger' : next === 'Maintenance' ? 'warning' : 'neutral';
    logActivity(`station:${id}`, `Moved to ${next}`, station ? station.code : '', tone);

    /* Taking a station out of service takes its connectors with it. */
    const unavailable = next === 'Maintenance' || next === 'Offline' || next === 'Decommissioned';
    set({
      stations: state.stations.map((s) =>
        s.id === id
          ? {
              ...s,
              state: next,
              commissionedAt: next === 'Online' && !s.commissionedAt ? nowIso() : s.commissionedAt,
              lastBootAt: next === 'Online' && !s.lastBootAt ? nowIso() : s.lastBootAt,
              lastHeartbeatAt: next === 'Online' ? nowIso() : s.lastHeartbeatAt,
              networkSignalPct: next === 'Online' ? Math.max(s.networkSignalPct, 72) : s.networkSignalPct,
              updatedAt: nowIso(),
            }
          : s,
      ),
      connectors: state.connectors.map((c) =>
        c.stationId === id
          ? { ...c, status: unavailable ? 'Unavailable' : c.status === 'Unavailable' ? 'Available' : c.status, lastStatusAt: nowIso() }
          : c,
      ),
      evses: state.evses.map((e) =>
        e.stationId === id ? { ...e, status: unavailable ? 'Unavailable' : e.status === 'Unavailable' ? 'Available' : e.status } : e,
      ),
    });
  },

  /** Simulates the charge point connecting for the first time. */
  simulateBoot(id: string) {
    const station = state.stations.find((s) => s.id === id);
    if (!station) return;
    const at = nowIso();
    const message: OcppMessage = {
      id: uid('msg'),
      stationId: id,
      chargePointId: station.chargePointId,
      direction: 'IN',
      messageType: 2,
      action: 'BootNotification',
      uniqueId: String(Math.floor(Math.random() * 9000000 + 1000000)),
      payload: { chargePointVendor: 'EVGate', chargePointModel: station.name, firmwareVersion: station.firmwareVersion },
      ocppVersion: station.ocppVersion,
      at,
      latencyMs: null,
      ok: true,
    };
    logActivity(`station:${id}`, 'Station commissioned', `${station.code} accepted its first BootNotification`, 'success');
    set({
      messages: [message, ...state.messages],
      stations: state.stations.map((s) =>
        s.id === id
          ? { ...s, state: 'Online', commissionedAt: at, lastBootAt: at, lastHeartbeatAt: at, networkSignalPct: 86, uptimePct: 100, updatedAt: at }
          : s,
      ),
      connectors: state.connectors.map((c) => (c.stationId === id ? { ...c, status: 'Available', lastStatusAt: at } : c)),
      evses: state.evses.map((e) => (e.stationId === id ? { ...e, status: 'Available' } : e)),
    });
  },

  removeStation(id: string) {
    const station = state.stations.find((s) => s.id === id);
    if (station) logActivity(`location:${station.locationId}`, 'Station removed', station.code, 'warning');
    set({
      stations: state.stations.filter((s) => s.id !== id),
      evses: state.evses.filter((e) => e.stationId !== id),
      connectors: state.connectors.filter((c) => c.stationId !== id),
      configKeys: state.configKeys.filter((k) => k.stationId !== id),
    });
  },

  /* ---- EVSEs and connectors --------------------------------------------- */

  updateEvse(id: string, patch: Partial<Evse>) {
    set({ evses: state.evses.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  },

  updateConnector(id: string, patch: Partial<Connector>) {
    set({ connectors: state.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },

  setConnectorStatus(id: string, status: ConnectorStatus) {
    const connector = state.connectors.find((c) => c.id === id);
    if (connector) {
      logActivity(
        `station:${connector.stationId}`,
        `Connector ${connector.connectorNumber} → ${status}`,
        '',
        status === 'Faulted' ? 'danger' : status === 'Available' ? 'success' : 'info',
      );
    }
    set({
      connectors: state.connectors.map((c) =>
        c.id === id
          ? { ...c, status, errorCode: status === 'Faulted' ? (c.errorCode ?? 'OtherError') : null, lastStatusAt: nowIso() }
          : c,
      ),
    });
  },

  /* ---- Tariffs ----------------------------------------------------------- */

  createTariff(draft: Omit<Tariff, 'id' | 'code' | 'companyId' | 'tenantId' | 'createdAt' | 'updatedAt'>): Tariff {
    const tariff: Tariff = {
      ...draft,
      id: uid('trf'),
      code: nextCode('TRF', state.tariffs),
      companyId: COMPANY_ID,
      tenantId: TENANT_ID,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    logActivity(`tariff:${tariff.id}`, 'Tariff created', tariff.name, 'success');
    set({ tariffs: [tariff, ...state.tariffs] });
    return tariff;
  },

  updateTariff(id: string, patch: Partial<Tariff>) {
    logActivity(`tariff:${id}`, 'Tariff updated', 'Pricing changed', 'info');
    set({ tariffs: state.tariffs.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)) });
  },

  duplicateTariff(id: string): Tariff | undefined {
    const source = state.tariffs.find((t) => t.id === id);
    if (!source) return undefined;
    return networkActions.createTariff({
      ...source,
      name: `${source.name} (copy)`,
      nameAr: `${source.nameAr} (نسخة)`,
      status: 'Draft',
      isCompanyDefault: false,
    });
  },

  /** Exactly one company default — setting a new one clears the old. */
  setDefaultTariff(id: string) {
    logActivity(`tariff:${id}`, 'Set as company default', '', 'success');
    set({ tariffs: state.tariffs.map((t) => ({ ...t, isCompanyDefault: t.id === id })) });
  },

  setTariffStatus(id: string, status: Tariff['status']) {
    set({ tariffs: state.tariffs.map((t) => (t.id === id ? { ...t, status, updatedAt: nowIso() } : t)) });
  },

  /** Bulk assignment — the reason tariffs are reusable in the first place. */
  assignTariff(scope: 'station' | 'evse' | 'connector', ids: string[], tariffId: string | null) {
    const set_ = new Set(ids);
    if (scope === 'station') {
      set({ stations: state.stations.map((s) => (set_.has(s.id) ? { ...s, tariffId, updatedAt: nowIso() } : s)) });
    } else if (scope === 'evse') {
      set({ evses: state.evses.map((e) => (set_.has(e.id) ? { ...e, tariffId } : e)) });
    } else {
      set({ connectors: state.connectors.map((c) => (set_.has(c.id) ? { ...c, tariffId } : c)) });
    }
  },

  /* ---- Payment ----------------------------------------------------------- */

  updateCompanyPayment(patch: Partial<PaymentPolicy>) {
    set({ companyPayment: { ...state.companyPayment, ...patch } });
  },

  /* ---- OCPP -------------------------------------------------------------- */

  sendCommand(stationId: string, action: OcppOutboundAction, payload: Record<string, unknown>, actor = 'You'): OcppCommand {
    const station = state.stations.find((s) => s.id === stationId)!;
    const createdAt = nowIso();
    const command: OcppCommand = {
      id: uid('cmd'),
      stationId,
      chargePointId: station.chargePointId,
      action,
      payload,
      status: 'Queued',
      response: null,
      requestedByName: actor,
      createdAt,
      completedAt: null,
      durationMs: null,
      error: null,
    };

    const message: OcppMessage = {
      id: uid('msg'),
      stationId,
      chargePointId: station.chargePointId,
      direction: 'OUT',
      messageType: 2,
      action,
      uniqueId: String(Math.floor(Math.random() * 9000000 + 1000000)),
      payload,
      ocppVersion: station.ocppVersion,
      at: createdAt,
      latencyMs: null,
      ok: true,
    };

    logActivity(`station:${stationId}`, `Command sent · ${action}`, station.code, 'info', actor);
    set({ commands: [command, ...state.commands], messages: [message, ...state.messages] });

    /* The charge point answers a moment later — offline stations time out. */
    const offline = station.state !== 'Online' && station.state !== 'Faulted';
    window.setTimeout(() => {
      const accepted = !offline;
      const at = nowIso();
      set({
        commands: state.commands.map((c) =>
          c.id === command.id
            ? {
                ...c,
                status: accepted ? 'Accepted' : 'TimedOut',
                response: accepted ? { status: 'Accepted' } : null,
                completedAt: at,
                durationMs: accepted ? 420 + Math.floor(Math.random() * 900) : 30000,
                error: accepted ? null : 'No CALLRESULT within 30s',
              }
            : c,
        ),
        messages: accepted
          ? [
              {
                ...message,
                id: uid('msg'),
                direction: 'IN' as const,
                messageType: 3 as const,
                payload: { status: 'Accepted' },
                at,
                latencyMs: 420 + Math.floor(Math.random() * 900),
              },
              ...state.messages,
            ]
          : state.messages,
      });
    }, 1400);

    return command;
  },

  updateConfigKey(id: string, value: string) {
    const key = state.configKeys.find((k) => k.id === id);
    if (key) logActivity(`station:${key.stationId}`, 'Configuration changed', `${key.key} set to ${value}`, 'info');
    set({ configKeys: state.configKeys.map((k) => (k.id === id ? { ...k, value, updatedAt: nowIso() } : k)) });
  },

  createChargingProfile(draft: Omit<ChargingProfile, 'id' | 'createdAt'>): ChargingProfile {
    const profile: ChargingProfile = { ...draft, id: uid('chp'), createdAt: nowIso() };
    set({ chargingProfiles: [profile, ...state.chargingProfiles] });
    return profile;
  },

  updateChargingProfile(id: string, patch: Partial<ChargingProfile>) {
    set({ chargingProfiles: state.chargingProfiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  removeChargingProfile(id: string) {
    set({ chargingProfiles: state.chargingProfiles.filter((p) => p.id !== id) });
  },

  scheduleFirmware(stationIds: string[], toVersion: string, scheduledAt: string, actor = 'You') {
    const jobs: FirmwareJob[] = stationIds.map((stationId) => {
      const station = state.stations.find((s) => s.id === stationId)!;
      return {
        id: uid('fw'),
        stationId,
        chargePointId: station.chargePointId,
        fromVersion: station.firmwareVersion,
        toVersion,
        status: 'Scheduled',
        scheduledAt,
        startedAt: null,
        completedAt: null,
        progressPct: 0,
        retries: 0,
        requestedByName: actor,
        error: null,
      };
    });
    logActivity('network', 'Firmware campaign scheduled', `${jobs.length} stations → ${toVersion}`, 'info', actor);
    set({ firmwareJobs: [...jobs, ...state.firmwareJobs] });
    return jobs;
  },

  requestDiagnostics(stationId: string, fromTime: string, toTime: string, actor = 'You'): DiagnosticsJob {
    const station = state.stations.find((s) => s.id === stationId)!;
    const job: DiagnosticsJob = {
      id: uid('dg'),
      stationId,
      chargePointId: station.chargePointId,
      status: 'Uploading',
      requestedAt: nowIso(),
      completedAt: null,
      fileName: null,
      sizeKb: null,
      fromTime,
      toTime,
      requestedByName: actor,
    };
    logActivity(`station:${stationId}`, 'Diagnostics requested', station.code, 'info', actor);
    set({ diagnosticsJobs: [job, ...state.diagnosticsJobs] });

    window.setTimeout(() => {
      set({
        diagnosticsJobs: state.diagnosticsJobs.map((d) =>
          d.id === job.id
            ? { ...d, status: 'Uploaded', completedAt: nowIso(), fileName: `${station.chargePointId}-diag.tar.gz`, sizeKb: 1480 }
            : d,
        ),
      });
    }, 2600);

    return job;
  },
};

export function defaultEvChargingConfig(): EvChargingServiceConfig {
  return {
    defaultTariffId: null,
    payment: null,
    siteLoadLimitKw: 0,
    publicListing: true,
    roamingEnabled: false,
    supportPhone: '+971 800 383 4283',
  };
}

/* ==========================================================================
 * Selectors
 * ======================================================================== */

export function useLocations() {
  const { locations } = useNetwork();
  return locations;
}

export function useLocationDetail(locationId: string | undefined) {
  const net = useNetwork();
  return useMemo(() => {
    const location = net.locations.find((l) => l.id === locationId);
    if (!location) return undefined;
    const services = net.services.filter((s) => s.locationId === location.id);
    const evService = services.find((s) => s.serviceId === EV_CHARGING_SERVICE_ID);
    const stations = net.stations.filter((s) => s.locationId === location.id);
    const stationIds = new Set(stations.map((s) => s.id));
    const evses = net.evses.filter((e) => stationIds.has(e.stationId));
    const connectors = net.connectors.filter((c) => stationIds.has(c.stationId));
    const activity = net.activity.filter((a) => a.subject === `location:${location.id}` || stationIds.has(a.subject.replace('station:', '')));
    return { location, services, evService, stations, evses, connectors, activity };
  }, [net, locationId]);
}

export function useStationDetail(stationId: string | undefined) {
  const net = useNetwork();
  return useMemo(() => {
    const station = net.stations.find((s) => s.id === stationId);
    if (!station) return undefined;
    const location = net.locations.find((l) => l.id === station.locationId);
    const profile = net.profiles.find((p) => p.id === station.hardwareProfileId);
    const service = net.services.find((s) => s.id === station.serviceId);
    const evses = net.evses.filter((e) => e.stationId === station.id).sort((a, b) => a.ordinal - b.ordinal);
    const connectors = net.connectors.filter((c) => c.stationId === station.id).sort((a, b) => a.connectorNumber - b.connectorNumber);
    const messages = net.messages.filter((m) => m.stationId === station.id);
    const commands = net.commands.filter((c) => c.stationId === station.id);
    const configKeys = net.configKeys.filter((k) => k.stationId === station.id);
    const firmware = net.firmwareJobs.filter((f) => f.stationId === station.id);
    const diagnostics = net.diagnosticsJobs.filter((d) => d.stationId === station.id);
    const chargingProfiles = net.chargingProfiles.filter(
      (p) => p.stationId === station.id || (p.locationId && p.locationId === station.locationId),
    );
    const activity = net.activity.filter((a) => a.subject === `station:${station.id}`);
    return { station, location, profile, service, evses, connectors, messages, commands, configKeys, firmware, diagnostics, chargingProfiles, activity };
  }, [net, stationId]);
}

/** Resolves the tariff for any node in the hierarchy, with its source. */
export function useTariffResolver() {
  const net = useNetwork();
  return useCallback(
    (input: { connectorId?: string; evseId?: string; stationId?: string; locationId?: string }) => {
      const connector = input.connectorId ? net.connectors.find((c) => c.id === input.connectorId) : undefined;
      const evse = input.evseId ?? connector?.evseId ? net.evses.find((e) => e.id === (input.evseId ?? connector?.evseId)) : undefined;
      const stationId = input.stationId ?? evse?.stationId ?? connector?.stationId;
      const station = stationId ? net.stations.find((s) => s.id === stationId) : undefined;
      const locationId = input.locationId ?? station?.locationId;
      const service = net.services.find((s) => s.locationId === locationId && s.serviceId === EV_CHARGING_SERVICE_ID);
      const companyDefault = net.tariffs.find((t) => t.isCompanyDefault);

      const resolved = resolveTariff({
        connector,
        evse,
        station,
        service: service?.evCharging,
        companyDefaultTariffId: companyDefault?.id ?? null,
      });
      return { ...resolved, tariff: net.tariffs.find((t) => t.id === resolved.tariffId) };
    },
    [net],
  );
}

export function usePaymentResolver() {
  const net = useNetwork();
  return useCallback(
    (locationId: string | undefined) => {
      const service = net.services.find((s) => s.locationId === locationId && s.serviceId === EV_CHARGING_SERVICE_ID);
      return resolvePayment(service?.evCharging?.payment, net.companyPayment);
    },
    [net],
  );
}

/* ==========================================================================
 * Derived statistics — the dashboard and the list headers read these
 * ======================================================================== */

export interface NetworkStats {
  locations: number;
  activeLocations: number;
  stations: number;
  onlineStations: number;
  offlineStations: number;
  faultedStations: number;
  provisioningStations: number;
  connectors: number;
  available: number;
  charging: number;
  faulted: number;
  unavailable: number;
  utilisationPct: number;
  availabilityPct: number;
  installedKw: number;
  gridKw: number;
  lifetimeKwh: number;
  lifetimeSessions: number;
}

export function useNetworkStats(): NetworkStats {
  const net = useNetwork();
  return useMemo(() => {
    const connectors = net.connectors;
    const charging = connectors.filter((c) => c.status === 'Charging').length;
    const available = connectors.filter((c) => c.status === 'Available').length;
    const faulted = connectors.filter((c) => c.status === 'Faulted').length;
    const unavailable = connectors.filter((c) => c.status === 'Unavailable').length;
    const serviceable = connectors.length - unavailable;

    return {
      locations: net.locations.length,
      activeLocations: net.locations.filter((l) => l.status === 'Active').length,
      stations: net.stations.length,
      onlineStations: net.stations.filter((s) => s.state === 'Online').length,
      offlineStations: net.stations.filter((s) => s.state === 'Offline').length,
      faultedStations: net.stations.filter((s) => s.state === 'Faulted').length,
      provisioningStations: net.stations.filter((s) => s.state === 'Provisioning').length,
      connectors: connectors.length,
      available,
      charging,
      faulted,
      unavailable,
      utilisationPct: serviceable > 0 ? Math.round((charging / serviceable) * 100) : 0,
      availabilityPct: connectors.length > 0 ? Math.round(((connectors.length - faulted - unavailable) / connectors.length) * 100) : 0,
      installedKw: Math.round(net.evses.reduce((n, e) => n + e.maxPowerKw, 0)),
      gridKw: net.locations.reduce((n, l) => n + l.gridCapacityKw, 0),
      lifetimeKwh: Math.round(connectors.reduce((n, c) => n + c.lifetimeKwh, 0)),
      lifetimeSessions: connectors.reduce((n, c) => n + c.lifetimeSessions, 0),
    };
  }, [net]);
}

/** Per-location rollup used by the locations list and the dashboard. */
export interface LocationRollup {
  stations: number;
  connectors: number;
  available: number;
  charging: number;
  faulted: number;
  installedKw: number;
  evEnabled: boolean;
}

export function useLocationRollups(): Record<string, LocationRollup> {
  const net = useNetwork();
  return useMemo(() => {
    const out: Record<string, LocationRollup> = {};
    for (const location of net.locations) {
      out[location.id] = {
        stations: 0, connectors: 0, available: 0, charging: 0, faulted: 0, installedKw: 0,
        evEnabled: net.services.some(
          (s) => s.locationId === location.id && s.serviceId === EV_CHARGING_SERVICE_ID && s.status === 'Active',
        ),
      };
    }
    for (const station of net.stations) {
      const row = out[station.locationId];
      if (row) row.stations += 1;
    }
    for (const evse of net.evses) {
      const row = out[evse.locationId];
      if (row) row.installedKw += evse.maxPowerKw;
    }
    for (const connector of net.connectors) {
      const row = out[connector.locationId];
      if (!row) continue;
      row.connectors += 1;
      if (connector.status === 'Available') row.available += 1;
      if (connector.status === 'Charging') row.charging += 1;
      if (connector.status === 'Faulted') row.faulted += 1;
    }
    return out;
  }, [net]);
}

/** How many stations each hardware profile has in the field. */
export function useProfileUsage(): Record<string, number> {
  const net = useNetwork();
  return useMemo(() => {
    const out: Record<string, number> = {};
    for (const profile of net.profiles) out[profile.id] = 0;
    for (const station of net.stations) out[station.hardwareProfileId] = (out[station.hardwareProfileId] ?? 0) + 1;
    return out;
  }, [net]);
}

/** Where each tariff is bound, so a tariff is never deleted blind. */
export interface TariffUsage {
  locations: number;
  stations: number;
  evses: number;
  connectors: number;
  total: number;
}

export function useTariffUsage(): Record<string, TariffUsage> {
  const net = useNetwork();
  return useMemo(() => {
    const out: Record<string, TariffUsage> = {};
    const bump = (id: string | null, key: keyof Omit<TariffUsage, 'total'>) => {
      if (!id) return;
      out[id] = out[id] ?? { locations: 0, stations: 0, evses: 0, connectors: 0, total: 0 };
      out[id][key] += 1;
      out[id].total += 1;
    };
    for (const tariff of net.tariffs) out[tariff.id] = { locations: 0, stations: 0, evses: 0, connectors: 0, total: 0 };
    for (const service of net.services) bump(service.evCharging?.defaultTariffId ?? null, 'locations');
    for (const station of net.stations) bump(station.tariffId, 'stations');
    for (const evse of net.evses) bump(evse.tariffId, 'evses');
    for (const connector of net.connectors) bump(connector.tariffId, 'connectors');
    return out;
  }, [net]);
}
