"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Item = {
  slug: string;
  title: string;
  category: string;
  description: string;
  url: string;
};

function Card({
  p,
  onView,
}: {
  p: Item;
  onView: (p: Item) => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(20,20,20,0.12)]">
      <button
        onClick={() => onView(p)}
        className="relative block cursor-pointer border-b border-line text-left"
        aria-label={`Lihat preview ${p.title}`}
      >
        {/* screenshot statis; demo live baru dimuat di modal saat diklik */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream">
          {/* cadangan kalau screenshot belum dibuat */}
          <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl text-stone">
            {p.title}
          </span>
          <img
            onError={(e) => (e.currentTarget.style.display = "none")}
            src={`/portfolio/${p.slug}.webp`}
            alt={`Tampilan ${p.title}`}
            width={960}
            height={600}
            loading="lazy"
            decoding="async"
            className="relative h-full w-full object-cover object-top"
          />
        </div>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors group-hover:bg-primary/10">
          <span className="translate-y-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
            Lihat preview →
          </span>
        </span>
      </button>
      <div className="flex flex-1 items-end justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone">
            {p.category} · Demo
          </p>
          <h3 className="mt-1 font-heading text-xl font-semibold">{p.title}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => onView(p)}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
          >
            Lihat
          </button>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-primary"
          >
            Kunjungi ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioShowcase({
  items,
  variant = "carousel",
}: {
  items: Item[];
  variant?: "carousel" | "grid";
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Item | null>(null);
  const paused = useRef(false);

  const scroll = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-slide]");
    const amount = slide ? slide.offsetWidth + 24 : el.clientWidth * 0.8;
    // loop ke awal bila sudah mentok kanan
    if (dir === 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
  }, []);

  // autoplay (carousel), pause saat hover / modal terbuka
  useEffect(() => {
    if (variant !== "carousel") return;
    const id = setInterval(() => {
      if (!paused.current && !active) scroll(1);
    }, 6000);
    return () => clearInterval(id);
  }, [variant, active, scroll]);

  // tutup modal via ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {variant === "carousel" ? (
        <>
          <div className="mb-10 flex items-end justify-between gap-6 md:mb-12">
            <h2 className="max-w-[16ch] font-heading text-3xl font-semibold tracking-tight md:text-5xl">
              Karya terbaru kami
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              <p className="mr-2 hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-stone lg:block">
                02 — Selected Work
              </p>
              <button aria-label="Sebelumnya" onClick={() => scroll(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-primary hover:bg-primary hover:text-white">←</button>
              <button aria-label="Berikutnya" onClick={() => scroll(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-primary hover:bg-primary hover:text-white">→</button>
            </div>
          </div>
          <div
            ref={track}
            onMouseEnter={() => (paused.current = true)}
            onMouseLeave={() => (paused.current = false)}
            className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((p) => (
              <div key={p.slug} data-slide className="w-[86%] shrink-0 snap-center sm:w-[68%] lg:w-[46%]">
                <Card p={p} onView={setActive} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-stone md:hidden">← geser untuk lihat lainnya →</p>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {items.map((p) => (
            <Card key={p.slug} p={p} onView={setActive} />
          ))}
        </div>
      )}

      {/* Modal preview */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/70 p-4 backdrop-blur-md md:p-8"
          onClick={() => setActive(null)}
        >
          <div
            className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-stone">{active.category} · Demo</p>
                <h3 className="font-heading text-lg font-semibold">{active.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                >
                  Kunjungi situs ↗
                </a>
                <button
                  onClick={() => setActive(null)}
                  aria-label="Tutup"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg transition-colors hover:border-primary hover:bg-primary hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-cream p-3 md:p-4">
              <iframe
                src={active.url}
                title={active.title}
                className="h-full w-full rounded-xl border border-line bg-white"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
