import Link from 'next/link';
import { ArrowIcon, Brand, SparkIcon } from '@/components/Brand';

const players = [
  { initials: 'AY', role: 'The Witness', color: '#a99dff' },
  { initials: 'MK', role: 'The Host', color: '#6ee7f2' },
  { initials: 'SR', role: 'The Stranger', color: '#ff9cad' },
  { initials: '+7', role: 'Inside now', color: '#a9b0c0' },
];

export function WorldLanding() {
  return (
    <main className="world-home">
      <nav className="page-wrap relative z-20 flex min-h-[78px] items-center justify-between">
        <Brand />
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-[10px] font-bold uppercase tracking-[.17em] text-[#687084] sm:inline">
            Interactive entertainment
          </span>
          <Link href="/yaggdrasil/join" className="btn btn-quiet">Enter a world <ArrowIcon direction="right" /></Link>
        </div>
      </nav>

      <section className="page-wrap relative z-10 grid min-h-[calc(100vh-78px)] items-center gap-16 pb-20 pt-12 lg:grid-cols-[.92fr_1.08fr] lg:py-16">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6ee7f2]/20 bg-[#6ee7f2]/[.055] px-3 py-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#81e4ed]">
            <span className="live-dot" /> Shared canon · live now
          </div>
          <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#687084]">
            Worlds / multiplayer fiction
          </p>
          <h1 className="mt-4 text-[clamp(4.3rem,8.4vw,8.4rem)] font-semibold leading-[.84] tracking-[-.078em]">
            The novel
            <span className="block text-[#78e1eb]">you enter.</span>
          </h1>
          <p className="mt-8 max-w-[610px] text-base leading-8 text-[#929aac] sm:text-lg">
            Become someone inside a persistent story. Act freely, collide with real players, and
            watch one shared timeline adapt—because the world remembers what everyone does.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/yaggdrasil/join" className="btn btn-primary px-6">
              Enter a live world <ArrowIcon direction="right" />
            </Link>
            <Link href="/yaggdrasil/create" className="btn btn-quiet px-6"><SparkIcon /> Build a new world</Link>
          </div>
          <div className="mt-11 grid max-w-xl grid-cols-3 gap-5 border-t border-white/[.08] pt-6">
            {[['∞', 'Possible actions'], ['1', 'Shared timeline'], ['24/7', 'World uptime']].map(([value, label]) => (
              <div key={label}>
                <p className="text-xl font-semibold tracking-[-.03em]">{value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.15em] text-[#60687b]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="world-stage animate-rise delay-1">
          <div className="world-stage-glow" />
          <div className="world-console">
            <header>
              <div><span className="live-dot" /> HARROW HOUSE / WORLD 07</div>
              <span>CANON · CHAPTER 12</span>
            </header>
            <div className="world-console-body">
              <aside>
                <span>PLAYERS IN SCENE</span>
                <div className="world-player-stack">
                  {players.map((player) => (
                    <div key={player.initials}>
                      <i style={{ borderColor: `${player.color}55`, color: player.color }}>{player.initials}</i>
                      <p><strong>{player.role}</strong><small>{player.initials === '+7' ? 'watching the canon' : 'making a choice'}</small></p>
                    </div>
                  ))}
                </div>
                <span className="mt-7">WORLD STATE</span>
                <div className="world-state"><b>Storm</b><small>intensifying</small></div>
                <div className="world-state"><b>The key</b><small>still missing</small></div>
              </aside>
              <article>
                <div className="world-location">
                  <span>MYSTERY · THE LOCKED PAVILION</span>
                  <i>02:14 AM</i>
                </div>
                <p className="world-prose">
                  Rain worries the glass roof. The gramophone turns in silence—and across the
                  ballroom, three strangers realize they have remembered the same impossible thing.
                </p>
                <div className="world-event">
                  <span className="live-dot" />
                  <p><b>The Witness changed the scene</b><small>A muddy key now exists beneath the winter roses.</small></p>
                </div>
                <div className="world-prompt">
                  <span>Your move</span>
                  <p>Tell the world what you do…</p>
                  <button type="button"><ArrowIcon direction="right" /></button>
                </div>
              </article>
            </div>
            <footer>
              <span><span className="live-dot" /> Canon synchronized across 11 players</span>
              <small>timeline updated just now</small>
            </footer>
          </div>
          <div className="world-ripple world-ripple-one" />
          <div className="world-ripple world-ripple-two" />
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[.07] bg-[#080d13]/80 py-20">
        <div className="page-wrap">
          <p className="eyebrow text-[#6ee7f2]">Not a branching story. A living place.</p>
          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">
              Everyone has agency.<br />The world keeps the consequences.
            </h2>
            <p className="max-w-sm text-sm leading-7 text-[#778093]">
              Every action passes through the same characters, rules, relationships, and timeline,
              so multiplayer chaos becomes coherent story.
            </p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.07] md:grid-cols-3">
            {[
              ['01', 'Become someone', 'Enter as a character grounded in the world’s rules, history, and stakes.'],
              ['02', 'Act without menus', 'Write any move you can imagine. The narrator understands intent and consequence.'],
              ['03', 'Change what is true', 'Your choices persist in one shared canon for every player who arrives next.'],
            ].map(([number, title, copy]) => (
              <article key={number} className="bg-[#0b1018] p-7">
                <span className="text-[9px] font-bold tracking-[.18em] text-[#6ee7f2]">{number}</span>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-[#737c8e]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
