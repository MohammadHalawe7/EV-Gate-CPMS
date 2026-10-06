/* =============================================================================
 * EV Gate — Registration module domain.
 *
 * Three onboarding channels converge on one record:
 *   demo         a company asks a Tenant or the Platform for a demo account
 *   internal     a Platform or Tenant Admin registers a company from inside
 *   self         a company registers itself from outside and is reviewed
 *
 * Every reference value below (country, sector, department, document type …)
 * is an id into the Configuration / Lookup layer — see src/data/lookups.ts.
 * Nothing here hard-codes a business constant.
 * ========================================================================== */

/** How the record entered the platform. */
export type RegistrationChannel = 'demo' | 'internal' | 'self';

/**
 * The lifecycle. `Demo` and `Converted` sit beside the review states rather
 * than inside them: a demo account is live, and converting it is a distinct
 * transition that produces a full account.
 */
export type RegistrationStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'Demo'
  | 'Converted'
  | 'Withdrawn';

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'Draft',
  'Submitted',
  'UnderReview',
  'Approved',
  'Rejected',
  'Demo',
  'Converted',
  'Withdrawn',
];

/** Legal transitions. The UI reads this rather than testing statuses inline. */
export const REGISTRATION_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  Draft: ['Submitted', 'Withdrawn'],
  Submitted: ['UnderReview', 'Approved', 'Rejected', 'Withdrawn'],
  UnderReview: ['Approved', 'Rejected'],
  Approved: [],
  Rejected: ['Submitted'],
  Demo: ['Converted', 'Rejected'],
  Converted: [],
  Withdrawn: ['Draft'],
};

/** States in which the applicant may still edit the application. */
export const EDITABLE_STATUSES: RegistrationStatus[] = ['Draft', 'Rejected'];

/* -------------------------------------------------------------------------- */
/* Records                                                                     */
/* -------------------------------------------------------------------------- */

export interface PhoneNumber {
  /** ISO 3166-1 alpha-2 of the dial code. */
  country: string;
  number: string;
}

export interface CompanyProfile {
  /** Data URL of the uploaded logo — the mock layer keeps no file store. */
  logo: string;
  name: string;
  nameAr: string;
  tradeRegisterNumber: string;
  countryId: string;
  cityId: string;
  address: string;
  numberOfUsers: string;
  numberOfLocations: string;
  /** Lookup ids from `services`. */
  serviceIds: string[];
  /** Required when `serviceIds` contains a service flagged `requiresChargers`. */
  numberOfChargers: string;
  employeeBandId: string;
  profileUrl: string;
}

export interface CompanyAdditionalDetails {
  mainSectorId: string;
  subSectorId: string;
  faxNumber: string;
  poBox: string;
  zipCode: string;
}

export interface AdminAccount {
  email: string;
  /** Derived from `email` — read-only in the UI, kept on the record. */
  username: string;
  firstName: string;
  secondName: string;
  thirdName: string;
  lastName: string;
  genderId: string;
  departmentId: string;
  positionId: string;
  phone: PhoneNumber;
  activationDate: string;
  expiryDate: string;
}

export interface ContactPerson {
  id: string;
  firstName: string;
  secondName: string;
  thirdName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
  mobile: PhoneNumber;
  email: string;
}

export interface LegalDocument {
  id: string;
  documentTypeId: string;
  documentNumber: string;
  issuedPlace: string;
  expiryDate: string;
  fileName: string;
  fileSize: number;
}

export interface CompanyRegistration {
  id: string;
  /** Human reference shown to the applicant — EVG-REG-2026-0001. */
  reference: string;
  channel: RegistrationChannel;
  status: RegistrationStatus;
  /** Set when a Tenant Admin owns the application; null means Platform. */
  tenantId: string | null;
  company: CompanyProfile;
  additional: CompanyAdditionalDetails;
  admin: AdminAccount;
  contacts: ContactPerson[];
  documents: LegalDocument[];
  /** Present once a reviewer rejects. */
  decisionNote: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
}

/** A draft carries the same shape, minus the server-assigned fields. */
export type RegistrationDraft = Omit<
  CompanyRegistration,
  'id' | 'reference' | 'submittedAt' | 'decidedAt' | 'decisionNote'
>;

/* -------------------------------------------------------------------------- */
/* Transactional email                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The messages the Registration module triggers. Declared here so the flow is
 * legible now and the Notifications module has something concrete to bind to
 * later — nothing is actually sent by the mock layer.
 */
export type RegistrationEmail =
  | 'request.submitted'
  | 'status.updated'
  | 'request.approved'
  | 'request.rejected'
  | 'account.created'
  | 'password.set'
  | 'password.reset'
  | 'login.first';

export const REGISTRATION_EMAILS: {
  key: RegistrationEmail;
  trigger: string;
  to: 'applicant' | 'reviewer' | 'admin-user';
}[] = [
  { key: 'request.submitted', trigger: 'Application moves to Submitted', to: 'applicant' },
  { key: 'status.updated', trigger: 'Status changes at any point', to: 'applicant' },
  { key: 'request.approved', trigger: 'Reviewer approves', to: 'applicant' },
  { key: 'request.rejected', trigger: 'Reviewer rejects, with the reason', to: 'applicant' },
  { key: 'account.created', trigger: 'Company and Company Admin are provisioned', to: 'admin-user' },
  { key: 'password.set', trigger: 'Account created — a single-use set-password link', to: 'admin-user' },
  { key: 'password.reset', trigger: 'Reset requested from the sign-in screen', to: 'admin-user' },
  { key: 'login.first', trigger: 'First successful sign-in', to: 'admin-user' },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** The user name is the local part of the company email, lower-cased. */
export function usernameFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  return at > 0 ? trimmed.slice(0, at) : trimmed;
}

export function fullName(parts: {
  firstName: string;
  secondName?: string;
  thirdName?: string;
  lastName: string;
}): string {
  return [parts.firstName, parts.secondName, parts.thirdName, parts.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(' ');
}
