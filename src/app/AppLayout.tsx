/* =============================================================================
 * EV Gate CPMS — the authenticated frame.
 *
 * `AppShell` from the design system supplies the rail, the drawer and the
 * scrolling column. This file supplies what the foundation deliberately does
 * not know: the product's navigation, its account menu, its notifications and
 * its command palette.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  Cpu,
  LifeBuoy,
  LogOut,
  MapPin,
  Plug,
  Server,
  Tags,
  UserCog,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarFooter, type NavGroup } from '@/components/layout/Sidebar';
import { Topbar, type TopbarNotification } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Overlay';
import { SearchInput } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Surface';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/utils';
import { useNetwork, useNetworkStats } from '@/data/networkStore';
import { APP_ROUTES, NAV_GROUPS } from './navigation';
import { PERSONAS, useSession } from './session';
import { REGISTRATION_ROUTES } from '@/modules/registration';

/* -------------------------------------------------------------------------- */
/* Command palette — ⌘K                                                        */
/* -------------------------------------------------------------------------- */

interface Hit {
  to: string;
  title: string;
  subtitle: string;
  icon: typeof MapPin;
  kind: string;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    const all: Hit[] = [
      ...net.locations.map((l) => ({
        to: APP_ROUTES.location(l.id),
        title: ln(l),
        subtitle: `${l.code} · ${t('search.kind.location')}`,
        icon: MapPin,
        kind: 'location',
      })),
      ...net.stations.map((s) => ({
        to: APP_ROUTES.station(s.id),
        title: ln(s),
        subtitle: `${s.code} · ${s.chargePointId}`,
        icon: Zap,
        kind: 'station',
      })),
      ...net.profiles.map((p) => ({
        to: APP_ROUTES.hardwareProfile(p.id),
        title: ln(p),
        subtitle: `${p.code} · ${t('search.kind.hardware')}`,
        icon: Server,
        kind: 'hardware',
      })),
      ...net.tariffs.map((tf) => ({
        to: APP_ROUTES.tariff(tf.id),
        title: ln(tf),
        subtitle: `${tf.code} · ${t('search.kind.tariff')}`,
        icon: Tags,
        kind: 'tariff',
      })),
    ];
    if (!q) return all.slice(0, 8);
    return all.filter((h) => `${h.title} ${h.subtitle}`.toLowerCase().includes(q)).slice(0, 12);
  }, [net, query, ln, t]);

  return (
    <Modal open={open} onClose={onClose} title={t('search.title')} description={t('search.hint')} size="lg">
      <SearchInput value={query} onChange={setQuery} placeholder={t('search.placeholder')} autoFocus />
      <div className="mt-3 max-h-[46vh] overflow-y-auto eg-scroll">
        {hits.length === 0 ? (
          <EmptyState compact title={t('common.noResults')} description={t('common.noResultsDesc')} />
        ) : (
          <ul className="space-y-0.5">
            {hits.map((hit) => {
              const Icon = hit.icon;
              return (
                <li key={`${hit.kind}-${hit.to}`}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(hit.to);
                      onClose();
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-start transition-colors hover:bg-ink-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-ink-100 text-ink-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block truncate text-[13px] font-medium text-ink-900">{hit.title}</span>
                      <span dir="auto" className="block truncate text-[11.5px] text-ink-500">{hit.subtitle}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                       */
/* -------------------------------------------------------------------------- */

export function AppLayout() {
  const { t, ln, locale } = useI18n();
  const { persona, isAuthenticated, canAny, signOut } = useSession();
  const navigate = useNavigate();
  const net = useNetwork();
  const stats = useNetworkStats();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  if (!isAuthenticated) return <Navigate to={REGISTRATION_ROUTES.login} replace />;

  /* Navigation is filtered by privilege, so a persona never sees a link it
     cannot follow. Badges are live counts, not decoration. */
  const groups: NavGroup[] = NAV_GROUPS.map((group) => ({
    label: t(group.labelKey),
    items: group.items
      .filter((item) => canAny(item.privileges))
      .map((item) => ({
        to: item.to,
        label: t(item.labelKey),
        icon: item.icon,
        end: item.end,
        badge:
          item.badge === 'faults' ? stats.faulted || undefined
          : item.badge === 'provisioning' ? stats.provisioningStations || undefined
          : undefined,
        badgeTone: item.badge === 'faults' ? ('danger' as const) : ('info' as const),
      })),
  })).filter((group) => group.items.length > 0);

  /* Notifications are derived from the estate rather than invented, so the
     bell always agrees with what the screens show. */
  const notifications: TopbarNotification[] = [
    ...net.stations
      .filter((s) => s.state === 'Faulted')
      .slice(0, 4)
      .map((s) => ({
        id: `n-fault-${s.id}`,
        title: t('notify.stationFaulted', { code: s.code }),
        body: ln(net.locations.find((l) => l.id === s.locationId) ?? { name: '—' }),
        severity: 'Critical',
        at: s.updatedAt,
        onSelect: () => navigate(APP_ROUTES.station(s.id)),
      })),
    ...net.stations
      .filter((s) => s.state === 'Offline')
      .slice(0, 3)
      .map((s) => ({
        id: `n-offline-${s.id}`,
        title: t('notify.stationOffline', { code: s.code }),
        body: t('notify.lastSeen', { when: s.lastHeartbeatAt ? new Date(s.lastHeartbeatAt).toLocaleString(locale === 'ar' ? 'ar-AE' : 'en-AE') : '—' }),
        severity: 'Major',
        at: s.updatedAt,
        onSelect: () => navigate(APP_ROUTES.station(s.id)),
      })),
    ...net.stations
      .filter((s) => s.state === 'Provisioning')
      .slice(0, 3)
      .map((s) => ({
        id: `n-prov-${s.id}`,
        title: t('notify.awaitingBoot', { code: s.code }),
        body: t('notify.awaitingBootBody'),
        severity: 'Info',
        at: s.createdAt,
        onSelect: () => navigate(APP_ROUTES.station(s.id)),
      })),
    ...net.firmwareJobs
      .filter((f) => f.status === 'DownloadFailed' || f.status === 'InstallationFailed')
      .slice(0, 2)
      .map((f) => ({
        id: `n-fw-${f.id}`,
        title: t('notify.firmwareFailed', { code: f.chargePointId }),
        body: f.error ?? '',
        severity: 'Major',
        at: f.scheduledAt,
        onSelect: () => navigate(APP_ROUTES.ocppFirmware),
      })),
  ].map((n) => ({ ...n, read: readIds.includes(n.id) }));

  return (
    <>
      <AppShell
        groups={groups}
        homeTo={APP_ROUTES.dashboard}
        onSearchShortcut={() => setPaletteOpen(true)}
        sidebarFooter={
          <SidebarFooter
            title={t('app.name')}
            subtitle={t('app.environment')}
          />
        }
        topbar={({ openSidebar, openSearch }) => (
          <Topbar
            onOpenSidebar={openSidebar}
            onOpenSearch={openSearch}
            searchPlaceholder={t('search.placeholder')}
            start={<ScopeBadge />}
            notifications={notifications}
            onMarkAllRead={() => setReadIds(notifications.map((n) => n.id))}
            user={{
              name: persona?.name ?? '',
              nameAr: persona?.nameAr,
              caption: persona ? t(`persona.${persona.roleKey}` as never) : undefined,
              avatarColor: persona?.avatarColor,
            }}
            accountMenu={[
              { key: 'who', label: persona?.email ?? '', disabled: true },
              { key: 'switch', label: t('app.switchPersona'), icon: <UserCog className="h-3.5 w-3.5" />, onSelect: () => navigate(REGISTRATION_ROUTES.login) },
              { key: 'support', label: t('app.help'), icon: <LifeBuoy className="h-3.5 w-3.5" />, onSelect: () => window.open('https://docs.evgate.example', '_blank') },
              {
                key: 'out',
                label: t('app.signOut'),
                icon: <LogOut className="h-3.5 w-3.5" />,
                danger: true,
                separatorBefore: true,
                onSelect: () => {
                  signOut();
                  navigate(REGISTRATION_ROUTES.login);
                },
              },
            ]}
          />
        )}
      >
        <Outlet />
      </AppShell>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

/**
 * Says whose data is on screen. A platform operator looking at one tenant and
 * a site manager looking at their own car park should never have to guess.
 */
function ScopeBadge() {
  const { t, ln } = useI18n();
  const { persona } = useSession();
  const net = useNetwork();
  if (!persona) return null;

  const location = persona.locationId ? net.locations.find((l) => l.id === persona.locationId) : undefined;

  return (
    <Link
      to={location ? APP_ROUTES.location(location.id) : APP_ROUTES.locations}
      className={cx(
        'hidden items-center gap-2 rounded-[8px] border border-ink-200 bg-white px-2.5 py-1.5 transition-colors hover:border-ink-300 sm:flex',
      )}
    >
      <Building2 className="h-3.5 w-3.5 text-ink-400" />
      <span className="text-[12.5px] font-medium text-ink-800">{t('app.company')}</span>
      {location ? (
        <Badge tone="brand" size="sm">{ln(location)}</Badge>
      ) : (
        <Badge tone="neutral" size="sm">{t(`scope.${persona.scopeLevel}` as never)}</Badge>
      )}
    </Link>
  );
}

/** The persona cards shown on the sign-in screen. */
export const SIGN_IN_PERSONAS = PERSONAS;

export const PERSONA_ICONS = {
  platformAdmin: Cpu,
  tenantAdmin: Building2,
  companyAdmin: Zap,
  locationAdmin: Plug,
} as const;
