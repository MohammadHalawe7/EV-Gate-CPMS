import { useState } from 'react';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader, EmptyState, DetailList } from '@/components/ui/Surface';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { PhoneInput, formatPhone } from '@/components/ui/PhoneInput';
import { dialCodes } from '@/data/lookups';
import { fullName, type ContactPerson } from '@/domain';
import { DependentLookupSelect, LookupSelect, useLookupLabel } from './LookupField';
import { validateContact, type Errors } from '../validation';
import { newContact } from '../useRegistrationForm';

type Mode = 'create' | 'edit' | 'view';

export function ContactsPanel({
  contacts,
  onSave,
  onRemove,
}: {
  contacts: ContactPerson[];
  onSave: (contact: ContactPerson) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const label = useLookupLabel();
  const codes = dialCodes();

  const [mode, setMode] = useState<Mode | null>(null);
  const [working, setWorking] = useState<ContactPerson>(newContact);
  const [errors, setErrors] = useState<Errors>({});
  const [pendingDelete, setPendingDelete] = useState<ContactPerson | null>(null);

  const open = (next: Mode, contact?: ContactPerson) => {
    setWorking(contact ? { ...contact } : newContact());
    setErrors({});
    setMode(next);
  };

  const close = () => {
    setMode(null);
    setErrors({});
  };

  const commit = () => {
    const found = validateContact(working);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave(working);
    close();
  };

  const set = <K extends keyof ContactPerson>(key: K, value: ContactPerson[K]) =>
    setWorking((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'departmentId') next.positionId = '';
      return next;
    });

  const err = (key: string) => (errors[key] ? t(errors[key] as never) : undefined);
  const readOnly = mode === 'view';

  const columns: Column<ContactPerson>[] = [
    {
      key: 'name',
      header: t('reg.col.name'),
      render: (row) => <span className="font-medium text-ink-900">{fullName(row)}</span>,
      sortValue: (row) => fullName(row),
    },
    {
      key: 'department',
      header: t('reg.field.department'),
      render: (row) => label('departments', row.departmentId),
      sortValue: (row) => label('departments', row.departmentId),
    },
    {
      key: 'position',
      header: t('reg.field.position'),
      render: (row) => label('positions', row.positionId),
    },
    {
      key: 'mobile',
      header: t('reg.field.mobile'),
      render: (row) => <span className="tnum" dir="ltr">{formatPhone(row.mobile, codes)}</span>,
    },
    {
      key: 'email',
      header: t('reg.field.registeredEmail'),
      render: (row) => (
        <span dir="ltr" className="text-ink-700">
          {row.email}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'end',
      width: '132px',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label={t('common.view')} size="xs" variant="ghost" onClick={() => open('view', row)}>
            <Eye className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label={t('common.edit')} size="xs" variant="ghost" onClick={() => open('edit', row)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            label={t('common.delete')}
            size="xs"
            variant="ghost"
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Panel padded={false}>
      <div className="p-4 pb-0">
        <PanelHeader
          title={t('reg.section.contacts')}
          subtitle={t('reg.section.contactsHint')}
          action={
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open('create')}>
              {t('reg.action.addContact')}
            </Button>
          }
        />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          compact
          icon={<Users className="h-5 w-5" />}
          title={t('reg.empty.contacts')}
          description={t('reg.empty.contactsDesc')}
          action={
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open('create')}>
              {t('reg.action.addContact')}
            </Button>
          }
        />
      ) : (
        <DataTable
          rows={contacts}
          columns={columns}
          getRowId={(row) => row.id}
          dense
          hidePaginationWhenSingle
          pageSize={10}
          searchText={(row) => `${fullName(row)} ${row.email}`}
        />
      )}

      <Modal
        open={mode !== null}
        onClose={close}
        size="lg"
        title={
          mode === 'create'
            ? t('reg.dialog.addContact')
            : mode === 'edit'
              ? t('reg.dialog.editContact')
              : t('reg.dialog.viewContact')
        }
        description={mode === 'view' ? undefined : t('reg.dialog.contactHint')}
        footer={
          readOnly ? (
            <Button onClick={close}>{t('common.close')}</Button>
          ) : (
            <>
              <Button onClick={close}>{t('common.cancel')}</Button>
              <Button variant="primary" onClick={commit}>
                {mode === 'create' ? t('reg.action.addContact') : t('common.saveChanges')}
              </Button>
            </>
          )
        }
      >
        {readOnly ? (
          <DetailList
            items={[
              { label: t('reg.col.name'), value: fullName(working) },
              { label: t('reg.field.department'), value: label('departments', working.departmentId) },
              { label: t('reg.field.position'), value: label('positions', working.positionId) },
              {
                label: t('reg.field.mobile'),
                value: (
                  <span className="tnum" dir="ltr">
                    {formatPhone(working.mobile, codes)}
                  </span>
                ),
              },
              { label: t('reg.field.registeredEmail'), value: <span dir="ltr">{working.email}</span>, span: true },
            ]}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t('reg.field.firstName')} required error={err('firstName')} htmlFor="ct-first">
                <Input
                  id="ct-first"
                  dir="auto"
                  value={working.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  invalid={Boolean(err('firstName'))}
                />
              </Field>
              <Field label={t('reg.field.secondName')} htmlFor="ct-second">
                <Input id="ct-second" dir="auto" value={working.secondName} onChange={(e) => set('secondName', e.target.value)} />
              </Field>
              <Field label={t('reg.field.thirdName')} htmlFor="ct-third">
                <Input id="ct-third" dir="auto" value={working.thirdName} onChange={(e) => set('thirdName', e.target.value)} />
              </Field>
              <Field label={t('reg.field.lastName')} required error={err('lastName')} htmlFor="ct-last">
                <Input
                  id="ct-last"
                  dir="auto"
                  value={working.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  invalid={Boolean(err('lastName'))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LookupSelect
                lookup="departments"
                label={t('reg.field.department')}
                required
                value={working.departmentId}
                onChange={(v) => set('departmentId', v)}
                error={err('departmentId')}
                placeholder={t('reg.ph.searchDepartment')}
              />
              <DependentLookupSelect
                lookup="positions"
                parentId={working.departmentId}
                label={t('reg.field.position')}
                required
                value={working.positionId}
                onChange={(v) => set('positionId', v)}
                error={err('positionId')}
                placeholder={t('reg.ph.searchPosition')}
                waitingHint={t('reg.hint.selectDepartmentFirst')}
              />
              <Field label={t('reg.field.mobile')} required error={err('mobile')} htmlFor="ct-mobile">
                <PhoneInput
                  id="ct-mobile"
                  value={working.mobile}
                  onChange={(v) => set('mobile', v)}
                  codes={codes}
                  invalid={Boolean(err('mobile'))}
                />
              </Field>
              <Field label={t('reg.field.registeredEmail')} required error={err('email')} htmlFor="ct-email">
                <Input
                  id="ct-email"
                  type="email"
                  dir="ltr"
                  value={working.email}
                  onChange={(e) => set('email', e.target.value)}
                  invalid={Boolean(err('email'))}
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onRemove(pendingDelete.id);
          setPendingDelete(null);
        }}
        title={t('reg.dialog.removeContact')}
        message={t('reg.dialog.removeContactBody', { name: pendingDelete ? fullName(pendingDelete) : '' })}
        confirmLabel={t('common.remove')}
      />
    </Panel>
  );
}
