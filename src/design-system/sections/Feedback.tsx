import { useState } from 'react';
import { Inbox, MapPinOff, Plus, ShieldAlert, Trash2, Zap } from 'lucide-react';
import { Badge, SeverityDot, StatusBadge, type Tone } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Tooltip, TooltipBubble } from '@/components/ui/Tooltip';
import { ToastCard, useToast } from '@/components/ui/Toast';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog, DialogSurface, Drawer, DrawerSurface, Modal } from '@/components/ui/Overlay';
import { DetailList, EmptyState, Panel, PanelHeader } from '@/components/ui/Surface';
import { ErrorState, LoadingState, StatSkeleton, TableSkeleton } from '@/components/ui/States';
import { Field, Input, Select } from '@/components/ui/Field';
import { Section, Specimen, SpecimenGrid, Variant, VariantRow } from '../Specimen';

/* -------------------------------------------------------------------------- */
/* Status chips                                                                */
/* -------------------------------------------------------------------------- */

const STATUS_GROUPS: { title: string; note: string; statuses: string[] }[] = [
  {
    title: 'Connector · OCPP 1.6 / 2.x',
    note: 'StatusNotification values reported by the charge point',
    statuses: ['Available', 'Preparing', 'Charging', 'SuspendedEV', 'SuspendedEVSE', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
  },
  {
    title: 'Charge point',
    note: 'Connectivity and lifecycle of the station itself',
    statuses: ['Online', 'Offline', 'Maintenance', 'Provisioning'],
  },
  {
    title: 'Entity',
    note: 'Tenants, companies, users, RFID cards, tariffs',
    statuses: ['Active', 'Inactive', 'Suspended', 'Draft', 'Archived', 'Blocked', 'Invited', 'Frozen'],
  },
  {
    title: 'Charging session',
    note: 'Lifecycle of a live session',
    statuses: ['Starting', 'Charging', 'Suspended', 'Stopping', 'Completed', 'Failed'],
  },
  {
    title: 'Transaction & payment',
    note: 'Commercial record derived from the session',
    statuses: ['InProgress', 'Completed', 'PendingSettlement', 'Authorized', 'Captured', 'Settled', 'Refunded', 'PartiallyRefunded', 'Disputed', 'Voided', 'Failed'],
  },
  {
    title: 'Invoice & settlement',
    note: 'Finance module',
    statuses: ['Draft', 'Issued', 'Paid', 'Overdue', 'Void', 'Pending', 'Approved', 'Processing', 'Processed', 'OnHold'],
  },
  {
    title: 'Reservation & authorisation',
    note: 'ReserveNow and idTag results',
    statuses: ['Active', 'Used', 'Expired', 'Cancelled', 'Rejected', 'Accepted', 'Invalid'],
  },
  {
    title: 'Alert, ticket & command',
    note: 'Operations queues',
    statuses: ['Open', 'Acknowledged', 'Resolved', 'Suppressed', 'Scheduled', 'AwaitingParts', 'Closed', 'Queued', 'Sent', 'TimedOut'],
  },
  {
    title: 'Firmware & diagnostics',
    note: 'OCPP file transfer state machines',
    statuses: ['Idle', 'Downloading', 'Downloaded', 'Installing', 'Installed', 'DownloadFailed', 'InstallationFailed', 'Uploading', 'Uploaded', 'UploadFailed'],
  },
  {
    title: 'Health & severity',
    note: 'System health and incident severity',
    statuses: ['Operational', 'Degraded', 'Down', 'Critical', 'Major', 'Minor', 'Info'],
  },
];

const TONES: Tone[] = ['neutral', 'brand', 'purple', 'accent', 'plum', 'success', 'warning', 'danger', 'info'];

export function BadgesSection() {
  return (
    <Section
      id="status-chips"
      title="Status chips & badges"
      description="One badge component, nine tones, and a single shared status → tone map (`statusTone`) that the whole product reads. A given status therefore looks identical in a table cell, on the map, in a detail header and inside a chart legend. Colour is never the only signal — every status badge carries a dot and its own label."
    >
      <div className="flex flex-col gap-5">
        {STATUS_GROUPS.map((group) => (
          <Specimen key={group.title} label={group.title} note={group.note} span={2}>
            <div className="flex flex-wrap items-center gap-2">
              {group.statuses.map((s) => (
                <StatusBadge key={`${group.title}-${s}`} status={s} />
              ))}
            </div>
          </Specimen>
        ))}
      </div>

      <SpecimenGrid columns={2} className="mt-5">
        <Specimen label="Tones" note="The raw palette behind statusTone()" span={2}>
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
        </Specimen>

        <Specimen label="Sizes & variants">
          <VariantRow>
            <Variant label="md (default)">
              <Badge tone="success">Available</Badge>
            </Variant>
            <Variant label="sm">
              <Badge tone="success" size="sm">
                Available
              </Badge>
            </Variant>
            <Variant label="with dot">
              <Badge tone="success" dot>
                Available
              </Badge>
            </Variant>
            <Variant label="pulsing">
              <Badge tone="info" dot pulse>
                Charging
              </Badge>
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Severity dots" note="Compact indicator for dense alert rows">
          <div className="flex flex-col gap-2">
            {['Critical', 'Major', 'Minor', 'Info'].map((s) => (
              <span key={s} className="flex items-center gap-2 text-[13px] text-ink-700">
                <SeverityDot severity={s} />
                {s}
              </span>
            ))}
          </div>
        </Specimen>

        <Specimen label="Live counters" note="Badges used as counts in navigation and tabs" span={2}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tnum rounded-full bg-danger-50 px-1.5 py-px text-[10.5px] font-semibold text-danger-700">7</span>
            <span className="tnum rounded-full bg-info-50 px-1.5 py-px text-[10.5px] font-semibold text-info-700">24</span>
            <span className="tnum rounded-full bg-brand-100 px-1.5 py-px text-[11px] text-brand-800">146</span>
            <span className="tnum rounded-full bg-ink-100 px-1.5 py-px text-[11px] text-ink-500">33</span>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function TooltipsSection() {
  return (
    <Section
      id="tooltips"
      title="Tooltips"
      description="A dark ink-900 bubble, 12px, at most two lines. Tooltips name an icon-only control or expand an abbreviation — they never carry information that exists nowhere else. All four placements are pinned open below so the state survives a static capture."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Placements" note="open — pinned, not hover-dependent" span={2} align="center" className="[&_figure]:min-h-24">
          <div className="flex flex-wrap items-center justify-center gap-14 py-10">
            {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
              <Tooltip key={placement} open placement={placement} label={`Placement: ${placement}`}>
                <IconButton label="Remote start">
                  <Zap className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            ))}
          </div>
        </Specimen>

        <Specimen label="Interactive" note="Hover or focus the button">
          <Tooltip label="Send RemoteStopTransaction">
            <Button size="sm" icon={<Zap className="h-3.5 w-3.5" />}>
              Stop session
            </Button>
          </Tooltip>
        </Specimen>

        <Specimen label="Bubble on its own" note="TooltipBubble">
          <div className="flex flex-col gap-2">
            <TooltipBubble>Charge point is offline</TooltipBubble>
            <TooltipBubble>
              Last heartbeat 14 minutes ago — the charge point stopped responding after a firmware install.
            </TooltipBubble>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function AlertsSection() {
  return (
    <Section
      id="alerts"
      title="Alerts"
      description="Inline banners for state that belongs to the page — a suspended tenant, an offline charge point, a validation failure. If the message is about something the user just did and can be forgotten, it is a toast instead."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Info" span={2}>
          <Alert className="w-full" tone="info" title="Scope is limited to one company">
            You are viewing <strong>Emirates Mobility · Dubai Operations</strong>. Switch scope in the header to see the rest of the tenant.
          </Alert>
        </Specimen>
        <Specimen label="Success" span={2}>
          <Alert className="w-full" tone="success" title="Settlement approved">
            AED 184,320.75 will be released to the CPO on the next banking day.
          </Alert>
        </Specimen>
        <Specimen label="Warning" span={2}>
          <Alert className="w-full" tone="warning" title="4 charge points have not sent a heartbeat in over an hour">
            Sessions cannot be started remotely on an offline charge point.
          </Alert>
        </Specimen>
        <Specimen label="Danger + actions" span={2}>
          <Alert
            className="w-full"
            tone="danger"
            title="Connector 2 reported Faulted"
            action={
              <>
                <Button size="sm" variant="danger">
                  Open incident
                </Button>
                <Button size="sm">Run diagnostics</Button>
              </>
            }
          >
            EVG-AE-0142 · Dubai Marina Hub · vendor error code <code className="font-mono">E-0231</code>.
          </Alert>
        </Specimen>
        <Specimen label="Neutral, dismissible">
          <Alert className="w-full" tone="neutral" title="Demo environment" onDismiss={() => {}}>
            All data is generated and stored in your browser.
          </Alert>
        </Specimen>
        <Specimen label="Compact, no title">
          <Alert className="w-full" tone="warning" compact>
            This tariff is referenced by 3 active locations.
          </Alert>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function ToastsSection() {
  return (
    <Section
      id="toasts"
      title="Toasts"
      description="Bottom-end, 340px, auto-dismissing after roughly four seconds and capped at four on screen. Confirmation of something the user just did — a command dispatched, a record saved, an export written. Never used for state that must persist."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Tones" note="Rendered inline — the live provider stacks these bottom-end" span={2} surface="page">
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <ToastCard animate={false} tone="success" title="Command accepted" description="RemoteStopTransaction · EVG-AE-0142" onDismiss={() => {}} />
            <ToastCard animate={false} tone="error" title="Command failed" description="Charge point is offline — the request timed out." onDismiss={() => {}} />
            <ToastCard animate={false} tone="info" title="Export written" description="1,003 transactions exported to CSV." onDismiss={() => {}} />
            <ToastCard animate={false} tone="warning" title="Saved with warnings" description="2 connectors could not be re-provisioned." onDismiss={() => {}} />
          </div>
        </Specimen>

        <Specimen label="Title only">
          <ToastCard animate={false} tone="success" title="Tariff published" onDismiss={() => {}} />
        </Specimen>

        <Specimen label="Live" note="Uses the real ToastProvider">
          <ToastTrigger />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

function ToastTrigger() {
  return (
    <div className="flex flex-wrap gap-2">
      <ToastButton tone="success" />
      <ToastButton tone="error" />
      <ToastButton tone="info" />
    </div>
  );
}

function ToastButton({ tone }: { tone: 'success' | 'error' | 'info' }) {
  const toast = useToast();
  return (
    <Button size="sm" onClick={() => toast[tone](`${tone[0].toUpperCase()}${tone.slice(1)} toast`, 'Triggered from the Design System.')}>
      {tone}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */

export function DialogsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Section
      id="dialogs"
      title="Dialogs"
      description="Modals are centred, capped at five widths and always carry a header, a scrollable body and a right-aligned footer where the primary action sits last. The surfaces below are the real `DialogSurface` rendered inline, so the anatomy is captured without an overlay covering the page."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Form dialog" note="size=&quot;md&quot; · 512px" span={2} surface="page">
          <div className="mx-auto w-full max-w-lg shadow-[var(--shadow-overlay)] rounded-[12px]">
            <DialogSurface
              title="Add charge point"
              description="Connectors are provisioned automatically from the model."
              bodyClassName="max-h-none"
              footer={
                <>
                  <Button>Cancel</Button>
                  <Button variant="primary">Create charge point</Button>
                </>
              }
            >
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Display name" required>
                  <Input placeholder="Dubai Marina Hub 03" />
                </Field>
                <Field label="OCPP identity" required>
                  <Input placeholder="EVG-AE-0148" />
                </Field>
                <Field label="Location" required>
                  <Select defaultValue="marina">
                    <option value="marina">Dubai Marina Hub</option>
                    <option value="jbr">JBR The Walk</option>
                  </Select>
                </Field>
                <Field label="Model" hint="Determines EVSE and connector layout.">
                  <Select defaultValue="dc-180">
                    <option value="ac-22">AC 22 kW · 2 × Type 2</option>
                    <option value="dc-180">DC 180 kW · CCS2 + CHAdeMO</option>
                  </Select>
                </Field>
              </div>
            </DialogSurface>
          </div>
        </Specimen>

        <Specimen label="Confirm — destructive" note="ConfirmDialog surface · size=&quot;sm&quot;" surface="page">
          <div className="w-full shadow-[var(--shadow-overlay)] rounded-[12px]">
            <DialogSurface
              title={
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-50 text-danger-500">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  Delete location
                </span>
              }
              bodyClassName="max-h-none"
              footer={
                <>
                  <Button>Cancel</Button>
                  <Button variant="danger">Delete</Button>
                </>
              }
            >
              <p className="text-[13px] leading-relaxed text-ink-600">
                JBR The Walk has 6 charge points and 412 historical transactions. Deleting it will detach the charge points from
                this company. This cannot be undone.
              </p>
            </DialogSurface>
          </div>
        </Specimen>

        <Specimen label="Live dialogs" note="Opens the real portal-mounted Modal">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
              Open confirm
            </Button>
          </div>
        </Specimen>
      </SpecimenGrid>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Dispatch OCPP command"
        description="The command is queued and acknowledged by the charge point."
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Send command
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Field label="Command">
            <Select defaultValue="reset">
              <option value="reset">Reset (Soft)</option>
              <option value="unlock">UnlockConnector</option>
              <option value="availability">ChangeAvailability</option>
            </Select>
          </Field>
          <Field label="Charge point">
            <Input readOnly defaultValue="EVG-AE-0142 · Dubai Marina Hub" className="bg-ink-50 text-ink-600" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {}}
        title="Revoke RFID card"
        message="The driver will no longer be able to start a session with this card. Any session in progress continues to completion."
        confirmLabel="Revoke card"
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function DrawersSection() {
  const [open, setOpen] = useState(false);
  return (
    <Section
      id="drawers"
      title="Drawers"
      description="Side panels for inspecting a record without losing the list behind it — session details, OCPP frame payloads, audit entries. Four widths. In RTL the drawer enters from the left; the slide keyframe reads a direction-aware custom property rather than being duplicated."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Detail drawer" note="width=&quot;md&quot; · 560px — rendered inline" span={2} surface="page">
          <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[10px] border border-ink-200 shadow-[var(--shadow-overlay)]">
            <div className="h-[420px]">
              <DrawerSurface
                title="Session S-88214"
                description="Dubai Marina Hub · EVG-AE-0142 · connector 2"
                footer={
                  <>
                    <Button>Close</Button>
                    <Button variant="danger">Stop session</Button>
                  </>
                }
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Charging" pulse />
                    <span className="text-[12.5px] text-ink-500">Started 41 minutes ago</span>
                  </div>
                  <DetailList
                    items={[
                      { label: 'Driver', value: 'Noura Al Ali' },
                      { label: 'RFID tag', value: '04A3B9C2' },
                      { label: 'Energy', value: '32.41 kWh' },
                      { label: 'Power', value: '118 kW' },
                      { label: 'State of charge', value: '68%' },
                      { label: 'Cost so far', value: 'AED 42.15' },
                      { label: 'Tariff', value: 'DC Fast · Peak' },
                      { label: 'Meter start', value: '1,204,881 Wh' },
                    ]}
                  />
                </div>
              </DrawerSurface>
            </div>
          </div>
        </Specimen>

        <Specimen label="Live drawer" note="Opens the real portal-mounted Drawer">
          <Button size="sm" onClick={() => setOpen(true)}>
            Open drawer
          </Button>
        </Specimen>

        <Specimen label="Widths" note="sm 420 · md 560 · lg 720 · xl 920">
          <div className="flex w-full flex-col gap-1.5">
            {[
              ['sm', 420, 'Quick inspect — one record, few fields'],
              ['md', 560, 'Default — record detail with a form'],
              ['lg', 720, 'Record detail with a table inside'],
              ['xl', 920, 'OCPP payload viewer, diff views'],
            ].map(([name, px, role]) => (
              <div key={name as string} className="flex items-center gap-3">
                <span className="w-8 shrink-0 font-mono text-[11px] text-brand-800">{name}</span>
                <span className="h-2.5 shrink-0 rounded-[2px] bg-brand-200" style={{ width: (px as number) / 6 }} />
                <span className="tnum w-12 shrink-0 font-mono text-[11px] text-ink-500">{px}px</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-500">{role}</span>
              </div>
            ))}
          </div>
        </Specimen>
      </SpecimenGrid>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="OCPP frame"
        description="Inbound · StatusNotification"
        footer={<Button onClick={() => setOpen(false)}>Close</Button>}
      >
        <pre className="eg-scroll overflow-x-auto rounded-[8px] bg-ink-900 p-3 font-mono text-[12px] leading-relaxed text-ink-100">
{`[2, "a1f2", "StatusNotification", {
  "connectorId": 2,
  "errorCode": "NoError",
  "status": "Charging",
  "timestamp": "2026-08-26T09:14:22Z"
}]`}
        </pre>
      </Drawer>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function StatesSection() {
  return (
    <Section
      id="states"
      title="Empty, loading & error states"
      description="Every list, panel and route has all three. An empty state says what would be here and offers the action that creates it; a loading state holds the layout rather than collapsing it; an error state names what failed and offers a way forward."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Empty — no results" note="After a search or filter" surface="none">
          <Panel className="w-full" padded={false}>
            <EmptyState icon={<Inbox className="h-5 w-5" />} title="No results found" description="Try adjusting your search or filters." />
          </Panel>
        </Specimen>

        <Specimen label="Empty — nothing created yet" note="With a primary action" surface="none">
          <Panel className="w-full" padded={false}>
            <EmptyState
              icon={<MapPinOff className="h-5 w-5" />}
              title="No locations yet"
              description="Add your first location to start provisioning charge points for this company."
              action={
                <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                  Add location
                </Button>
              }
            />
          </Panel>
        </Specimen>

        <Specimen label="Empty — compact" note="Inside a small panel" surface="none">
          <Panel className="w-full" padded={false}>
            <EmptyState compact icon={<Inbox className="h-5 w-5" />} title="No open alerts" description="Everything in scope is healthy." />
          </Panel>
        </Specimen>

        <Specimen label="Loading — spinner" surface="none">
          <Panel className="w-full" padded={false}>
            <LoadingState label="Loading transactions…" />
          </Panel>
        </Specimen>

        <Specimen label="Loading — table skeleton" note="Preferred: keeps column widths stable" span={2} surface="none">
          <TableSkeleton className="w-full" rows={4} columns={5} />
        </Specimen>

        <Specimen label="Loading — KPI skeletons" span={2} surface="none">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </Specimen>

        <Specimen label="Error — generic" surface="none">
          <Panel className="w-full" padded={false}>
            <ErrorState detail="ERR_STORE_READ" onRetry={() => {}} />
          </Panel>
        </Specimen>

        <Specimen label="Error — offline" surface="none">
          <Panel className="w-full" padded={false}>
            <ErrorState
              kind="offline"
              title="Map tiles unavailable"
              description="The pins are plotted from local data, but the basemap could not be reached."
              onRetry={() => {}}
              retryLabel="Try again"
            />
          </Panel>
        </Specimen>

        <Specimen label="Error — forbidden" note="What a privilege guard renders" span={2} surface="none">
          <Panel className="w-full" padded={false}>
            <ErrorState
              kind="forbidden"
              title="Access restricted"
              description="Your role does not include the privilege required to view settlements. Ask a company admin to grant settlements.view."
              action={
                <Button size="sm" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
                  View my privileges
                </Button>
              }
            />
          </Panel>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function PanelAnatomySection() {
  return (
    <Section
      id="panels"
      title="Panels & section headers"
      description="The panel is the only container in the product: white, 1px ink-200 border, 10px radius, 16px padding, no shadow. A PanelHeader gives it a title, an optional subtitle and one action slot on the end. Sections are separated by space, not by nesting cards inside cards."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Panel + header + action" surface="none">
          <Panel className="w-full">
            <PanelHeader
              title="Energy delivered"
              subtitle="Last 14 days · all companies in scope"
              action={
                <Button size="xs" variant="ghost">
                  View report
                </Button>
              }
            />
            <div className="rounded-[8px] border border-dashed border-ink-200 py-10 text-center text-[12px] text-ink-400">
              Panel body
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Compact header" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Connector mix" subtitle="229 connectors" />
            <div className="rounded-[8px] border border-dashed border-ink-200 py-10 text-center text-[12px] text-ink-400">
              Panel body
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Unpadded panel" note="padded={false} — for tables and lists" surface="none">
          <Panel className="w-full" padded={false}>
            <div className="border-b border-ink-200 px-4 py-3">
              <PanelHeader compact className="mb-0" title="Recent commands" />
            </div>
            <ul className="divide-y divide-ink-100">
              {['RemoteStopTransaction', 'Reset', 'UnlockConnector'].map((c) => (
                <li key={c} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-[12.5px] text-ink-700">{c}</span>
                  <StatusBadge status="Accepted" size="sm" />
                </li>
              ))}
            </ul>
          </Panel>
        </Specimen>

        <Specimen label="Detail list" note="DetailList — the record-summary pattern" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Charge point" />
            <DetailList
              items={[
                { label: 'OCPP identity', value: 'EVG-AE-0142' },
                { label: 'Protocol', value: 'OCPP 1.6J' },
                { label: 'Vendor', value: 'Alpitronic' },
                { label: 'Model', value: 'HYC 200' },
                { label: 'Firmware', value: '3.2.14' },
                { label: 'Last heartbeat', value: '12 seconds ago' },
              ]}
            />
          </Panel>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}
