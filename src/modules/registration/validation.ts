/* =============================================================================
 * Registration — validation.
 *
 * Rules return a `TranslationKey`-shaped string rather than a sentence, so the
 * message is resolved in the component and Arabic gets the same treatment as
 * English. Each step validates independently; the wizard blocks forward
 * movement on the current step only, and the review step re-validates all of
 * them so nothing can be skipped by jumping backwards.
 * ========================================================================== */

import { servicesRequireChargers } from '@/data/lookups';
import { type ContactPerson, type LegalDocument, type RegistrationDraft } from '@/domain';

export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const URL = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;

const required = (v: string | undefined | null) => !v || String(v).trim() === '';

/** A positive whole number, entered as text so an empty field stays empty. */
function invalidCount(value: string, { min = 1 }: { min?: number } = {}): boolean {
  if (required(value)) return true;
  const n = Number(value);
  return !Number.isFinite(n) || !Number.isInteger(n) || n < min;
}

/* -------------------------------------------------------------------------- */

export function validateCompany(draft: RegistrationDraft): Errors {
  const e: Errors = {};
  const c = draft.company;

  if (required(c.logo)) e['company.logo'] = 'reg.err.logo';
  if (required(c.name)) e['company.name'] = 'reg.err.required';
  else if (c.name.trim().length < 2) e['company.name'] = 'reg.err.tooShort';
  if (required(c.nameAr)) e['company.nameAr'] = 'reg.err.required';
  else if (!/[؀-ۿ]/.test(c.nameAr)) e['company.nameAr'] = 'reg.err.arabicScript';
  if (required(c.tradeRegisterNumber)) e['company.tradeRegisterNumber'] = 'reg.err.required';
  if (required(c.countryId)) e['company.countryId'] = 'reg.err.select';
  if (required(c.cityId)) e['company.cityId'] = 'reg.err.select';
  if (invalidCount(c.numberOfUsers)) e['company.numberOfUsers'] = 'reg.err.count';
  if (invalidCount(c.numberOfLocations)) e['company.numberOfLocations'] = 'reg.err.count';
  if (c.serviceIds.length === 0) e['company.serviceIds'] = 'reg.err.selectOne';
  if (servicesRequireChargers(c.serviceIds) && invalidCount(c.numberOfChargers)) {
    e['company.numberOfChargers'] = 'reg.err.count';
  }
  if (required(c.employeeBandId)) e['company.employeeBandId'] = 'reg.err.select';
  if (!required(c.profileUrl) && !URL.test(c.profileUrl.trim())) e['company.profileUrl'] = 'reg.err.url';

  return e;
}

export function validateAdditional(draft: RegistrationDraft): Errors {
  const e: Errors = {};
  const a = draft.additional;
  // Every field here is optional; only a sub sector without its main sector is
  // an inconsistency worth blocking.
  if (!required(a.subSectorId) && required(a.mainSectorId)) e['additional.mainSectorId'] = 'reg.err.parentFirst';
  return e;
}

export function validateAdmin(draft: RegistrationDraft): Errors {
  const e: Errors = {};
  const a = draft.admin;

  if (required(a.email)) e['admin.email'] = 'reg.err.required';
  else if (!EMAIL.test(a.email.trim())) e['admin.email'] = 'reg.err.email';
  if (required(a.firstName)) e['admin.firstName'] = 'reg.err.required';
  if (required(a.lastName)) e['admin.lastName'] = 'reg.err.required';
  if (required(a.genderId)) e['admin.genderId'] = 'reg.err.select';
  if (required(a.departmentId)) e['admin.departmentId'] = 'reg.err.select';
  if (required(a.positionId)) e['admin.positionId'] = 'reg.err.select';
  if (required(a.phone.number)) e['admin.phone'] = 'reg.err.required';
  else if (a.phone.number.replace(/\D/g, '').length < 7) e['admin.phone'] = 'reg.err.phone';
  if (required(a.activationDate)) e['admin.activationDate'] = 'reg.err.date';
  if (required(a.expiryDate)) e['admin.expiryDate'] = 'reg.err.date';
  else if (!required(a.activationDate) && a.expiryDate <= a.activationDate) {
    e['admin.expiryDate'] = 'reg.err.expiryAfterActivation';
  }

  return e;
}

export function validateRecords(draft: RegistrationDraft): Errors {
  const e: Errors = {};
  if (draft.documents.length === 0) e['documents'] = 'reg.err.documentsRequired';
  const expired = draft.documents.filter((d) => d.expiryDate && d.expiryDate < todayIso());
  if (expired.length > 0) e['documents.expired'] = 'reg.err.documentExpired';
  return e;
}

/* -------------------------------------------------------------------------- */
/* Sub-records — validated inside their own dialog                             */
/* -------------------------------------------------------------------------- */

export function validateContact(contact: ContactPerson): Errors {
  const e: Errors = {};
  if (required(contact.firstName)) e['firstName'] = 'reg.err.required';
  if (required(contact.lastName)) e['lastName'] = 'reg.err.required';
  if (required(contact.departmentId)) e['departmentId'] = 'reg.err.select';
  if (required(contact.positionId)) e['positionId'] = 'reg.err.select';
  if (required(contact.mobile.number)) e['mobile'] = 'reg.err.required';
  else if (contact.mobile.number.replace(/\D/g, '').length < 7) e['mobile'] = 'reg.err.phone';
  if (required(contact.email)) e['email'] = 'reg.err.required';
  else if (!EMAIL.test(contact.email.trim())) e['email'] = 'reg.err.email';
  return e;
}

export function validateDocument(document: LegalDocument): Errors {
  const e: Errors = {};
  if (required(document.documentTypeId)) e['documentTypeId'] = 'reg.err.select';
  if (required(document.documentNumber)) e['documentNumber'] = 'reg.err.required';
  if (required(document.issuedPlace)) e['issuedPlace'] = 'reg.err.required';
  if (required(document.expiryDate)) e['expiryDate'] = 'reg.err.date';
  else if (document.expiryDate < todayIso()) e['expiryDate'] = 'reg.err.expiryPast';
  if (required(document.fileName)) e['file'] = 'reg.err.fileRequired';
  return e;
}

/* -------------------------------------------------------------------------- */

export const STEP_VALIDATORS = [
  validateCompany,
  validateAdditional,
  validateAdmin,
  validateRecords,
] as const;

export function validateStep(step: number, draft: RegistrationDraft): Errors {
  const fn = STEP_VALIDATORS[step];
  return fn ? fn(draft) : {};
}

export function validateAll(draft: RegistrationDraft): Errors[] {
  return STEP_VALIDATORS.map((fn) => fn(draft));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
