/* =============================================================================
 * Payment & wallet — the company policy.
 *
 * The original concept put payment settings on the charger. That is the wrong
 * level: how a driver pays is a commercial decision taken once by the
 * business, not an attribute of a box bolted to a wall. So the policy lives
 * here, every site inherits it, and a site overrides it only where it
 * genuinely differs — which the table below makes visible at a glance.
 * ========================================================================== */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import {
  EV_CHARGING_SERVICE_ID,
  type LocationService,
  type PaymentPolicy,
} from '@/domain/network';
import { PaymentPolicyForm } from '../components/PaymentPolicyForm';
import { Section, Stat, UnsavedBar, useDraft } from '../components/primitives';

interface Row {
  id: string;
  name: string;
  nameAr: string;
  own: boolean;
  policy: PaymentPolicy;
  service: LocationService;
}

export function PaymentPolicyPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { can } = useSession();

  const mayManage = can(PRIVILEGES.paymentsManage);
  const form = useDraft<PaymentPolicy>(net.companyPayment);

  const rows = useMemo<Row[]>(
    () =>
      net.services
        .filter((service) => service.serviceId === EV_CHARGING_SERVICE_ID)
        .map((service) => {
          const location = net.locations.find((l) => l.id === service.locationId);
          const own = service.evCharging?.payment ?? null;
          return location
            ? {
                id: location.id,
                name: location.name,
                nameAr: location.nameAr,
                own: own !== null,
                policy: own ?? net.companyPayment,
                service,
              }
            : null;
        })
        .filter((row): row is Row => row !== null),
    [net.services, net.locations, net.companyPayment],
  );

  const overrides = rows.filter((row) => row.own).length;

  function save() {
    form.commit((value) => networkActions.updateCompanyPayment(value));
    toast.success(t('pay.savedToast'), t('pay.savedToastDesc'));
  }

  const columns: Column<Row>[] = [
    {
      key: 'site',
      header: t('pay.col.site'),
      className: 'max-w-[260px]',
      width: '260px',
      sortValue: (row) => row.name,
      render: (row) => (
        <Link
          to={APP_ROUTES.location(row.id)}
          className="block truncate text-[12.5px] font-medium text-ink-900 hover:text-brand-800"
        >
          {ln(row)}
        </Link>
      ),
    },
    {
      key: 'policy',
      header: t('pay.col.policy'),
      width: '160px',
      sortValue: (row) => (row.own ? 'a' : 'b'),
      render: (row) =>
        row.own ? (
          <Badge tone="brand" size="sm">
            {t('pay.usesOwn')}
          </Badge>
        ) : (
          <span className="text-[12px] text-ink-400">{t('pay.usesCompany')}</span>
        ),
    },
    {
      key: 'methods',
      header: t('pay.col.methods'),
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.policy.methods.length === 0 ? (
            <span className="text-[12px] text-danger-700">{t('common.none')}</span>
          ) : (
            row.policy.methods.map((method) => (
              <Badge key={method} tone="neutral" size="sm">
                {t(`pm.${method}` as never)}
              </Badge>
            ))
          )}
        </span>
      ),
    },
    {
      key: 'wallet',
      header: t('pay.col.wallet'),
      width: '190px',
      align: 'end',
      sortValue: (row) => row.policy.wallet,
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">{t(`wallet.${row.policy.wallet}` as never)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('pay.title')} description={t('pay.subtitle')} />

      <div className="space-y-4 pb-16">
        <Section title={t('pay.companyTitle')} subtitle={t('pay.companyHint')}>
          <div className="mb-4 grid grid-cols-2 gap-4 border-b border-ink-100 pb-4 sm:grid-cols-4">
            <Stat label={t('pay.usesCompany')} value={rows.length - overrides} />
            <Stat label={t('pay.usesOwn')} value={overrides} tone={overrides > 0 ? 'default' : 'muted'} />
            <Stat label={t('pay.wallet')} value={t(`wallet.${form.draft.wallet}` as never)} />
            <Stat label={t('pay.currency')} value={form.draft.currency} />
          </div>

          {form.draft.methods.length === 0 && (
            <div className="mb-4">
              <Alert tone="danger">{t('pay.methodsHint')}</Alert>
            </div>
          )}

          <PaymentPolicyForm value={form.draft} onChange={form.setDraft} disabled={!mayManage} />
        </Section>

        <Section
          padded={false}
          title={t('pay.sitesTitle')}
          subtitle={
            rows.length === 0
              ? t('pay.sitesHint')
              : `${t('pay.inheritCount', { count: rows.length - overrides })} · ${t('pay.overrideCount', { count: overrides })}`
          }
        >
          {rows.length === 0 ? (
            <div className="border-t border-ink-100">
              <EmptyState
                compact
                icon={<CreditCard className="h-5 w-5" />}
                title={t('pay.noSites')}
                description={t('pay.noSitesDesc')}
                action={
                  <Link to={APP_ROUTES.locations}>
                    <Button variant="primary" size="sm">
                      {t('loc.title')}
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:border-t">
              <DataTable
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                defaultSort={{ key: 'policy', dir: 'asc' }}
                hidePaginationWhenSingle
                dense
                emptyTitle={t('pay.noSites')}
                emptyDescription={t('pay.noSitesDesc')}
              />
            </div>
          )}
        </Section>
      </div>

      <UnsavedBar dirty={form.dirty && mayManage} onSave={save} onDiscard={form.reset} />
    </>
  );
}
