import { Link } from 'react-router-dom';
import { Clock3, Save, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { CompanyRegistrationForm } from '../components/CompanyRegistrationForm';

export function CompanyRegistrationPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('app.signIn'), to: '/login' }, { label: t('public.register') }]}
        title={t('reg.title')}
        description={t('reg.subtitle')}
        meta={
          <>
            <MetaItem label={t('reg.meta.timeLabel')} value={t('reg.meta.timeValue')} icon={<Clock3 />} />
            <MetaItem label={t('reg.meta.draftLabel')} value={t('reg.meta.draftValue')} icon={<Save />} />
            <MetaItem
              label={t('reg.meta.reviewLabel')}
              value={t('reg.meta.reviewValue')}
              icon={<ShieldCheck />}
            />
          </>
        }
        actions={
          <Link
            to="/registration-status"
            className="text-[12.5px] font-medium text-brand-700 hover:text-brand-900"
          >
            {t('public.trackApplication')}
          </Link>
        }
      />
      <CompanyRegistrationForm mode="public" channel="self" />
    </>
  );
}
