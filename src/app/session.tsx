/* =============================================================================
 * EV Gate CPMS — session.
 *
 * There is no authentication service yet (see OS-02 in the Registration BRD —
 * credentials belong to User & Role Management). What this module provides is
 * the thing every authenticated screen actually needs: who is signed in, what
 * they may do, and which slice of the network they can see.
 *
 * Sign-in is by persona. That is deliberate rather than a shortcut: a
 * multi-tenant CPMS behaves very differently for a Platform Administrator and
 * for a site-level operator, and being able to switch between them in one
 * click is the fastest way to review whether the permission model is right.
 * ========================================================================== */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ScopeLevel = 'platform' | 'tenant' | 'company' | 'location';

/* -------------------------------------------------------------------------- */
/* Privileges                                                                  */
/* -------------------------------------------------------------------------- */

export const PRIVILEGES = {
  networkView: 'network.view',
  locationsView: 'locations.view',
  locationsManage: 'locations.manage',
  stationsView: 'stations.view',
  stationsManage: 'stations.manage',
  stationsCommission: 'stations.commission',
  catalogueView: 'catalogue.view',
  catalogueManage: 'catalogue.manage',
  tariffsView: 'tariffs.view',
  tariffsManage: 'tariffs.manage',
  ocppView: 'ocpp.view',
  ocppOperate: 'ocpp.operate',
  ocppConfigure: 'ocpp.configure',
  paymentsManage: 'payments.manage',
} as const;

export type Privilege = (typeof PRIVILEGES)[keyof typeof PRIVILEGES];

const ALL: Privilege[] = Object.values(PRIVILEGES);

/* -------------------------------------------------------------------------- */
/* Personas                                                                    */
/* -------------------------------------------------------------------------- */

export interface Persona {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  roleKey: 'platformAdmin' | 'tenantAdmin' | 'companyAdmin' | 'locationAdmin';
  scopeLevel: ScopeLevel;
  /** Null at platform level — the whole estate is visible. */
  locationId: string | null;
  avatarColor: string;
  privileges: Privilege[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'usr-platform',
    name: 'Dana Al Marzouqi',
    nameAr: 'دانة المرزوقي',
    email: 'dana.marzouqi@evgate.ae',
    roleKey: 'platformAdmin',
    scopeLevel: 'platform',
    locationId: null,
    avatarColor: '#3b185f',
    privileges: ALL,
  },
  {
    id: 'usr-tenant',
    name: 'Omar Haddad',
    nameAr: 'عمر حداد',
    email: 'omar.haddad@emirates-charge.ae',
    roleKey: 'tenantAdmin',
    scopeLevel: 'tenant',
    locationId: null,
    avatarColor: '#a32469',
    privileges: ALL.filter((p) => p !== PRIVILEGES.catalogueManage),
  },
  {
    id: 'usr-company',
    name: 'Amal Saeed',
    nameAr: 'أمل سعيد',
    email: 'amal.saeed@alnoor.example',
    roleKey: 'companyAdmin',
    scopeLevel: 'company',
    locationId: null,
    avatarColor: '#5c3a83',
    privileges: [
      PRIVILEGES.networkView,
      PRIVILEGES.locationsView, PRIVILEGES.locationsManage,
      PRIVILEGES.stationsView, PRIVILEGES.stationsManage, PRIVILEGES.stationsCommission,
      PRIVILEGES.catalogueView,
      PRIVILEGES.tariffsView, PRIVILEGES.tariffsManage,
      PRIVILEGES.ocppView, PRIVILEGES.ocppOperate,
      PRIVILEGES.paymentsManage,
    ],
  },
  {
    id: 'usr-location',
    name: 'Rashid Al Marri',
    nameAr: 'راشد المري',
    email: 'rashid.marri@alnoor.example',
    roleKey: 'locationAdmin',
    scopeLevel: 'location',
    locationId: 'loc-marina-mall',
    avatarColor: '#b66610',
    privileges: [
      PRIVILEGES.networkView,
      PRIVILEGES.locationsView,
      PRIVILEGES.stationsView, PRIVILEGES.stationsManage,
      PRIVILEGES.catalogueView,
      PRIVILEGES.tariffsView,
      PRIVILEGES.ocppView,
    ],
  },
];

const STORAGE_KEY = 'evgate.session.persona';

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

interface SessionValue {
  isAuthenticated: boolean;
  persona?: Persona;
  /** `true` when the persona holds every privilege listed. */
  can: (privilege: Privilege | Privilege[]) => boolean;
  /** `true` when the persona holds any one of them. An empty list passes. */
  canAny: (privileges: Privilege[]) => boolean;
  /** Narrows a collection to what this persona may see. */
  inScope: <T extends { locationId?: string; id?: string }>(items: T[], kind?: 'location' | 'child') => T[];
  signIn: (personaId: string) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      return window.localStorage.getItem(STORAGE_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  });

  const persona = useMemo(() => PERSONAS.find((p) => p.id === personaId), [personaId]);

  const privileges = useMemo(() => new Set<string>(persona?.privileges ?? []), [persona]);

  const can = useCallback(
    (privilege: Privilege | Privilege[]) => {
      if (!persona) return false;
      const list = Array.isArray(privilege) ? privilege : [privilege];
      return list.every((p) => privileges.has(p));
    },
    [persona, privileges],
  );

  const canAny = useCallback(
    (list: Privilege[]) => {
      if (!persona) return false;
      if (list.length === 0) return true;
      return list.some((p) => privileges.has(p));
    },
    [persona, privileges],
  );

  /**
   * A location-scoped operator sees one site. Everyone else sees the estate.
   * `kind: 'location'` narrows locations by their own id; `'child'` narrows
   * stations, EVSEs and connectors by the `locationId` they carry.
   */
  const inScope = useCallback(
    <T extends { locationId?: string; id?: string }>(items: T[], kind: 'location' | 'child' = 'child'): T[] => {
      if (!persona?.locationId) return items;
      return items.filter((item) => (kind === 'location' ? item.id === persona.locationId : item.locationId === persona.locationId));
    },
    [persona],
  );

  const signIn = useCallback((next: string) => {
    setPersonaId(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice simply is not remembered */
    }
  }, []);

  const signOut = useCallback(() => {
    setPersonaId(undefined);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ isAuthenticated: Boolean(persona), persona, can, canAny, inScope, signIn, signOut }),
    [persona, can, canAny, inScope, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
