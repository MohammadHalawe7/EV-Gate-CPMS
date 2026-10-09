/* =============================================================================
 * Tariff detail.
 *
 * Two questions: what does this cost, and where is it in force. The second is
 * the one that makes a price change safe, so it is given equal weight.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Pencil, Star, Tags } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailList } from '@/components/ui/Surface';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { ErrorState } from '@/components/ui/States';
import { Menu } from '@/components/ui/Menu';
import { useToast } from '@/components/ui/Toast';
import { Money } from '@/components/common';
import { formatDate } from '@/lib/utils';
import { networkActions, useNetwork, useTariffUsage } from '@/data/networkStore';
import { PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { EV_CHARGING_SERVICE_ID } from '@/domain/network';
import { Section, Stat, SummaryRow } from '../components/primitives';
import { TariffDrawer, priceExample } from '../components/TariffDrawer';

export function TariffDetailPage() {
  const { tariffId } = useParams();
  const { t, ln, locale } = useI18n();
  const toast = useToast();
  const net = useNetwork();
  const usage = useTariffUsage();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const tariff = net.tariffs.find((tf) => tf.id === tariffId);

  const bindings = useMemo(() => {
    if (!tariff) return { locations: [], stations: [], connectors: [] };
    return {
      locations: net.services
        .filter((s) => s.serviceId === EV_CHARGING_SERVICE_ID && s.evCharging?.defaultTariffId === tariff.id)
        .map((s) => net.locations.find((l) => l.id === s.locationId))
        .filter(Boolean),
      stations: net.stations.filter((s) => s.tariffId === tariff.id),
      connectors: net.connectors.filter((c) => c.tariffId === tariff.id),
    };
  }, [tariff, net]);

  if (!tariff) {
    return (
      <ErrorState
        kind="generic"
        title={t('trf.empty')}
        description={t('trf.emptyDesc')}
        action={
          <Link to={APP_ROUTES.tariffs}>
            <Button variant="primary" size="sm">{t('trf.title')}</Button>
          </Link>
        }
      />
    );
  }

  const use = usage[tariff.id];
  const example = priceExample(tariff);
  const dateLocale = locale === 'ar' ? 'ar-AE' : 'en-AE';

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('trf.title'), to: APP_ROUTES.tariffs }, { label: ln(tariff) }]}
        title={ln(tariff)}
        description={tariff.description}
        meta={
          <>
            <MetaItem label={t('trf.col.type')} value={tariff.type} icon={<Tags />} />
            <MetaItem
              label={t('trf.col.energy')}
              value={<Money value={tariff.basePricePerKwh} currency={tariff.currency} />}
            />
            <MetaItem label={t('trf.col.usage')} value={use ? t('trf.usage.summary', { total: use.total }) : t('trf.usage.none')} />
            {tariff.isCompanyDefault && <Badge tone="brand" size="sm">{t('trf.isDefault')}</Badge>}
            <StatusBadge status={tariff.status} label={t(`status.${tariff.status}` as never)} size="sm" />
          </>
        }
        actions={
          <Can do={PRIVILEGES.tariffsManage}>
            <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>{t('common.edit')}</Button>
            <Menu
              items={[
                ...(tariff.isCompanyDefault || tariff.status !== 'Active'
                  ? []
                  : [
                      {
                        key: 'default',
                        label: t('trf.setDefault'),
                        icon: <Star className="h-3.5 w-3.5" />,
                        onSelect: () => {
                          networkActions.setDefaultTariff(tariff.id);
                          toast.success(t('trf.savedToast'));
                        },
                      },
                    ]),
                {
                  key: 'duplicate',
                  label: t('common.duplicate'),
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onSelect: () => {
                    const copy = networkActions.duplicateTariff(tariff.id);
                    if (copy) toast.success(t('trf.savedToast'), copy.code);
                  },
                },
                {
                  key: 'archive',
                  label: tariff.status === 'Archived' ? t('common.restore') : t('common.archive'),
                  danger: tariff.status !== 'Archived',
                  separatorBefore: true,
                  onSelect: () =>
                    tariff.status === 'Archived'
                      ? networkActions.setTariffStatus(tariff.id, 'Active')
                      : setArchiveOpen(true),
                },
              ]}
            />
          </Can>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* ---- Pricing ----------------------------------------------------- */}
        <Section className="xl:col-span-2" title={t('trf.section.energy')} subtitle={t('trf.section.energyHint')}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={t('trf.field.perKwh')} value={<Money value={tariff.basePricePerKwh} currency={tariff.currency} />} />
            <Stat label={t('trf.field.perMinute')} value={<Money value={tariff.basePricePerMinute} currency={tariff.currency} />} />
            <Stat label={t('trf.field.vat')} value={`${tariff.vatPct}%`} />
            <Stat label={t('trf.col.appliesTo')} value={tariff.appliesTo === 'All' ? t('common.all') : tariff.appliesTo} />
          </div>

          <div className="mt-4 border-t border-ink-100 pt-4">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-500">{t('trf.section.schedule')}</p>
            {tariff.twentyFourSeven ? (
              <p className="text-[12.5px] text-ink-700">{t('trf.alwaysOn')}</p>
            ) : (
              <ul className="space-y-1.5">
                {tariff.windows.map((window) => (
                  <li key={window.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[7px] border border-ink-200 px-2.5 py-1.5">
                    <span className="flex items-center gap-2">
                      <span className="text-[12.5px] font-medium text-ink-900">{window.label}</span>
                      <span dir="ltr" className="tnum text-[11.5px] text-ink-500">
                        {String(window.fromHour).padStart(2, '0')}:00 – {String(window.toHour).padStart(2, '0')}:00
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <span
                            key={day}
                            className={
                              'flex h-4 w-4 items-center justify-center rounded-[3px] text-[8.5px] font-semibold ' +
                              (window.days.includes(day) ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-300')
                            }
                          >
                            {t(`loc.day.${day}` as never).slice(0, 1)}
                          </span>
                        ))}
                      </span>
                      <span className="tnum text-[12.5px] font-medium text-ink-900">
                        <Money value={window.pricePerKwh} currency={tariff.currency} />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 border-t border-ink-100 pt-4">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-500">{t('trf.section.fees')}</p>
            <DetailList
              columns={3}
              items={[
                { label: t('trf.field.sessionFee'), value: <Money value={tariff.fees.sessionFee} currency={tariff.currency} /> },
                { label: t('trf.field.minimumCharge'), value: <Money value={tariff.fees.minimumCharge} currency={tariff.currency} /> },
                { label: t('trf.field.idleFee'), value: <Money value={tariff.fees.idleFeePerMinute} currency={tariff.currency} /> },
                { label: t('trf.field.idleGrace'), value: <span className="tnum">{tariff.fees.idleGraceMinutes} min</span> },
                { label: t('trf.field.idleCap'), value: <Money value={tariff.fees.idleFeeCap} currency={tariff.currency} /> },
                { label: t('trf.field.reservationFee'), value: <Money value={tariff.fees.reservationFee} currency={tariff.currency} /> },
                { label: t('trf.field.rebookingFee'), value: <Money value={tariff.fees.rebookingFee} currency={tariff.currency} /> },
                { label: t('trf.field.cancellationFee'), value: <Money value={tariff.fees.cancellationFee} currency={tariff.currency} /> },
                { label: t('trf.field.noShowFee'), value: <Money value={tariff.fees.noShowFee} currency={tariff.currency} /> },
              ]}
            />
          </div>
        </Section>

        {/* ---- Worked example + validity ------------------------------------ */}
        <div className="space-y-4">
          <Section title={t('trf.preview')} subtitle={t('trf.previewHint')}>
            <SummaryRow label={t('trf.preview.energy')} value={<Money value={example.energy} currency={tariff.currency} />} />
            {tariff.basePricePerMinute > 0 && (
              <SummaryRow label={t('trf.preview.time')} value={<Money value={example.time} currency={tariff.currency} />} />
            )}
            {tariff.fees.sessionFee > 0 && (
              <SummaryRow label={t('trf.preview.session')} value={<Money value={example.session} currency={tariff.currency} />} />
            )}
            {example.idle > 0 && (
              <SummaryRow label={t('trf.preview.idle')} value={<Money value={example.idle} currency={tariff.currency} />} />
            )}
            <SummaryRow label={t('trf.preview.vat')} value={<Money value={example.vat} currency={tariff.currency} />} />
            <div className="mt-2 flex items-center justify-between border-t border-ink-200 pt-2.5">
              <span className="text-[13px] font-semibold text-ink-900">{t('trf.preview.total')}</span>
              <span className="text-[16px] font-semibold text-brand-900">
                <Money value={example.total} currency={tariff.currency} />
              </span>
            </div>
          </Section>

          <Section title={t('trf.section.validity')}>
            <DetailList
              columns={1}
              items={[
                { label: t('trf.field.validFrom'), value: formatDate(tariff.validFrom, dateLocale) },
                { label: t('trf.field.validTo'), value: tariff.validTo ? formatDate(tariff.validTo, dateLocale) : t('common.notSet') },
                { label: t('common.updated'), value: formatDate(tariff.updatedAt, dateLocale) },
              ]}
            />
          </Section>
        </div>
      </div>

      {/* ---- Where it is in force ------------------------------------------ */}
      <div className="mt-4">
        <Section title={t('trf.col.usage')} subtitle={use && use.total > 0 ? t('trf.usage.summary', { total: use.total }) : t('trf.usage.none')}>
          {!use || use.total === 0 ? (
            <p className="py-4 text-center text-[12.5px] text-ink-400">{t('trf.usage.none')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">
                  {t('loc.title')} · {use.locations}
                </p>
                <ul className="space-y-1">
                  {bindings.locations.map((location) =>
                    location ? (
                      <li key={location.id}>
                        <Link to={APP_ROUTES.location(location.id)} className="text-[12.5px] text-brand-700 hover:text-brand-900">
                          {ln(location)}
                        </Link>
                      </li>
                    ) : null,
                  )}
                  {use.locations === 0 && <li className="text-[12px] text-ink-400">{t('common.none')}</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">
                  {t('stn.title')} · {use.stations}
                </p>
                <ul className="space-y-1">
                  {bindings.stations.slice(0, 8).map((station) => (
                    <li key={station.id}>
                      <Link to={APP_ROUTES.station(station.id)} className="text-[12.5px] text-brand-700 hover:text-brand-900">
                        {ln(station)}
                      </Link>
                    </li>
                  ))}
                  {use.stations === 0 && <li className="text-[12px] text-ink-400">{t('common.none')}</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">
                  {t('conn.title')} · {use.connectors}
                </p>
                <ul className="space-y-1">
                  {bindings.connectors.slice(0, 8).map((connector) => (
                    <li key={connector.id} className="text-[12.5px] text-ink-700">
                      {t(`ctype.${connector.type}` as never)} · #{connector.connectorNumber}
                    </li>
                  ))}
                  {use.connectors === 0 && <li className="text-[12px] text-ink-400">{t('common.none')}</li>}
                </ul>
              </div>
            </div>
          )}
        </Section>
      </div>

      <TariffDrawer open={editOpen} onClose={() => setEditOpen(false)} tariff={tariff} />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          networkActions.setTariffStatus(tariff.id, 'Archived');
          toast.success(t('trf.savedToast'));
        }}
        title={t('trf.archiveTitle')}
        message={use && use.total > 0 ? t('trf.archiveBody', { count: use.total }) : t('trf.archiveBodyUnused')}
        confirmLabel={t('common.archive')}
        cancelLabel={t('common.cancel')}
      />
    </>
  );
}
