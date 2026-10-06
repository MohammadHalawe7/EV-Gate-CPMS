/* =============================================================================
 * Registration — form state.
 *
 * One reducer-free hook holding the draft, the step, per-step errors and the
 * touched set. Deliberately dependency-free: the design system carries no form
 * library, and adding one for a single module would be a foundation decision.
 * ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uid } from '@/lib/utils';
import { servicesRequireChargers } from '@/data/lookups';
import {
  clearDraft,
  emptyDraft,
  readDraft,
  writeDraft,
  type StoredDraft,
} from '@/data/registrationService';
import {
  usernameFromEmail,
  type ContactPerson,
  type LegalDocument,
  type RegistrationChannel,
  type RegistrationDraft,
} from '@/domain';
import { validateAll, validateStep, type Errors } from './validation';

export const STEP_KEYS = ['company', 'additional', 'admin', 'records', 'review'] as const;
export type StepKey = (typeof STEP_KEYS)[number];
export const REVIEW_STEP = STEP_KEYS.length - 1;

type Section = 'company' | 'additional' | 'admin';

export interface RegistrationFormApi {
  draft: RegistrationDraft;
  step: number;
  errors: Errors;
  /** Steps that failed validation the last time they were left or reviewed. */
  invalidSteps: number[];
  touched: Set<string>;
  dirty: boolean;
  restored: StoredDraft | null;

  setField: <S extends Section, K extends keyof RegistrationDraft[S]>(
    section: S,
    key: K,
    value: RegistrationDraft[S][K],
  ) => void;
  touch: (path: string) => void;
  errorFor: (path: string) => string | undefined;

  upsertContact: (contact: ContactPerson) => void;
  removeContact: (id: string) => void;
  upsertDocument: (document: LegalDocument) => void;
  removeDocument: (id: string) => void;

  goTo: (step: number) => void;
  next: () => boolean;
  back: () => void;
  validateCurrent: () => boolean;
  validateEverything: () => boolean;
  reset: () => void;
  markSaved: () => void;
  requiresChargers: boolean;
}

export function newContact(): ContactPerson {
  return {
    id: uid('contact'),
    firstName: '',
    secondName: '',
    thirdName: '',
    lastName: '',
    departmentId: '',
    positionId: '',
    mobile: { country: 'AE', number: '' },
    email: '',
  };
}

export function newDocument(): LegalDocument {
  return {
    id: uid('doc'),
    documentTypeId: '',
    documentNumber: '',
    issuedPlace: '',
    expiryDate: '',
    fileName: '',
    fileSize: 0,
  };
}

