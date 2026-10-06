import { useId, useRef, useState, type ReactNode } from 'react';
import { FileText, ImageIcon, Upload as UploadIcon, X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Button } from './Button';
import { ProgressBar } from './Surface';

export type UploadState = 'idle' | 'dragging' | 'uploading' | 'complete' | 'error';

/**
 * Dropzone. `state` pins the visual so every stage of an upload is visible in
 * the Design System without performing one.
 */
export function FileUpload({
  label = 'Drop a file here or browse',
  hint = 'CSV, XLSX or PDF up to 10 MB',
  accept,
  multiple,
  state = 'idle',
  progress = 0,
  fileName,
  errorMessage,
  onFiles,
  onClear,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  accept?: string;
  multiple?: boolean;
  state?: UploadState;
  progress?: number;
  fileName?: string;
  errorMessage?: string;
  onFiles?: (files: FileList) => void;
  onClear?: () => void;
  className?: string;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const active = state === 'dragging' || dragging;

  if (state === 'uploading' || state === 'complete' || state === 'error') {
    const tone = state === 'error' ? 'danger' : state === 'complete' ? 'success' : 'brand';
    return (
      <div
        className={cx(
          'flex items-start gap-3 rounded-[10px] border p-3',
          state === 'error' ? 'border-danger-100 bg-danger-50' : 'border-ink-200 bg-white',
          className,
        )}
      >
        <span
          className={cx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px]',
            state === 'error' ? 'bg-danger-100 text-danger-700' : 'bg-ink-100 text-ink-500',
          )}
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink-900">{fileName ?? 'network-import.csv'}</p>
          {state === 'error' ? (
            <p className="mt-0.5 text-[12px] text-danger-700">{errorMessage ?? 'Upload failed — the file could not be parsed.'}</p>
          ) : (
            <ProgressBar className="mt-2" value={state === 'complete' ? 100 : progress} tone={tone} showLabel />
          )}
        </div>
        {onClear && (
          <button type="button" aria-label="Remove file" onClick={onClear} className="shrink-0 text-ink-400 hover:text-ink-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) onFiles?.(e.dataTransfer.files);
      }}
      className={cx(
        'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed px-6 py-8 text-center transition-colors',
        active ? 'border-brand-400 bg-brand-50/50' : 'border-ink-300 bg-white hover:border-ink-400 hover:bg-ink-50/60',
        className,
      )}
    >
      <span
        className={cx(
          'mb-2.5 flex h-10 w-10 items-center justify-center rounded-full',
          active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-400',
        )}
      >
        <UploadIcon className="h-4.5 w-4.5" />
      </span>
      <span className="text-[13px] font-medium text-ink-800">{label}</span>
      {hint && <span className="mt-0.5 text-[12px] text-ink-500">{hint}</span>}
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => e.target.files && onFiles?.(e.target.files)}
      />
    </label>
  );
}

/**
 * Square image picker — used for tenant and company logos, driver avatars and
 * mobile-app banner artwork.
 */
export function ImageUpload({
  src,
  onSelect,
  onClear,
  size = 96,
  label = 'Upload image',
  hint = 'PNG or SVG, 1:1, min 256 px',
  disabled,
  className,
}: {
  src?: string;
  onSelect?: (file: File) => void;
  onClear?: () => void;
  size?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={cx('flex items-center gap-4', className)}>
      <div
        className={cx(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-ink-300 bg-ink-50',
          disabled && 'opacity-60',
        )}
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-ink-400" />
        )}
        {src && onClear && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={onClear}
            className="absolute end-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-ink-500 shadow-[var(--shadow-panel)] hover:text-ink-800"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="min-w-0">
        <Button size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          {label}
        </Button>
        {hint && <p className="mt-1.5 text-[12px] text-ink-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && onSelect?.(e.target.files[0])}
        />
      </div>
    </div>
  );
}
