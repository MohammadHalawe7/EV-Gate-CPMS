/* =============================================================================
 * OCPP → Configuration keys.
 *
 * Configuration belongs to one charger at a time, so the page opens with a
 * picker rather than pretending a fleet-wide key list exists. Keys are grouped
 * by concern instead of listed alphabetically: nobody scrolls 80 keys looking
 * for "HeartbeatInterval", they look under Connectivity.
 *
 * Read-only keys are reported by the hardware. They are shown, because their
 * values matter during an investigation, and they are visibly not editable.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Settings2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { EmptyState, Panel } from '@/components/ui/Surface';
import { Field, Input, SearchInput, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { formatRelative } from '@/lib/utils';
import { getLookup, findLookup } from '@/data/lookups';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import type { ConfigurationKey } from '@/domain/network';

export function OcppConfigurationPage() {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { can } = useSession();

  const connectable = useMemo(
    () => net.stations.filter((s) => s.state !== 'Draft' && s.state !== 'Decommissioned'),
    [net.stations],
  );

  const [stationId, setStationId] = useState(connectable[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ConfigurationKey | null>(null);
  const [value, setValue] = useState('');

  const station = net.stations.find((s) => s.id === stationId);
  const mayConfigure = can(PRIVILEGES.ocppConfigure);

  const keys = useMemo(() => {
    const term = search.trim().toLowerCase();
    return net.configKeys
      .filter((key) => key.stationId === stationId)
      .filter((key) => term === '' || `${key.key} ${key.description}`.toLowerCase().includes(term));
  }, [net.configKeys, stationId, search]);

  const groups = useMemo(() => {
    const order = getLookup('ocppConfigGroups').map((group) => group.id);
    const byGroup = new Map<string, ConfigurationKey[]>();
    for (const key of keys) {
      const bucket = byGroup.get(key.group) ?? [];
      bucket.push(key);
      byGroup.set(key.group, bucket);
    }
    return order
      .filter((id) => byGroup.has(id))
      .map((id) => ({ id, keys: (byGroup.get(id) ?? []).sort((a, b) => a.key.localeCompare(b.key)) }));
  }, [keys]);

  function openEdit(key: ConfigurationKey) {
    setEditing(key);
    setValue(key.value);
  }

  function save() {
    if (!editing) return;
    networkActions.updateConfigKey(editing.id, value);
    toast.success(t('ocpp.cfg.saved'), editing.key);
    setEditing(null);
  }

  const items: AccordionItem[] = groups.map((group) => {
    const label = findLookup('ocppConfigGroups', group.id);
    return {
      key: group.id,
      title: label ? ln(label) : group.id,
      meta: (
        <Badge tone="neutral" size="sm">
          {group.keys.length}
        </Badge>
      ),
      children: (
        <div className="divide-y divide-ink-100">
          {group.keys.map((key) => (
            <div key={key.id} className="flex flex-wrap items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-mono text-[12.5px] font-medium text-ink-900" dir="ltr">
                    {key.key}
                  </span>
                  {key.readonly && (
                    <Badge tone="neutral" size="sm">
                      {t('ocpp.cfg.readonly')}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-ink-500">{key.description}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="tnum rounded-[6px] border border-ink-200 bg-ink-50 px-2 py-1 text-[12px] text-ink-800" dir="ltr">
                  {key.value}
                  {key.unit && <span className="text-ink-400"> {key.unit}</span>}
                </span>
                <span className="hidden text-[11px] text-ink-400 sm:inline">
                  {formatRelative(key.updatedAt, locale)}
                </span>
                {!key.readonly && mayConfigure && (
                  <Button
                    size="xs"
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    aria-label={t('common.edit')}
                    title={t('common.edit')}
                    onClick={() => openEdit(key)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    };
  });

  return (
    <>
      <Panel className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[320px]">
            <Field label={t('ocpp.cfg.pickStation')} hint={t('ocpp.cfg.pickStationHint')} htmlFor="cfgkeys-station">
              <Select id="cfgkeys-station" value={stationId} onChange={(e) => setStationId(e.target.value)}>
                <option value="">{t('common.none')}</option>
                {connectable.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.chargePointId} — {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`${t('ocpp.cfg.col.key')}…`}
            className="w-full sm:w-64"
          />

          {station && (
            <Link
              to={APP_ROUTES.station(station.id)}
              className="pb-2 text-[12.5px] font-medium text-brand-800 hover:underline"
            >
              {t('common.open')} · {ln(station)}
            </Link>
          )}
        </div>
      </Panel>

      {!station ? (
        <EmptyState
          icon={<Settings2 className="h-5 w-5" />}
          title={t('ocpp.cfg.pickStation')}
          description={t('ocpp.cfg.pickStationHint')}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Settings2 className="h-5 w-5" />}
          title={t('common.noResults')}
          description={t('common.noResultsDesc')}
        />
      ) : (
        <Accordion items={items} defaultOpen={[items[0].key]} />
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="sm"
        title={t('ocpp.cfg.editTitle', { key: editing?.key ?? '' })}
        description={editing?.description}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={save}>
              {t('common.apply')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('ocpp.cfg.col.value')} hint={editing?.unit || undefined} htmlFor="cfgkey-value">
            <Input id="cfgkey-value" value={value} onChange={(e) => setValue(e.target.value)} dir="ltr" />
          </Field>
          <Alert tone="info">{t('ocpp.cfg.editBody')}</Alert>
        </div>
      </Modal>
    </>
  );
}
