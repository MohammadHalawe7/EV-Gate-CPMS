/* =============================================================================
 * OCPP Operations Centre — shell.
 *
 * The station's own OCPP tab answers questions about one charger. This is the
 * fleet view: four numbers that say whether the protocol layer is healthy,
 * and six workspaces beneath them. Keeping the KPI strip in the layout means
 * it stays visible while you move between monitor, commands and firmware —
 * which is how an operator actually works during an incident.
 * ========================================================================== */

import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle, Hourglass, MessageSquare, Radio } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { NavTabs } from '@/components/ui/Tabs';
import { StatTile } from '@/components/ui/StatTile';
import { formatNumber } from '@/lib/utils';
import { useNetwork } from '@/data/networkStore';
import { OCPP_TABS } from '@/app/navigation';

export function OcppLayout() {
  const { t } = useI18n();
  const net = useNetwork();

  const kpis = useMemo(() => {
    const connected = net.stations.filter((s) => s.state === 'Online').length;
    const connectable = net.stations.filter(
      (s) => s.state !== 'Draft' && s.state !== 'Provisioning' && s.state !== 'Decommissioned',
    ).length;
    return {
      connected,
      connectable,
      messages: net.messages.length,
      errors: net.messages.filter((m) => !m.ok).length,
      pending: net.commands.filter((c) => c.status === 'Queued' || c.status === 'Sent').length,
    };
  }, [net.stations, net.messages, net.commands]);

  return (
    <>
      <PageHeader title={t('ocpp.title')} description={t('ocpp.subtitle')} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t('ocpp.kpi.connected')}
          value={formatNumber(kpis.connected)}
          unit={`/ ${formatNumber(kpis.connectable)}`}
          icon={<Radio />}
          accent={kpis.connected === kpis.connectable ? 'success' : 'brand'}
        />
        <StatTile label={t('ocpp.kpi.messages')} value={formatNumber(kpis.messages)} icon={<MessageSquare />} accent="info" />
        <StatTile
          label={t('ocpp.kpi.errors')}
          value={formatNumber(kpis.errors)}
          icon={<AlertTriangle />}
          accent={kpis.errors > 0 ? 'danger' : 'neutral'}
        />
        <StatTile
          label={t('ocpp.kpi.pending')}
          value={formatNumber(kpis.pending)}
          icon={<Hourglass />}
          accent={kpis.pending > 0 ? 'accent' : 'neutral'}
        />
      </div>

      <NavTabs
        className="mb-4"
        items={OCPP_TABS.map((tab) => ({ to: tab.to, label: t(tab.labelKey), end: tab.end }))}
      />

      <Outlet />
    </>
  );
}
