/* =============================================================================
 * EV Gate — Registration mock service.
 *
 * Frontend-only. Every function returns a promise with a short, realistic
 * latency so loading and disabled states are exercised rather than skipped.
 * Drafts live in localStorage; submitted applications live in memory for the
 * session and are seeded so the status lookup has something to find.
 *
 * When the API arrives, this file is the only one that changes.
 * ========================================================================== */

import { nowIso, uid } from '@/lib/utils';
import {
  type CompanyRegistration,
  type RegistrationChannel,
  type RegistrationDraft,
  type RegistrationStatus,
} from '@/domain';

const DRAFT_KEY = 'evgate.registration.draft';
const LATENCY = 650;

const wait = <T,>(value: T, ms = LATENCY): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), ms));

/* -------------------------------------------------------------------------- */
/* Empty record                                                                */
/* -------------------------------------------------------------------------- */

export function emptyDraft(channel: RegistrationChannel = 'self'): RegistrationDraft {
  const at = nowIso();
  return {
    channel,
    status: 'Draft',
    tenantId: null,
    company: {
      logo: '',
      name: '',
      nameAr: '',
      tradeRegisterNumber: '',
      countryId: '',
      cityId: '',
      address: '',
      numberOfUsers: '',
      numberOfLocations: '',
      serviceIds: [],
      numberOfChargers: '',
      employeeBandId: '',
      profileUrl: '',
    },
    additional: {
      mainSectorId: '',
      subSectorId: '',
      faxNumber: '',
      poBox: '',
      zipCode: '',
    },
    admin: {
      email: '',
      username: '',
      firstName: '',
      secondName: '',
      thirdName: '',
      lastName: '',
      genderId: '',
      departmentId: '',
      positionId: '',
      phone: { country: 'AE', number: '' },
      activationDate: '',
      expiryDate: '',
    },
    contacts: [],
    documents: [],
    createdAt: at,
    updatedAt: at,
  };
}

/* -------------------------------------------------------------------------- */
/* Draft persistence                                                           */
/* -------------------------------------------------------------------------- */

export interface StoredDraft {
  draft: RegistrationDraft;
  step: number;
  savedAt: string;
}

export function readDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.draft?.company) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDraft(draft: RegistrationDraft, step: number): StoredDraft {
  const stored: StoredDraft = { draft: { ...draft, updatedAt: nowIso() }, step, savedAt: nowIso() };
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable — the draft simply is not kept */
  }
  return stored;
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export async function saveDraft(draft: RegistrationDraft, step: number): Promise<StoredDraft> {
  return wait(writeDraft(draft, step), 420);
}

/* -------------------------------------------------------------------------- */
/* Submitted applications                                                      */
/* -------------------------------------------------------------------------- */

let sequence = 4;

function makeReference(): string {
  sequence += 1;
  return `EVG-REG-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;
}

const submitted = new Map<string, CompanyRegistration>();

/** Seeded so the status page has something to resolve during a demo. */
function seed() {
  if (submitted.size > 0) return;
  const base = emptyDraft('self');
  const rows: { reference: string; name: string; nameAr: string; status: RegistrationStatus; note: string }[] = [
    { reference: 'EVG-REG-2026-0001', name: 'Al Noor Mobility', nameAr: 'النور للتنقل', status: 'UnderReview', note: '' },
    { reference: 'EVG-REG-2026-0002', name: 'Gulf Fleet Services', nameAr: 'خدمات أساطيل الخليج', status: 'Approved', note: '' },
    { reference: 'EVG-REG-2026-0003', name: 'Marina Retail Group', nameAr: 'مجموعة مارينا للتجزئة', status: 'Demo', note: '' },
    {
      reference: 'EVG-REG-2026-0004',
      name: 'Desert Logistics',
      nameAr: 'لوجستيات الصحراء',
      status: 'Rejected',
      note: 'The uploaded trade license had expired. Re-upload a valid copy and resubmit.',
    },
  ];
  for (const row of rows) {
    submitted.set(row.reference.toUpperCase(), {
      ...base,
      id: uid('reg'),
      reference: row.reference,
      status: row.status,
      company: { ...base.company, name: row.name, nameAr: row.nameAr, countryId: 'AE', cityId: 'AE-DXB' },
      decisionNote: row.note,
      submittedAt: nowIso(),
      decidedAt: row.status === 'Approved' || row.status === 'Rejected' ? nowIso() : null,
    });
  }
}

export async function submitRegistration(draft: RegistrationDraft): Promise<CompanyRegistration> {
  seed();
  const at = nowIso();
  const record: CompanyRegistration = {
    ...draft,
    id: uid('reg'),
    reference: makeReference(),
    status: 'Submitted',
    decisionNote: '',
    updatedAt: at,
    submittedAt: at,
    decidedAt: null,
  };
  submitted.set(record.reference.toUpperCase(), record);
  clearDraft();
  return wait(record, 900);
}

export async function findByReference(reference: string): Promise<CompanyRegistration | null> {
  seed();
  return wait(submitted.get(reference.trim().toUpperCase()) ?? null, 550);
}

/**
 * Reserved for the review queue built in a later step: a Platform or Tenant
 * Admin moves an application through the lifecycle from inside the platform.
 */
export async function decide(
  reference: string,
  status: RegistrationStatus,
  note = '',
): Promise<CompanyRegistration | null> {
  seed();
  const key = reference.trim().toUpperCase();
  const record = submitted.get(key);
  if (!record) return wait(null, 300);
  const next: CompanyRegistration = {
    ...record,
    status,
    decisionNote: note,
    updatedAt: nowIso(),
    decidedAt: nowIso(),
  };
  submitted.set(key, next);
  return wait(next, 500);
}
