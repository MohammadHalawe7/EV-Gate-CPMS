# Registration module

The first module of EV Gate CPMS. It produces a **Company** (and its first
**Company Admin**) at the third level of the hierarchy:

```
Platform → Tenants → Companies → Locations → Chargers / EVSEs / Connectors
```

## Three onboarding channels, one record

| Channel | Who starts it | Route | Status |
|---|---|---|---|
| `self` | A company, from outside the platform | `/register` | **built** |
| `demo` | A company asking a Tenant or the Platform for a demo | `/request-demo` | intake built, provisioning later |
| `internal` | A Platform or Tenant Admin, from inside | `/registrations/new` | reserved — the form already takes `mode="internal"` |

`CompanyRegistrationForm` is channel-agnostic. `mode` changes the chrome and
the committing verb ("Submit application" vs "Create company"); the fields are
identical, so the internal route is a route, not a rewrite.

## Lifecycle

```
Draft ──▶ Submitted ──▶ UnderReview ──▶ Approved
  │           │              │
  │           │              └──▶ Rejected ──▶ Submitted (resubmit)
  │           └──▶ Withdrawn
  └──▶ Withdrawn

Demo ──▶ Converted        (a live demo account becoming a full account)
Demo ──▶ Rejected
```

`REGISTRATION_TRANSITIONS` in `src/domain/registration.ts` is the single source
for what may follow what — the UI reads it rather than testing statuses inline.
Tones come from the shared `STATUS_TONES` map in `components/ui/Badge.tsx`.

## Transactional email

`REGISTRATION_EMAILS` declares the eight messages the flow triggers — submitted,
status updated, approved, rejected, account created, set password, reset
password, first login — with their trigger and recipient. Nothing is sent; the
Notifications module binds to this list later.

## Routes

| Path | Screen |
|---|---|
| `/login` | Sign in |
| `/forgot-password` | Request a reset link |
| `/request-demo` | Demo request intake |
| `/register` | Company self-registration (5 steps) |
| `/register/submitted` | Confirmation + reference + what happens next |
| `/registration-status` | Track an application by reference |

Paths live in `routes.ts`, so a link is written once.

## Files

```
useRegistrationForm.ts     draft, step, errors, touched, dependent-lookup resets, autosave
validation.ts              per-step and per-sub-record rules; messages are i18n keys
routes.ts                  path constants
components/
  CompanyRegistrationForm  the wizard: stepper, footer, confirm, submit
  LookupField              lookup-backed adapters over Autocomplete / MultiSelect / Select
  ContactsPanel            other contacts — table + add / edit / view / delete
  DocumentsPanel           legal documents — table + add / edit / view / delete
  steps/                   one component per step
pages/                     one component per route
```

## Rules this module follows

- **No hard-coded reference data.** Every country, city, sector, department,
  position, service, employee band, gender and document type is a lookup id
  resolved through `src/data/lookups.ts`. Dependent lookups (city→country,
  sub sector→main sector, position→department) are declared there too, and the
  form clears the child whenever its parent changes.
- **Conditional by data, not by name.** "Number of chargers" appears because a
  selected service carries `meta.requiresChargers`, not because someone tested
  for the string "EV Charging".
- **No new visual language.** Every control comes from `src/components/**`.
  The three genuinely new ones — `Stepper`, `MultiSelect`, `PhoneInput` — were
  added to the design system proper and appear in `/design-system`.
- **Both dictionaries.** Every string is a key in `en.ts` *and* `ar.ts`; the
  Arabic file is typed, so a missing translation is a build error.

## Not built yet

The review queue (`/registrations`), approve / reject / convert-to-full, real
provisioning, and file storage. `decide()` in
`src/data/registrationService.ts` is the seam they will use.
