/* Route-level and inline privilege gates. */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { EmptyState } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { useSession, type Privilege } from './session';
import { APP_ROUTES } from './navigation';

/** Wraps a route. Renders an explanation rather than a blank page. */
export function Require({ privileges, children }: { privileges: Privilege[]; children: ReactNode }) {
  const { canAny } = useSession();
  const { t } = useI18n();
  if (canAny(privileges)) return <>{children}</>;
  return (
    <div className="mt-10">
      <EmptyState
        icon={<Lock className="h-5 w-5" />}
        title={t('common.noAccessTitle')}
        description={t('common.noAccess')}
        action={
          <Link to={APP_ROUTES.dashboard}>
            <Button variant="primary" size="sm">{t('common.backToDashboard')}</Button>
          </Link>
        }
      />
    </div>
  );
}

/**
 * Inline gate. Renders nothing when the privilege is missing, so a read-only
 * persona sees a clean screen rather than buttons that refuse them.
 */
export function Can({
  do: privilege,
  children,
  fallback,
}: {
  do: Privilege | Privilege[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canAny } = useSession();
  const list = Array.isArray(privilege) ? privilege : [privilege];
  return canAny(list) ? <>{children}</> : <>{fallback ?? null}</>;
}