export function useRegistrationForm(channel: RegistrationChannel = 'self'): RegistrationFormApi {
  const restoredRef = useRef<StoredDraft | null>(null);
  if (restoredRef.current === null) restoredRef.current = readDraft();
  const restored = restoredRef.current;

  const [draft, setDraft] = useState<RegistrationDraft>(
    () => restored?.draft ?? emptyDraft(channel),
  );
  const [step, setStep] = useState(() => restored?.step ?? 0);
  const [errors, setErrors] = useState<Errors>({});
  const [invalidSteps, setInvalidSteps] = useState<number[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  /* Autosave. A registration is long enough that losing it to a closed tab is
     a real failure, so the draft is written on a debounce as well as on the
     explicit "Save draft" action. */
  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => writeDraft(draft, step), 1200);
    return () => window.clearTimeout(id);
  }, [draft, step, dirty]);

  const requiresChargers = useMemo(
    () => servicesRequireChargers(draft.company.serviceIds),
    [draft.company.serviceIds],
  );

  const setField = useCallback<RegistrationFormApi['setField']>((section, key, value) => {
    setDirty(true);
    setDraft((prev) => {
      const nextSection = { ...prev[section], [key]: value } as RegistrationDraft[typeof section];
      const next = { ...prev, [section]: nextSection } as RegistrationDraft;

      /* Dependent lookups: changing a parent clears the child, otherwise the
         record keeps a city that no longer belongs to its country. */
      if (section === 'company' && key === 'countryId') {
        next.company = { ...next.company, cityId: '' };
      }
      if (section === 'additional' && key === 'mainSectorId') {
        next.additional = { ...next.additional, subSectorId: '' };
      }
      if (section === 'admin' && key === 'departmentId') {
        next.admin = { ...next.admin, positionId: '' };
      }
      /* The user name is derived, never typed. */
      if (section === 'admin' && key === 'email') {
        next.admin = { ...next.admin, username: usernameFromEmail(String(value)) };
      }
      /* A charger count only exists while a service demands it. */
      if (section === 'company' && key === 'serviceIds') {
        if (!servicesRequireChargers(value as string[])) {
          next.company = { ...next.company, numberOfChargers: '' };
        }
      }
      return next;
    });
  }, []);

  const touch = useCallback((path: string) => {
    setTouched((prev) => (prev.has(path) ? prev : new Set(prev).add(path)));
  }, []);

  const errorFor = useCallback(
    (path: string) => (touched.has(path) ? errors[path] : undefined),
    [errors, touched],
  );

  const upsertContact = useCallback((contact: ContactPerson) => {
    setDirty(true);
    setDraft((prev) => {
      const exists = prev.contacts.some((c) => c.id === contact.id);
      return {
        ...prev,
        contacts: exists
          ? prev.contacts.map((c) => (c.id === contact.id ? contact : c))
          : [...prev.contacts, contact],
      };
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }));
  }, []);

  const upsertDocument = useCallback((document: LegalDocument) => {
    setDirty(true);
    setDraft((prev) => {
      const exists = prev.documents.some((d) => d.id === document.id);
      return {
        ...prev,
        documents: exists
          ? prev.documents.map((d) => (d.id === document.id ? document : d))
          : [...prev.documents, document],
      };
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));
  }, []);

  const runStep = useCallback(
    (index: number): boolean => {
      const found = validateStep(index, draft);
      setErrors(found);
      setTouched((prev) => {
        const next = new Set(prev);
        Object.keys(found).forEach((k) => next.add(k));
        return next;
      });
      setInvalidSteps((prev) => {
        const withoutSelf = prev.filter((s) => s !== index);
        return Object.keys(found).length > 0 ? [...withoutSelf, index].sort() : withoutSelf;
      });
      return Object.keys(found).length === 0;
    },
    [draft],
  );

  const validateCurrent = useCallback(() => runStep(step), [runStep, step]);

  const validateEverything = useCallback(() => {
    const all = validateAll(draft);
    const merged = all.reduce<Errors>((acc, e) => ({ ...acc, ...e }), {});
    setErrors(merged);
    setTouched(new Set(Object.keys(merged)));
    const bad = all.map((e, i) => (Object.keys(e).length > 0 ? i : -1)).filter((i) => i >= 0);
    setInvalidSteps(bad);
    if (bad.length > 0) setStep(bad[0]);
    return bad.length === 0;
  }, [draft]);

  const next = useCallback(() => {
    if (!runStep(step)) return false;
    setStep((s) => Math.min(s + 1, REVIEW_STEP));
    return true;
  }, [runStep, step]);

  const back = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback(
    (target: number) => {
      if (target > step) {
        if (!runStep(step)) return;
      }
      setErrors({});
      setStep(Math.max(0, Math.min(target, REVIEW_STEP)));
    },
    [runStep, step],
  );

  const reset = useCallback(() => {
    clearDraft();
    restoredRef.current = null;
    setDraft(emptyDraft(channel));
    setStep(0);
    setErrors({});
    setInvalidSteps([]);
    setTouched(new Set());
    setDirty(false);
  }, [channel]);

  const markSaved = useCallback(() => setDirty(false), []);

  return {
    draft,
    step,
    errors,
    invalidSteps,
    touched,
    dirty,
    restored,
    setField,
    touch,
    errorFor,
    upsertContact,
    removeContact,
    upsertDocument,
    removeDocument,
    goTo,
    next,
    back,
    validateCurrent,
    validateEverything,
    reset,
    markSaved,
    requiresChargers,
  };
}
