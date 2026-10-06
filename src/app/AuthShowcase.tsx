/* =============================================================================
 * The public authentication showcase — the imagery panel beside the form.
 *
 * Photography is the one place the product uses a large brand field: the
 * interface itself stays light, and this panel carries the purple. The scrim
 * is a brand-950 gradient rather than a flat overlay, so the sunset in each
 * frame still reads while the caption keeps its contrast.
 *
 * Everything decorative is `aria-hidden` and the whole panel is `hidden` below
 * `lg` — a person on a phone gets the form, not a slideshow.
 * ========================================================================== */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';
import { useI18n, type TranslationKey } from '@/i18n';
import { EvGateLogo } from '@/components/layout/Brand';

import chargingSunset from '@/assets/brand/imagery/evgate-charging-sunset.webp';
import networkMap from '@/assets/brand/imagery/evgate-network-map.webp';
import flagshipStation from '@/assets/brand/imagery/evgate-flagship-station.webp';

const SLIDE_MS = 7000;

/** The frame the mobile brand band uses — the panel itself is desktop-only. */
export const SHOWCASE_COVER = chargingSunset;

interface Slide {
  src: string;
  /** Focal point, so the crop keeps the charger in frame at any panel width. */
  position: string;
  eyebrow: TranslationKey;
  headline: TranslationKey;
  body: TranslationKey;
}

const SLIDES: Slide[] = [
  {
    src: chargingSunset,
    position: '58% 50%',
    eyebrow: 'showcase.1.eyebrow',
    headline: 'showcase.1.headline',
    body: 'showcase.1.body',
  },
  {
    src: networkMap,
    position: '50% 60%',
    eyebrow: 'showcase.2.eyebrow',
    headline: 'showcase.2.headline',
    body: 'showcase.2.body',
  },
  {
    src: flagshipStation,
    position: '62% 52%',
    eyebrow: 'showcase.3.eyebrow',
    headline: 'showcase.3.headline',
    body: 'showcase.3.body',
  },
];

/** Three stats under the caption — the enterprise proof points. */
const STATS: { value: string; label: TranslationKey }[] = [
  { value: 'OCPP 1.6 · 2.0.1', label: 'showcase.stat.protocol' },
  { value: 'OCPI 2.2', label: 'showcase.stat.roaming' },
  { value: '99.9%', label: 'showcase.stat.uptime' },
];

export function AuthShowcase({ className }: { className?: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    timer.current = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, paused, go]);

  const slide = SLIDES[index];

  return (
    <aside
      className={cx('relative isolate overflow-hidden bg-brand-950', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ---- The frame ---------------------------------------------------- */}
      <div key={index} className="eg-showcase-slide absolute inset-0" aria-hidden>
        <img
          src={slide.src}
          alt=""
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          className="h-full w-full object-cover will-change-transform"
          style={{ objectPosition: slide.position }}
        />
      </div>

      {/* ---- Scrim -------------------------------------------------------- */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(26,5,41,0.94) 0%, rgba(26,5,41,0.78) 26%, rgba(26,5,41,0.32) 55%, rgba(26,5,41,0.06) 100%)',
        }}
      />
      {/* A whisper of purple in the far corner, so the panel edge never goes
          light enough to fight the white form column beside it. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top left, rgba(42,9,68,0.42), transparent 48%)' }}
      />

      {/* ---- Content ------------------------------------------------------ */}
      <div className="relative flex h-full flex-col justify-between p-8 xl:p-10">
        <EvGateLogo height={30} className="text-accent-400 drop-shadow-[0_1px_8px_rgba(26,5,41,0.55)]" />

        <div className="max-w-md">
          <div key={`cap-${index}`} className="eg-showcase-caption">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent-400">
              {t(slide.eyebrow)}
            </p>
            <h2
              dir="auto"
              className="mt-3 text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-white xl:text-[32px]"
            >
              {t(slide.headline)}
            </h2>
            <p dir="auto" className="mt-3 text-[13.5px] leading-relaxed text-brand-100/85">
              {t(slide.body)}
            </p>
          </div>

          {/* ---- Indicators ------------------------------------------------ */}
          <div className="mt-7 flex items-center gap-2.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={t(s.eyebrow)}
                aria-current={i === index}
                onClick={() => go(i)}
                className="group py-2"
              >
                <span
                  className={cx(
                    'block h-0.5 overflow-hidden rounded-full transition-all duration-300',
                    i === index ? 'w-12 bg-white/25' : 'w-6 bg-white/25 group-hover:bg-white/45',
                  )}
                >
                  {i === index && (
                    <span
                      key={`p-${index}-${paused}`}
                      className={cx('block h-full w-full bg-accent-400', !paused && 'eg-showcase-progress')}
                      style={{ ['--eg-showcase-duration' as string]: `${SLIDE_MS}ms` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* ---- Proof points ---------------------------------------------- */}
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            {STATS.map((stat) => (
              <div key={stat.value}>
                <dt dir="ltr" className="tnum text-[13px] font-semibold text-white text-start">
                  {stat.value}
                </dt>
                <dd dir="auto" className="mt-0.5 text-[11.5px] leading-tight text-brand-200/70">
                  {t(stat.label)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </aside>
  );
}
