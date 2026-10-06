import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button, IconButton, type ButtonVariant } from '@/components/ui/Button';
import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from '@/components/ui/Field';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Stepper, StepperFooter } from '@/components/ui/Stepper';
import { CalendarPanel, DateInput, DateRangeInput } from '@/components/ui/DatePicker';
import { FileUpload, ImageUpload } from '@/components/ui/Upload';
import { Section, Specimen, SpecimenGrid, TokenList, Variant, VariantRow } from '../Specimen';

const VARIANT_LABELS: { variant: ButtonVariant; caption: string }[] = [
  { variant: 'primary', caption: 'Primary — the one committing action on a screen' },
  { variant: 'secondary', caption: 'Secondary / outline — the default button' },
  { variant: 'ghost', caption: 'Ghost / text — toolbar and row actions' },
  { variant: 'subtle', caption: 'Subtle — tinted, for a secondary brand action' },
  { variant: 'accent', caption: 'Accent — saffron, used sparingly' },
  { variant: 'danger', caption: 'Destructive — delete, revoke, force-stop' },
];

/* -------------------------------------------------------------------------- */

export function ButtonsSection() {
  return (
    <Section
      id="buttons"
      title="Buttons"
      description="Six variants, four heights. One primary per screen; everything else is secondary, ghost or destructive. Hover and active states are rendered statically below (via the component's own `state` prop) so they are captured rather than hidden behind a pointer."
    >
      <SpecimenGrid columns={2}>
        {VARIANT_LABELS.map(({ variant, caption }) => (
          <Specimen key={variant} label={variant} note={caption} span={2}>
            <VariantRow>
              <Variant label="default">
                <Button variant={variant}>Dispatch command</Button>
              </Variant>
              <Variant label="hover">
                <Button variant={variant} state="hover">
                  Dispatch command
                </Button>
              </Variant>
              <Variant label="active">
                <Button variant={variant} state="active">
                  Dispatch command
                </Button>
              </Variant>
              <Variant label="with icon">
                <Button variant={variant} icon={<Zap className="h-3.5 w-3.5" />}>
                  Remote start
                </Button>
              </Variant>
              <Variant label="loading">
                <Button variant={variant} loading>
                  Sending…
                </Button>
              </Variant>
              <Variant label="disabled">
                <Button variant={variant} disabled>
                  Dispatch command
                </Button>
              </Variant>
            </VariantRow>
          </Specimen>
        ))}

        <Specimen label="Sizes" note="xs 28 · sm 32 · md 36 · lg 44 — all four align on a shared baseline" span={2}>
          <VariantRow>
            <Variant label="xs">
              <Button variant="primary" size="xs" icon={<Plus className="h-3 w-3" />}>
                Add
              </Button>
            </Variant>
            <Variant label="sm">
              <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                Add charge point
              </Button>
            </Variant>
            <Variant label="md (default)">
              <Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
                Add charge point
              </Button>
            </Variant>
            <Variant label="lg">
              <Button variant="primary" size="lg" icon={<Plus className="h-4 w-4" />}>
                Add charge point
              </Button>
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Groups" note="Dialog footer and page-header action patterns">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Button>Cancel</Button>
              <Button variant="primary">Save changes</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" icon={<Download className="h-3.5 w-3.5" />}>
                Export CSV
              </Button>
              <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                New location
              </Button>
            </div>
          </div>
        </Specimen>

        <Specimen label="Full width" note="fullWidth — sign-in and drawer footers">
          <div className="w-full max-w-xs">
            <Button variant="primary" fullWidth>
              Sign in
            </Button>
          </div>
        </Specimen>
      </SpecimenGrid>

      <div className="mt-5">
        <TokenList
          rows={[
            { token: 'variant="primary"', value: 'bg-brand-900 → hover brand-800', role: 'Commit action' },
            { token: 'variant="secondary"', value: 'bg-white · border ink-300', role: 'Default / outline' },
            { token: 'variant="ghost"', value: 'transparent → hover ink-100', role: 'Text button' },
            { token: 'variant="subtle"', value: 'bg-brand-50 · border brand-100', role: 'Tinted secondary' },
            { token: 'variant="accent"', value: 'bg-accent-400 · text brand-900', role: 'Highlight action' },
            { token: 'variant="danger"', value: 'bg-danger-500 → hover danger-700', role: 'Destructive' },
          ]}
        />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function IconButtonsSection() {
  return (
    <Section
      id="icon-buttons"
      title="Icon buttons"
      description="Square controls that share the button variants exactly. They are only ever used where the action is obvious from context — a row's overflow menu, a dialog close, a table refresh — and always carry an accessible label and a native tooltip."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Variants" note="Same colour tokens as Button" span={2}>
          <VariantRow>
            {(['ghost', 'secondary', 'primary', 'subtle', 'accent', 'danger'] as ButtonVariant[]).map((variant) => (
              <Variant key={variant} label={variant}>
                <IconButton label="Edit" variant={variant}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
              </Variant>
            ))}
          </VariantRow>
        </Specimen>

        <Specimen label="States" note="Rendered statically — not hover-only">
          <VariantRow>
            <Variant label="default">
              <IconButton label="Refresh">
                <RefreshCcw className="h-4 w-4" />
              </IconButton>
            </Variant>
            <Variant label="hover">
              <IconButton label="Refresh" state="hover">
                <RefreshCcw className="h-4 w-4" />
              </IconButton>
            </Variant>
            <Variant label="active">
              <IconButton label="Refresh" state="active">
                <RefreshCcw className="h-4 w-4" />
              </IconButton>
            </Variant>
            <Variant label="disabled">
              <IconButton label="Refresh" disabled>
                <RefreshCcw className="h-4 w-4" />
              </IconButton>
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Sizes" note="xs 24 · sm 32 · md 36 · lg 44">
          <VariantRow>
            <Variant label="xs">
              <IconButton label="More" size="xs">
                <MoreHorizontal className="h-3 w-3" />
              </IconButton>
            </Variant>
            <Variant label="sm">
              <IconButton label="More" size="sm">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </Variant>
            <Variant label="md">
              <IconButton label="More" size="md">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            </Variant>
            <Variant label="lg">
              <IconButton label="More" size="lg">
                <MoreHorizontal className="h-4.5 w-4.5" />
              </IconButton>
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Row action cluster" note="The pattern used at the end of a table row" span={2}>
          <div className="flex items-center gap-1">
            <IconButton label="View">
              <Copy className="h-4 w-4" />
            </IconButton>
            <IconButton label="Edit">
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton label="Delete" variant="ghost" className="text-danger-500 hover:bg-danger-50 hover:text-danger-700">
              <Trash2 className="h-4 w-4" />
            </IconButton>
            <IconButton label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function InputsSection() {
  return (
    <Section
      id="inputs"
      title="Inputs"
      description="One text-control skin (`CONTROL_BASE`) is shared by inputs, textareas, selects, autocomplete and date inputs — same 36px height, 7px radius, ink-300 border and brand focus ring. Every state below is pinned via the component's `state` prop rather than being demonstrated on hover."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Default">
          <Field label="Charge point name" className="w-full" htmlFor="ds-in-1">
            <Input id="ds-in-1" placeholder="e.g. Dubai Marina Hub 01" />
          </Field>
        </Specimen>
        <Specimen label="Hover" note="state=&quot;hover&quot;">
          <Field label="Charge point name" className="w-full">
            <Input state="hover" placeholder="e.g. Dubai Marina Hub 01" />
          </Field>
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <Field label="Charge point name" className="w-full">
            <Input state="focus" placeholder="e.g. Dubai Marina Hub 01" />
          </Field>
        </Specimen>
        <Specimen label="Filled">
          <Field label="Charge point name" className="w-full">
            <Input defaultValue="Dubai Marina Hub 01" />
          </Field>
        </Specimen>
        <Specimen label="With hint">
          <Field label="OCPP identity" hint="Must match the identity configured on the charger." className="w-full">
            <Input defaultValue="EVG-AE-0142" />
          </Field>
        </Specimen>
        <Specimen label="Required">
          <Field label="Serial number" required className="w-full">
            <Input placeholder="Vendor serial" />
          </Field>
        </Specimen>
        <Specimen label="Error" note="invalid + Field error">
          <Field label="OCPP identity" error="This identity is already registered in this tenant." className="w-full">
            <Input invalid defaultValue="EVG-AE-0142" />
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <Field label="Tenant" className="w-full">
            <Input disabled defaultValue="EV Gate Mobility" />
          </Field>
        </Specimen>
        <Specimen label="Read only">
          <Field label="Created" hint="System-managed" className="w-full">
            <Input readOnly defaultValue="14 Feb 2026, 09:41" className="bg-ink-50 text-ink-600" />
          </Field>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function TextareaSection() {
  return (
    <Section
      id="textareas"
      title="Text areas"
      description="Three rows by default, resizable vertically only. Used for maintenance notes, alert resolutions, push-notification bodies and address lines."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Default">
          <Field label="Resolution note" className="w-full">
            <Textarea placeholder="What was done to resolve the incident?" />
          </Field>
        </Specimen>
        <Specimen label="Filled">
          <Field label="Resolution note" hint="Visible to the company admin." className="w-full">
            <Textarea defaultValue="Replaced the type-2 cable on EVSE 2 and re-ran a diagnostics upload. Connector back to Available at 11:20." />
          </Field>
        </Specimen>
        <Specimen label="Error">
          <Field label="Resolution note" error="A resolution note is required before closing a ticket." className="w-full">
            <Textarea invalid />
          </Field>
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <Field label="Resolution note" className="w-full">
            <Textarea state="focus" defaultValue="Awaiting parts from the vendor." />
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <Field label="Resolution note" className="w-full">
            <Textarea disabled defaultValue="Closed automatically by the platform." />
          </Field>
        </Specimen>
        <Specimen label="Read only">
          <Field label="Original report" className="w-full">
            <Textarea readOnly className="bg-ink-50 text-ink-600" defaultValue="Driver reported the connector would not unlock after the session ended." />
          </Field>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SelectsSection() {
  const options = (
    <>
      <option>Available</option>
      <option>Charging</option>
      <option>Faulted</option>
      <option>Offline</option>
    </>
  );
  return (
    <Section
      id="selects"
      title="Selects"
      description="A native select with the chevron drawn as a background image, so it inherits platform keyboard behaviour while matching the input skin. The chevron flips to the left edge in RTL. In a filter bar the select is always wrapped in a fixed-width box — the control itself is w-full by design."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Default">
          <Field label="Connector status" className="w-full">
            <Select defaultValue="Available">{options}</Select>
          </Field>
        </Specimen>
        <Specimen label="Hover" note="state=&quot;hover&quot;">
          <Field label="Connector status" className="w-full">
            <Select state="hover" defaultValue="Available">
              {options}
            </Select>
          </Field>
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <Field label="Connector status" className="w-full">
            <Select state="focus" defaultValue="Charging">
              {options}
            </Select>
          </Field>
        </Specimen>
        <Specimen label="Placeholder" note="Empty option acts as the filter label">
          <Field label="Connector status" className="w-full">
            <Select defaultValue="">
              <option value="">All statuses</option>
              {options}
            </Select>
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <Field label="Connector status" className="w-full">
            <Select disabled defaultValue="Available">
              {options}
            </Select>
          </Field>
        </Specimen>
        <Specimen label="Segmented control" note="For 2–4 mutually exclusive views">
          <SegmentedControlDemo />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

function SegmentedControlDemo() {
  const [value, setValue] = useState<'day' | 'week' | 'month'>('week');
  return (
    <SegmentedControl
      value={value}
      onChange={setValue}
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */

const AC_OPTIONS = [
  { value: 'dxb-marina', label: 'Dubai Marina Hub', hint: '12 charge points' },
  { value: 'dxb-jbr', label: 'JBR The Walk', hint: '6 charge points' },
  { value: 'auh-corniche', label: 'Abu Dhabi Corniche', hint: '9 charge points' },
  { value: 'shj-al-majaz', label: 'Al Majaz Waterfront', hint: '4 charge points' },
];

export function AutocompleteSection() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Section
      id="autocomplete"
      title="Autocomplete"
      description="Type-ahead single select for long lists — locations, drivers, charge points, RFID tags. It shares the input skin and the menu surface, so nothing new is invented; the open panel is rendered statically in the third specimen."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Closed" note="Interactive — click to search">
          <Field label="Location" className="w-full">
            <Autocomplete options={AC_OPTIONS} value={value} onChange={setValue} placeholder="Search locations…" />
          </Field>
        </Specimen>
        <Specimen label="Selected">
          <Field label="Location" className="w-full">
            <Autocomplete options={AC_OPTIONS} value="dxb-marina" onChange={() => {}} />
          </Field>
        </Specimen>
        <Specimen label="Open" note="openPanel — pinned for capture" className="min-h-[280px]">
          <Field label="Location" className="w-full">
            <Autocomplete options={AC_OPTIONS} value="dxb-jbr" onChange={() => {}} openPanel />
          </Field>
        </Specimen>
        <Specimen label="Error">
          <Field label="Location" error="Select a location before saving." className="w-full">
            <Autocomplete options={AC_OPTIONS} value={null} onChange={() => {}} invalid />
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <Field label="Location" className="w-full">
            <Autocomplete options={AC_OPTIONS} value="auh-corniche" onChange={() => {}} disabled />
          </Field>
        </Specimen>
        <Specimen label="No matches">
          <Field label="Location" className="w-full">
            <Autocomplete options={[]} value={null} onChange={() => {}} openPanel emptyLabel="No locations in this company" />
          </Field>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function DatePickersSection() {
  return (
    <Section
      id="date-pickers"
      title="Date pickers"
      description="A skinned native date control gives keyboard entry, locale formatting and the OS picker for free. Where a screen needs an inline calendar — reservation windows, report ranges — the month grid below is used; its day states are all visible, not hover-dependent."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Default">
          <Field label="Effective from" className="w-full">
            <DateInput value="2026-08-01" onChange={() => {}} />
          </Field>
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <Field label="Effective from" className="w-full">
            <DateInput value="2026-08-01" onChange={() => {}} state="focus" />
          </Field>
        </Specimen>
        <Specimen label="Error">
          <Field label="Effective from" error="Cannot start before the tariff is published." className="w-full">
            <DateInput value="2026-07-01" onChange={() => {}} invalid />
          </Field>
        </Specimen>
        <Specimen label="Read only">
          <Field label="Issued" className="w-full">
            <DateInput value="2026-06-30" onChange={() => {}} readOnly />
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <Field label="Effective from" className="w-full">
            <DateInput value="2026-08-01" onChange={() => {}} disabled />
          </Field>
        </Specimen>
        <Specimen label="Range" note="Report and settlement filters">
          <Field label="Period" className="w-full">
            <DateRangeInput from="2026-08-01" to="2026-08-25" onChange={() => {}} />
          </Field>
        </Specimen>
        <Specimen label="Calendar — single date" align="center">
          <CalendarPanel value="2026-08-14" month={{ year: 2026, month: 7 }} />
        </Specimen>
        <Specimen label="Calendar — range" align="center">
          <CalendarPanel month={{ year: 2026, month: 7 }} selectedRange={{ from: '2026-08-10', to: '2026-08-19' }} />
        </Specimen>
        <Specimen label="Calendar — past disabled" align="center">
          <CalendarPanel value="2026-08-26" month={{ year: 2026, month: 7 }} disabledBefore="2026-08-26" />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function CheckboxesSection() {
  const [checked, setChecked] = useState(true);
  return (
    <Section
      id="checkboxes"
      title="Checkboxes"
      description="Native inputs tinted with the brand purple through `accent-color`, so the platform's own focus and keyboard behaviour is preserved. The indeterminate state drives the select-all cell in every data table."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="States" span={2}>
          <VariantRow>
            <Variant label="unchecked">
              <Checkbox checked={false} onChange={() => {}} label="Notify on fault" />
            </Variant>
            <Variant label="checked">
              <Checkbox checked onChange={() => {}} label="Notify on fault" />
            </Variant>
            <Variant label="indeterminate">
              <Checkbox checked={false} indeterminate onChange={() => {}} label="Select all rows" />
            </Variant>
            <Variant label="disabled">
              <Checkbox checked={false} disabled onChange={() => {}} label="Notify on fault" />
            </Variant>
            <Variant label="disabled + checked">
              <Checkbox checked disabled onChange={() => {}} label="Notify on fault" />
            </Variant>
            <Variant label="no label">
              <Checkbox checked={checked} onChange={setChecked} />
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Privilege list" note="How it appears in Roles → privileges">
          <div className="flex flex-col gap-2">
            <Checkbox checked onChange={() => {}} label="stations.view" />
            <Checkbox checked onChange={() => {}} label="stations.create" />
            <Checkbox checked={false} onChange={() => {}} label="stations.delete" />
            <Checkbox checked={false} disabled onChange={() => {}} label="tenants.manage" />
          </div>
        </Specimen>

        <Specimen label="Radio group — vertical" note="One choice from a short list">
          <RadioGroupDemo />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

function RadioGroupDemo() {
  const [value, setValue] = useState('cpo');
  return (
    <RadioGroup
      name="ds-company-type"
      value={value}
      onChange={setValue}
      options={[
        { value: 'cpo', label: 'CPO', hint: 'Operates charge points' },
        { value: 'emsp', label: 'eMSP', hint: 'Serves drivers and issues RFID' },
        { value: 'both', label: 'CPO + eMSP', hint: 'Both roles under one company' },
      ]}
    />
  );
}

export function RadiosSection() {
  const [value, setValue] = useState<'ac' | 'dc'>('dc');
  return (
    <Section
      id="radios"
      title="Radio buttons"
      description="Used when the options must all stay visible and there are five or fewer — connector current type, refund destination, settlement cadence. Beyond that, a select."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Vertical" note="Default orientation">
          <RadioGroup
            name="ds-refund"
            value="wallet"
            onChange={() => {}}
            options={[
              { value: 'wallet', label: 'Credit the driver wallet', hint: 'Instant, stays inside the platform' },
              { value: 'card', label: 'Refund to the original card', hint: '3–5 working days via the PSP' },
              { value: 'manual', label: 'Manual bank transfer', hint: 'Requires finance approval' },
            ]}
          />
        </Specimen>
        <Specimen label="Horizontal" note="orientation=&quot;horizontal&quot;">
          <RadioGroup
            name="ds-current"
            value={value}
            onChange={setValue}
            orientation="horizontal"
            options={[
              { value: 'ac', label: 'AC' },
              { value: 'dc', label: 'DC' },
            ]}
          />
        </Specimen>
        <Specimen label="States" span={2}>
          <VariantRow>
            <Variant label="unselected">
              <RadioGroup name="ds-r1" value="b" onChange={() => {}} options={[{ value: 'a', label: 'Type 2' }]} />
            </Variant>
            <Variant label="selected">
              <RadioGroup name="ds-r2" value="a" onChange={() => {}} options={[{ value: 'a', label: 'Type 2' }]} />
            </Variant>
            <Variant label="disabled">
              <RadioGroup name="ds-r3" value="b" onChange={() => {}} options={[{ value: 'a', label: 'CHAdeMO', disabled: true }]} />
            </Variant>
            <Variant label="disabled + selected">
              <RadioGroup name="ds-r4" value="a" onChange={() => {}} options={[{ value: 'a', label: 'CCS2', disabled: true }]} />
            </Variant>
          </VariantRow>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SwitchesSection() {
  const [on, setOn] = useState(true);
  return (
    <Section
      id="switches"
      title="Switches"
      description="A switch commits immediately — it is for settings that take effect the moment they are flipped (module enabled, notifications on, demo simulation running). Anything that needs a Save belongs in a checkbox."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="States" span={2}>
          <VariantRow>
            <Variant label="off">
              <Switch checked={false} onChange={() => {}} />
            </Variant>
            <Variant label="on">
              <Switch checked onChange={() => {}} />
            </Variant>
            <Variant label="disabled off">
              <Switch checked={false} disabled onChange={() => {}} />
            </Variant>
            <Variant label="disabled on">
              <Switch checked disabled onChange={() => {}} />
            </Variant>
            <Variant label="interactive">
              <Switch checked={on} onChange={setOn} />
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="With label and hint" note="The form pattern used in Settings" span={2}>
          <div className="flex w-full flex-col gap-3.5">
            <Switch checked onChange={() => {}} label="Live simulation" hint="Active sessions accrue energy every few seconds." />
            <Switch checked onChange={() => {}} label="Fault alerts" hint="Raise an incident when a connector reports Faulted." />
            <Switch checked={false} onChange={() => {}} label="Auto-approve refunds under AED 50" hint="Skips finance review for small amounts." />
            <Switch checked={false} disabled onChange={() => {}} label="OCPI roaming" hint="Not included in this tenant's plan." />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SearchSection() {
  const [q, setQ] = useState('');
  return (
    <Section
      id="search"
      title="Search"
      description="One search control across the product: a leading magnifier, a trailing clear button that appears once there is a value, and the shared control skin. Table search filters the current dataset client-side; the ⌘K command palette searches across records."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Empty">
          <SearchInput value="" onChange={() => {}} placeholder="Search charge points…" className="w-full" />
        </Specimen>
        <Specimen label="Filled" note="Clear button appears">
          <SearchInput value="EVG-AE-01" onChange={() => {}} placeholder="Search charge points…" className="w-full" />
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <SearchInput value="" onChange={() => {}} state="focus" placeholder="Search charge points…" className="w-full" />
        </Specimen>
        <Specimen label="Interactive">
          <SearchInput value={q} onChange={setQ} placeholder="Try typing…" className="w-full" />
        </Specimen>
        <Specimen label="Disabled">
          <SearchInput value="" onChange={() => {}} disabled placeholder="Search charge points…" className="w-full" />
        </Specimen>
        <Specimen label="Command palette trigger" note="Topbar — opens ⌘K">
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-ink-200 bg-ink-50/70 px-3 text-[12.5px] text-ink-400 transition-colors hover:border-ink-300 hover:bg-white"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 truncate text-start">Search charge points, drivers, transactions…</span>
            <kbd className="rounded border border-ink-200 bg-white px-1 text-[10px] text-ink-400">⌘K</kbd>
          </button>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function UploadSection() {
  return (
    <Section
      id="file-upload"
      title="File upload & image upload"
      description="A dashed dropzone for data imports (RFID batches, driver lists, tariff CSVs) and a square picker for brand assets. Every stage of an upload is rendered below rather than being reachable only by actually uploading something."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Dropzone — idle">
          <FileUpload className="w-full" />
        </Specimen>
        <Specimen label="Dropzone — dragging" note="state=&quot;dragging&quot;">
          <FileUpload className="w-full" state="dragging" />
        </Specimen>
        <Specimen label="Uploading" note="state=&quot;uploading&quot;">
          <FileUpload className="w-full" state="uploading" progress={62} fileName="rfid-batch-aug.csv" />
        </Specimen>
        <Specimen label="Complete" note="state=&quot;complete&quot;">
          <FileUpload className="w-full" state="complete" fileName="rfid-batch-aug.csv" onClear={() => {}} />
        </Specimen>
        <Specimen label="Error" note="state=&quot;error&quot;">
          <FileUpload
            className="w-full"
            state="error"
            fileName="drivers-import.xlsx"
            errorMessage="Row 42: emirates_id is required."
            onClear={() => {}}
          />
        </Specimen>
        <Specimen label="Restricted accept" note="Single file, CSV only">
          <FileUpload className="w-full" accept=".csv" label="Drop a CSV to import tariffs" hint="One tariff per row · max 2 MB" />
        </Specimen>
        <Specimen label="Image — empty">
          <ImageUpload />
        </Specimen>
        <Specimen label="Image — filled">
          <ImageUpload
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%232a0944'/%3E%3Ctext x='48' y='56' font-family='sans-serif' font-size='28' fill='%23f9bf58' text-anchor='middle'%3EEV%3C/text%3E%3C/svg%3E"
            onClear={() => {}}
          />
        </Specimen>
        <Specimen label="Image — disabled">
          <ImageUpload disabled hint="Logo is managed by the tenant." />
        </Specimen>
        <Specimen label="Import summary" note="What follows a successful upload">
          <div className="flex w-full items-center gap-2.5 rounded-[10px] border border-success-100 bg-success-50 p-3">
            <Check className="h-4 w-4 shrink-0 text-success-500" />
            <p className="text-[12.5px] text-ink-700">
              <span className="font-medium text-success-700">218 RFID cards imported.</span> 3 rows skipped as duplicates.
            </p>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const SERVICE_OPTIONS = [
  { value: 'ev-charging', label: 'EV Charging' },
  { value: 'fleet', label: 'Fleet Management' },
  { value: 'energy', label: 'Energy Management' },
  { value: 'parking', label: 'Parking Operations' },
  { value: 'roaming', label: 'Roaming & Interoperability' },
  { value: 'solar', label: 'Solar & Storage' },
  { value: 'facility', label: 'Facility Management' },
];

export function MultiSelectSection() {
  const [few, setFew] = useState<string[]>(['ev-charging', 'fleet']);
  const [many, setMany] = useState<string[]>(['ev-charging', 'fleet', 'energy', 'parking', 'roaming', 'solar']);

  return (
    <Section
      id="multi-select"
      title="Multi select"
      description="The sibling of Autocomplete: same control skin, same listbox surface, selections accumulate as removable chips. Beyond `summaryThreshold` the tail collapses to a count so the control never grows unbounded inside a form grid. Backspace on an empty query removes the last chip."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Default" note="Two selections">
          <Field label="Service to provide" required className="w-full">
            <MultiSelect options={SERVICE_OPTIONS} value={few} onChange={setFew} placeholder="Select services" />
          </Field>
        </Specimen>
        <Specimen label="Empty">
          <Field label="Service to provide" hint="Pick every service this company operates." className="w-full">
            <MultiSelect options={SERVICE_OPTIONS} value={[]} onChange={() => {}} placeholder="Select services" />
          </Field>
        </Specimen>
        <Specimen label="Collapsed tail" note="summaryThreshold=4">
          <MultiSelect className="w-full" options={SERVICE_OPTIONS} value={many} onChange={setMany} />
        </Specimen>
        <Specimen label="Invalid" note="invalid + Field error">
          <Field label="Service to provide" required error="Select at least one service." className="w-full">
            <MultiSelect options={SERVICE_OPTIONS} value={[]} onChange={() => {}} invalid />
          </Field>
        </Specimen>
        <Specimen label="Hover" note="state=&quot;hover&quot;">
          <MultiSelect className="w-full" options={SERVICE_OPTIONS} value={['ev-charging']} onChange={() => {}} state="hover" />
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <MultiSelect className="w-full" options={SERVICE_OPTIONS} value={['ev-charging']} onChange={() => {}} state="focus" />
        </Specimen>
        <Specimen label="Disabled">
          <MultiSelect className="w-full" options={SERVICE_OPTIONS} value={['ev-charging']} onChange={() => {}} disabled />
        </Specimen>
        <Specimen label="Capped" note="max=2 — the rest disable">
          <MultiSelect className="w-full" options={SERVICE_OPTIONS} value={['ev-charging', 'fleet']} onChange={() => {}} max={2} />
        </Specimen>
        <Specimen label="Open" note="openPanel — the listbox pinned open" span={2}>
          <div className="h-64 w-full max-w-sm">
            <MultiSelect options={SERVICE_OPTIONS} value={['ev-charging', 'energy']} onChange={() => {}} openPanel />
          </div>
        </Specimen>
      </SpecimenGrid>
      <TokenList
        rows={[
          { token: 'chip', value: 'bg-brand-50 · ring-brand-100 · text-brand-800', role: 'A selection' },
          { token: 'tail', value: 'bg-ink-100 · text-ink-600', role: 'The collapsed count' },
          { token: 'tick', value: 'border-brand-800 bg-brand-800', role: 'Selected row in the listbox' },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const DIAL_CODES = [
  { code: 'AE', label: 'United Arab Emirates', dial: '+971' },
  { code: 'SA', label: 'Saudi Arabia', dial: '+966' },
  { code: 'JO', label: 'Jordan', dial: '+962' },
  { code: 'EG', label: 'Egypt', dial: '+20' },
  { code: 'GB', label: 'United Kingdom', dial: '+44' },
];

export function PhoneSection() {
  const [phone, setPhone] = useState({ country: 'AE', number: '50 123 4567' });

  return (
    <Section
      id="phone-input"
      title="Phone input"
      description="A dial code and a national number reading as one control: one border, one focus ring, a logical `border-e` between the halves so the pair mirrors in RTL. The number is pinned `dir=&quot;ltr&quot;` and `tnum` — a phone number is a Latin figure sequence even inside Arabic prose."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Default">
          <Field label="Phone number" required className="w-full">
            <PhoneInput value={phone} onChange={setPhone} codes={DIAL_CODES} />
          </Field>
        </Specimen>
        <Specimen label="Empty">
          <PhoneInput className="w-full" value={{ country: 'AE', number: '' }} onChange={() => {}} codes={DIAL_CODES} />
        </Specimen>
        <Specimen label="Hover" note="state=&quot;hover&quot;">
          <PhoneInput className="w-full" value={phone} onChange={() => {}} codes={DIAL_CODES} state="hover" />
        </Specimen>
        <Specimen label="Focus" note="state=&quot;focus&quot;">
          <PhoneInput className="w-full" value={phone} onChange={() => {}} codes={DIAL_CODES} state="focus" />
        </Specimen>
        <Specimen label="Invalid" note="invalid + Field error">
          <Field label="Phone number" required error="Enter a valid number." className="w-full">
            <PhoneInput value={{ country: 'AE', number: '12' }} onChange={() => {}} codes={DIAL_CODES} invalid />
          </Field>
        </Specimen>
        <Specimen label="Disabled">
          <PhoneInput className="w-full" value={phone} onChange={() => {}} codes={DIAL_CODES} disabled />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const STEPS = [
  { key: 'company', label: 'Company', description: 'Identity & scale' },
  { key: 'details', label: 'Additional details', description: 'Sectors & contact' },
  { key: 'admin', label: 'Admin account', description: 'The first user' },
  { key: 'records', label: 'Contacts & documents', description: 'People & paperwork' },
  { key: 'review', label: 'Review', description: 'Check and submit' },
];

export function StepperSection() {
  const [current, setCurrent] = useState(2);

  return (
    <Section
      id="stepper"
      title="Stepper"
      description="Progress through a long, sectioned task — a registration, an onboarding wizard, a guided import. Horizontal on `sm` and up, vertical below, so a five-step flow stays legible on a phone. The connector is drawn with logical properties and mirrors in RTL. Pass `onSelect` to let a person walk back through completed steps; leave it out for a strictly linear flow."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="In progress" note="Step 3 of 5, earlier steps navigable" span={2}>
          <Stepper className="w-full" steps={STEPS} current={current} onSelect={setCurrent} />
        </Specimen>
        <Specimen label="First step" span={2}>
          <Stepper className="w-full" steps={STEPS} current={0} />
        </Specimen>
        <Specimen label="A step in error" note="status=&quot;error&quot; — validation failed on a step already visited" span={2}>
          <Stepper
            className="w-full"
            steps={STEPS.map((s, i) => (i === 1 ? { ...s, status: 'error' as const } : s))}
            current={3}
          />
        </Specimen>
        <Specimen label="Complete" span={2}>
          <Stepper className="w-full" steps={STEPS} current={STEPS.length} />
        </Specimen>
        <Specimen label="Vertical" note="orientation=&quot;vertical&quot; — a drawer or a narrow rail">
          <Stepper className="w-full" steps={STEPS} current={2} orientation="vertical" />
        </Specimen>
        <Specimen label="Footer" note="Back at the start, the committing action at the end">
          <StepperFooter
            className="w-full"
            start={<Button variant="ghost">Back</Button>}
            end={
              <>
                <Button>Save draft</Button>
                <Button variant="primary">Continue</Button>
              </>
            }
          />
        </Specimen>
      </SpecimenGrid>
      <TokenList
        rows={[
          { token: 'complete', value: 'border-brand-800 bg-brand-800 text-white', role: 'A step already done' },
          { token: 'current', value: 'border-brand-800 bg-white text-brand-900', role: 'Where the person is' },
          { token: 'upcoming', value: 'border-ink-300 bg-white text-ink-400', role: 'Not yet reached' },
          { token: 'error', value: 'border-danger-500 bg-danger-50 text-danger-700', role: 'A visited step that failed validation' },
        ]}
      />
    </Section>
  );
}
