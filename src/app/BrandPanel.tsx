/* =============================================================================
 * A brand showcase card — photography under a purple scrim, with content on top.
 *
 * The one licensed exception to "saffron and purple are highlights, not
 * surfaces": a photographic panel on a public marketing-facing screen, which
 * the brand guidelines explicitly support. It never appears inside the
 * authenticated operations product.
 *
 * Structurally it is still a `Panel` — same 10px radius, same 1px edge — so it
 * sits in a grid beside white panels without breaking the rhythm.
 * ========================================================================== */

import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function BrandPanel({
  image,
  imagePosition = '50% 50%',
  children,
  className,
  minHeight = 320,
}: {
  image: string;
  imagePosition?: string;
  children: ReactNode;
  className?: string;
  minHeight?: number;
}) {
  return (
    <section
      className={cx(
        /* `flex` rather than a bare block: the content column below uses
           `flex-1` to reach the bottom, which a percentage height cannot do
           against a `min-height`. */
        'relative isolate flex flex-col overflow-hidden rounded-[10px] border border-brand-900/20 bg-brand-950',
        className,
      )}
      style={{ minHeight }}
    >
      <img
        src={image}
        alt=""
        aria-hidden
        decoding="async"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: imagePosition }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(26,5,41,0.95) 0%, rgba(26,5,41,0.82) 38%, rgba(26,5,41,0.38) 72%, rgba(26,5,41,0.12) 100%)',
        }}
      />
      <div className="relative flex flex-1 flex-col justify-end p-5">{children}</div>
    </section>
  );
}
