import { useState } from 'react';
import { Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader, EmptyState, DetailList } from '@/components/ui/Surface';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { DateInput } from '@/components/ui/DatePicker';
import { FileUpload } from '@/components/ui/Upload';
import { Badge } from '@/components/ui/Badge';
import type { LegalDocument } from '@/domain';
import { LookupSelect, useLookupLabel } from './LookupField';
import { todayIso, validateDocument, type Errors } from '../validation';
import { newDocument } from '../useRegistrationForm';

type Mode = 'create' | 'edit' | 'view';

function sizeLabel(bytes: number): string {
  if (!bytes) return '—';
  const kb = bytes / 1024;
  if (kb < 1) return '< 1 KB';
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentsPanel({
  documents,
  onSave,
  onRemove,
  error,
}: {
  documents: LegalDocument[];
  onSave: (document: LegalDocument) => void;
  onRemove: (id: string) => void;
  error?: string;
}) {
  const { t, intlLocale } = useI18n();
  const label = useLookupLabel();

  const [mode, setMode] = useState<Mode | null>(null);
  const [working, setWorking] = useState<LegalDocument>(newDocument);
  const [errors, setErrors] = useState<Errors>({});
  const [pendingDelete, setPendingDelete] = useState<LegalDocument | null>(null);

  const open = (next: Mode, document?: LegalDocument) => {
    setWorking(document ? { ...document } : newDocument());
    setErrors({});
    setMode(next);
  };

  const close = () => {
    setMode(null);
    setErrors({});
  };

  const commit = () => {
    const found = validateDocument(working);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave(working);
    close();
  };

  const set = <K extends keyof LegalDocument>(key: K, value: LegalDocument[K]) =>
    setWorking((prev) => ({ ...prev, [key]: value }));

  const err = (key: string) => (errors[key] ? t(errors[key] as never) : undefined);
  const readOnly = mode === 'view';

  const columns: Column<LegalDocument>[] = [
    {
      key: 'type',
      header: t('reg.field.documentName'),
      render: (row) => <span className="font-medium text-ink-900">{label('documentTypes', row.documentTypeId)}</span>,
      sortValue: (row) => label('documentTypes', row.documentTypeId),
    },
    {
      key: 'number',
      header: t('reg.field.documentNumber'),
      render: (row) => (
        <span className="tnum" dir="ltr">
          {row.documentNumber}
        </span>
      ),
    },
    { key: 'issued', header: t('reg.field.issuedPlace'), render: (row) => row.issuedPlace },
    {
      key: 'expiry',
      header: t('reg.field.expireDate'),
      align: 'end',
      render: (row) => {
        const expired = row.expiryDate && row.expiryDate < todayIso();
        return (
          <span className="inline-flex items-center gap-2">
            <span className="tnum">{formatDate(row.expiryDate, intlLocale)}</span>
            {expired && (
              <Badge tone="danger" size="sm" dot>
                {t('reg.badge.expired')}
              </Badge>
            )}
          </span>
        );
      },
      sortValue: (row) => row.expiryDate,
    },
    {
      key: 'file',
      header: t('reg.col.file'),
      render: (row) => (
        <span className="flex items-center gap-1.5 text-ink-600">
          <FileText className="h-3.5 w-3.5 text-ink-400" />
          <span className="max-w-40 truncate" dir="ltr">
            {row.fileName}
          </span>
          <span className="tnum text-[11.5px] text-ink-400">{sizeLabel(row.fileSize)}</span>
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
          <IconButton label={t('common.delete')} size="xs" variant="ghost" onClick={() => setPendingDelete(row)}>
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
          title={t('reg.section.documents')}
          subtitle={t('reg.section.documentsHint')}
          action={
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open('create')}>
              {t('reg.action.addDocument')}
            </Button>
          }
        />
        {error && <p className="mb-3 text-[12.5px] text-danger-700">{error}</p>}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          compact
          icon={<FileText className="h-5 w-5" />}
          title={t('reg.empty.documents')}
          description={t('reg.empty.documentsDesc')}
          action={
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open('create')}>
              {t('reg.action.addDocument')}
            </Button>
          }
        />
      ) : (
        <DataTable
          rows={documents}
          columns={columns}
          getRowId={(row) => row.id}
          dense
          hidePaginationWhenSingle
          pageSize={10}
          searchText={(row) => `${label('documentTypes', row.documentTypeId)} ${row.documentNumber}`}
        />
      )}

      <Modal
        open={mode !== null}
        onClose={close}
        size="lg"
        title={
          mode === 'create'
            ? t('reg.dialog.addDocument')
            : mode === 'edit'
              ? t('reg.dialog.editDocument')
              : t('reg.dialog.viewDocument')
        }
        description={mode === 'view' ? undefined : t('reg.dialog.documentHint')}
        footer={
          readOnly ? (
            <Button onClick={close}>{t('common.close')}</Button>
          ) : (
            <>
              <Button onClick={close}>{t('common.cancel')}</Button>
              <Button variant="primary" onClick={commit}>
                {mode === 'create' ? t('reg.action.addDocument') : t('common.saveChanges')}
              </Button>
            </>
          )
        }
      >
        {readOnly ? (
          <DetailList
            items={[
              { label: t('reg.field.documentName'), value: label('documentTypes', working.documentTypeId) },
              { label: t('reg.field.documentNumber'), value: <span dir="ltr">{working.documentNumber}</span> },
              { label: t('reg.field.issuedPlace'), value: working.issuedPlace },
              { label: t('reg.field.expireDate'), value: formatDate(working.expiryDate, intlLocale) },
              {
                label: t('reg.col.file'),
                value: (
                  <span dir="ltr">
                    {working.fileName} · {sizeLabel(working.fileSize)}
                  </span>
                ),
                span: true,
              },
            ]}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <LookupSelect
                lookup="documentTypes"
                label={t('reg.field.documentName')}
                required
                value={working.documentTypeId}
                onChange={(v) => set('documentTypeId', v)}
                error={err('documentTypeId')}
                placeholder={t('reg.ph.searchDocument')}
                className="sm:col-span-2"
              />
              <Field label={t('reg.field.documentNumber')} required error={err('documentNumber')} htmlFor="doc-number">
                <Input
                  id="doc-number"
                  dir="ltr"
                  className="tnum"
                  value={working.documentNumber}
                  onChange={(e) => set('documentNumber', e.target.value)}
                  invalid={Boolean(err('documentNumber'))}
                />
              </Field>
              <Field label={t('reg.field.issuedPlace')} required error={err('issuedPlace')} htmlFor="doc-place">
                <Input
                  id="doc-place"
                  dir="auto"
                  value={working.issuedPlace}
                  onChange={(e) => set('issuedPlace', e.target.value)}
                  invalid={Boolean(err('issuedPlace'))}
                />
              </Field>
              <Field label={t('reg.field.expireDate')} required error={err('expiryDate')} htmlFor="doc-expiry">
                <DateInput
                  value={working.expiryDate}
                  onChange={(v) => set('expiryDate', v)}
                  min={todayIso()}
                  invalid={Boolean(err('expiryDate'))}
                />
              </Field>
            </div>

            <Field label={t('reg.field.uploadFile')} required error={err('file')}>
              <FileUpload
                accept=".pdf,.jpg,.jpeg,.png"
                hint={t('reg.hint.uploadFile')}
                state={working.fileName ? 'complete' : 'idle'}
                fileName={working.fileName || undefined}
                onFiles={(files) => {
                  const file = files[0];
                  if (!file) return;
                  set('fileName', file.name);
                  setWorking((prev) => ({ ...prev, fileName: file.name, fileSize: file.size }));
                }}
                onClear={() => setWorking((prev) => ({ ...prev, fileName: '', fileSize: 0 }))}
              />
            </Field>
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
        title={t('reg.dialog.removeDocument')}
        message={t('reg.dialog.removeDocumentBody')}
        confirmLabel={t('common.remove')}
      />
    </Panel>
  );
}
