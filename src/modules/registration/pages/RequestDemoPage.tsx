import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Check, Send } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Panel, PanelHeader } from '@/components/ui/Surface';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useToast } from '@/components/ui/Toast';
import { dialCodes } from '@/data/lookups';
import { BrandPanel } from '@/app/BrandPanel';
import flagshipStation from '@/assets/brand/imagery/evgate-flagship-station.webp';
import {
  DependentLookupSelect,
  LookupMultiSelect,
  LookupNativeSelect,
  LookupSelect,
} from '../components/LookupField';

interface DemoRequest {
  companyName: string;
  countryId: string;
  cityId: string;
  serviceIds: string[];
  employeeBandId: string;
  contactName: string;
  email: string;
  phone: { country: string; number: string };
  notes: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function RequestDemoPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const codes = dialCodes();

  const [value, setValue] = useState<DemoRequest>({
    companyName: '',
    countryId: '',
    cityId: '',
    serviceIds: [],
    employeeBandId: '',
    contactName: '',
    email: '',
    phone: { country: 'AE', number: '' },
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof DemoRequest>(key: K, next: DemoRequest[K]) =>
    setValue((prev) => {
      const merged = { ...prev, [key]: next };
      if (key === 'countryId') merged.cityId = '';
      return merged;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!value.companyName.trim()) found.companyName = t('reg.err.required');
    if (!value.countryId) found.countryId = t('reg.err.select');
    if (value.serviceIds.length === 0) found.serviceIds = t('reg.err.selectOne');
    if (!value.contactName.trim()) found.contactName = t('reg.err.required');
    if (!value.email.trim()) found.email = t('reg.err.required');
    else if (!EMAIL.test(value.email.trim())) found.email = t('reg.err.email');
    if (!value.phone.number.trim()) found.phone = t('reg.err.required');
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      toast.success(t('demo.toast.sent'), t('demo.toast.sentDesc'));
      navigate('/register/submitted', {
        state: { reference: 'EVG-DEMO-PENDING', email: value.email, demo: true },
      });
    }, 800);
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('app.signIn'), to: '/login' }, { label: t('public.requestDemo') }]}
        title={t('demo.title')}
        description={t('demo.subtitle')}
        meta={
          <>
            <MetaItem
              label={t('demo.meta.responseLabel')}
              value={t('demo.meta.responseValue')}
              icon={<CalendarClock />}
            />
            <MetaItem label={t('demo.meta.trialLabel')} value={t('demo.meta.trialValue')} />
          </>
        }
        actions={
          <Button variant="ghost" onClick={() => navigate('/register')}>
            {t('demo.fullRegistration')}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="space-y-4">
          <Panel>
            <PanelHeader title={t('demo.section.company')} subtitle={t('demo.section.companyHint')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('reg.field.nameEn')}
                required
                error={errors.companyName}
                htmlFor="demo-company"
                className="sm:col-span-2"
              >
                <Input
                  id="demo-company"
                  dir="auto"
                  value={value.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  invalid={Boolean(errors.companyName)}
                />
              </Field>
              <LookupSelect
                lookup="countries"
                label={t('reg.field.country')}
                required
                value={value.countryId}
                onChange={(v) => set('countryId', v)}
                error={errors.countryId}
                placeholder={t('reg.ph.searchCountry')}
              />
              <DependentLookupSelect
                lookup="cities"
                parentId={value.countryId}
                label={t('reg.field.city')}
                value={value.cityId}
                onChange={(v) => set('cityId', v)}
                placeholder={t('reg.ph.searchCity')}
                waitingHint={t('reg.hint.selectCountryFirst')}
              />
              <LookupMultiSelect
                lookup="services"
                label={t('reg.field.services')}
                required
                value={value.serviceIds}
                onChange={(v) => set('serviceIds', v)}
                error={errors.serviceIds}
                placeholder={t('reg.ph.services')}
              />
              <LookupNativeSelect
                lookup="employeeBands"
                label={t('reg.field.employees')}
                value={value.employeeBandId}
                onChange={(v) => set('employeeBandId', v)}
                placeholder={t('reg.ph.employees')}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={t('demo.section.contact')} subtitle={t('demo.section.contactHint')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('demo.field.contactName')}
                required
                error={errors.contactName}
                htmlFor="demo-contact"
              >
                <Input
                  id="demo-contact"
                  dir="auto"
                  value={value.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  invalid={Boolean(errors.contactName)}
                />
              </Field>
              <Field
                label={t('reg.field.companyEmail')}
                required
                error={errors.email}
                htmlFor="demo-email"
              >
                <Input
                  id="demo-email"
                  type="email"
                  dir="ltr"
                  value={value.email}
                  onChange={(e) => set('email', e.target.value)}
                  invalid={Boolean(errors.email)}
                />
              </Field>
              <Field label={t('reg.field.phone')} required error={errors.phone} htmlFor="demo-phone">
                <PhoneInput
                  id="demo-phone"
                  value={value.phone}
                  onChange={(v) => set('phone', v)}
                  codes={codes}
                  invalid={Boolean(errors.phone)}
                />
              </Field>
              <Field label={t('demo.field.notes')} className="sm:col-span-2" htmlFor="demo-notes">
                <Textarea
                  id="demo-notes"
                  dir="auto"
                  value={value.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder={t('demo.ph.notes')}
                />
              </Field>
            </div>
          </Panel>

          <div className="flex items-center justify-end gap-2 border-t border-ink-200 pt-4">
            <Button variant="ghost" onClick={() => navigate('/login')} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={busy} icon={<Send className="h-3.5 w-3.5" />}>
              {t('demo.action.submit')}
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <BrandPanel image={flagshipStation} imagePosition="62% 45%" minHeight={400}>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent-400">
              {t('demo.aside.eyebrow')}
            </p>
            <h3 dir="auto" className="mt-2 text-[19px] font-semibold leading-snug text-white">
              {t('demo.aside.title')}
            </h3>
            <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
              {(['demo.aside.p1', 'demo.aside.p2', 'demo.aside.p3'] as const).map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                  <span dir="auto" className="text-[12.5px] leading-relaxed text-brand-100/90">
                    {t(key)}
                  </span>
                </li>
              ))}
            </ul>
          </BrandPanel>

          <Panel>
            <p className="text-[12.5px] leading-relaxed text-ink-600">
              {t('demo.aside.already')}{' '}
              <Link to="/registration-status" className="font-medium text-brand-700 hover:text-brand-900">
                {t('public.trackApplication')}
              </Link>
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
