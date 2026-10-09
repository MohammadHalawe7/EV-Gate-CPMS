/* =============================================================================
 * EV Gate CPMS — authenticated routes and navigation.
 *
 * Route paths live here so a screen that links to another screen writes the
 * path once. Navigation is derived from the same constants, which is what
 * guarantees a sidebar item can never point at a route that does not exist.
 * ========================================================================== */

import {
  Cpu,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Plug,
  Server,
  Tags,
  Zap,
} from 'lucide-react';
import type { NavGroup } from '@/components/layout/Sidebar';
import { PRIVILEGES, type Privilege } from './session';
import type { TranslationKey } from '@/i18n';

export const APP_ROUTES = {
  dashboard: '/dashboard',

  locations: '/locations',
  location: (id = ':locationId') => `/locations/${id}`,

  stations: '/stations',
  station: (id = ':stationId') => `/stations/${id}`,

  connectors: '/connectors',

  hardware: '/catalogue/hardware',
  hardwareProfile: (id = ':profileId') => `/catalogue/hardware/${id}`,

  tariffs: '/catalogue/tariffs',
  tariff: (id = ':tariffId') => `/catalogue/tariffs/${id}`,

  payment: '/catalogue/payment',

  ocpp: '/ocpp',
  ocppMonitor: '/ocpp/monitor',
  ocppCommands: '/ocpp/commands',
  ocppConfiguration: '/ocpp/configuration',
  ocppSmartCharging: '/ocpp/smart-charging',
  ocppFirmware: '/ocpp/firmware',
  ocppDiagnostics: '/ocpp/diagnostics',
} as const;

export interface AppNavItem {
  to: string;
  labelKey: TranslationKey;
  icon: NavGroup['items'][number]['icon'];
  end?: boolean;
  privileges: Privilege[];
  badge?: 'faults' | 'provisioning';
}

export interface AppNavGroup {
  labelKey: TranslationKey;
  items: AppNavItem[];
}

export const NAV_GROUPS: AppNavGroup[] = [
  {
    labelKey: 'nav.group.overview',
    items: [
      { to: APP_ROUTES.dashboard, labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true, privileges: [PRIVILEGES.networkView] },
    ],
  },
  {
    labelKey: 'nav.group.network',
    items: [
      { to: APP_ROUTES.locations, labelKey: 'nav.locations', icon: MapPin, privileges: [PRIVILEGES.locationsView] },
      { to: APP_ROUTES.stations, labelKey: 'nav.stations', icon: Zap, privileges: [PRIVILEGES.stationsView], badge: 'provisioning' },
      { to: APP_ROUTES.connectors, labelKey: 'nav.connectors', icon: Plug, privileges: [PRIVILEGES.stationsView], badge: 'faults' },
      { to: APP_ROUTES.ocpp, labelKey: 'nav.ocpp', icon: Cpu, privileges: [PRIVILEGES.ocppView] },
    ],
  },
  {
    labelKey: 'nav.group.catalogue',
    items: [
      { to: APP_ROUTES.hardware, labelKey: 'nav.hardware', icon: Server, privileges: [PRIVILEGES.catalogueView] },
      { to: APP_ROUTES.tariffs, labelKey: 'nav.tariffs', icon: Tags, privileges: [PRIVILEGES.tariffsView] },
      { to: APP_ROUTES.payment, labelKey: 'nav.payment', icon: CreditCard, privileges: [PRIVILEGES.paymentsManage] },
    ],
  },
];

/** The sub-navigation inside the OCPP Operations Centre. */
export const OCPP_TABS: { to: string; labelKey: TranslationKey; end?: boolean }[] = [
  { to: APP_ROUTES.ocppMonitor, labelKey: 'ocpp.tab.monitor' },
  { to: APP_ROUTES.ocppCommands, labelKey: 'ocpp.tab.commands' },
  { to: APP_ROUTES.ocppConfiguration, labelKey: 'ocpp.tab.configuration' },
  { to: APP_ROUTES.ocppSmartCharging, labelKey: 'ocpp.tab.smartCharging' },
  { to: APP_ROUTES.ocppFirmware, labelKey: 'ocpp.tab.firmware' },
  { to: APP_ROUTES.ocppDiagnostics, labelKey: 'ocpp.tab.diagnostics' },
];
