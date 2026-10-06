/* =============================================================================
 * EV Gate — organisation hierarchy and administration levels.
 *
 * Platform → Tenants → Companies → Locations → Chargers / EVSEs / Connectors.
 * The Registration module produces a Company (and its first Company Admin) at
 * the third level; everything below it is built by later modules.
 * ========================================================================== */

export type ScopeLevel = 'platform' | 'tenant' | 'company' | 'location';

export const SCOPE_LEVELS: ScopeLevel[] = ['platform', 'tenant', 'company', 'location'];

/**
 * The four default administration levels. Custom roles are configured through
 * the Configuration / Lookup layer and carry their own privilege set, so this
 * union is the *seed*, never the closed list.
 */
export type AdminLevel = 'PlatformAdmin' | 'TenantAdmin' | 'CompanyAdmin' | 'LocationAdmin';

export interface RoleDefinition {
  id: string;
  name: string;
  nameAr?: string;
  scope: ScopeLevel;
  /** `true` for the four seeded levels; custom roles are editable. */
  system: boolean;
  privileges: string[];
}

/**
 * Privileges relevant to this module. Named `<module>.<action>` so the set can
 * grow module by module without a rename.
 */
export const REGISTRATION_PRIVILEGES = {
  view: 'registration.view',
  create: 'registration.create',
  submit: 'registration.submit',
  review: 'registration.review',
  approve: 'registration.approve',
  reject: 'registration.reject',
  convertDemo: 'registration.convertDemo',
} as const;

export type RegistrationPrivilege =
  (typeof REGISTRATION_PRIVILEGES)[keyof typeof REGISTRATION_PRIVILEGES];

/** Who may act on a registration at each administration level. */
export const REGISTRATION_PRIVILEGES_BY_LEVEL: Record<AdminLevel, RegistrationPrivilege[]> = {
  PlatformAdmin: Object.values(REGISTRATION_PRIVILEGES),
  TenantAdmin: Object.values(REGISTRATION_PRIVILEGES),
  CompanyAdmin: [REGISTRATION_PRIVILEGES.view],
  LocationAdmin: [],
};
