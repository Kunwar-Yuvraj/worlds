'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader } from '@/lib/firebase/client';
import { PRESETS } from '@/lib/presets';
import type { WorldPreset } from '@/lib/presets';
import { PRESET_TRAILERS } from '@/lib/preset-trailers';
import { ArrowIcon, Brand } from '@/components/Brand';
import PresetCinematicTrailer from '@/components/PresetCinematicTrailer';

type Listed = { id: string; name: string; genre: string; rulesText: string; turnCount: number };
type PresetChoice = { preset: WorldPreset; playMode: 'solo' | 'group' };

const cardAtmospheres = [
  'from-[#292454] via-[#14172d] to-[#0d111b]',
  'from-[#153c4b] via-[#10222e] to-[#0d121b]',
  'from-[#3b244d] via-[#21162d] to-[#10101b]',
  'from-[#203764] via-[#121e3c] to-[#0c111e]',
];

export default function JoinPage() {
  const router = useRouter();
  const [worlds, setWorlds] = useState<Listed[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [privateId, setPrivateId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<WorldPreset | null>(null);
  const [trailerChoice, setTrailerChoice] = useState<PresetChoice | null>(null);

  // The app-wide route animation can leave the browser's saved scroll position
  // intact on a direct reload. The library should always open at its beginning.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    const previousRestoration = window.history.scrollRestoration;

    root.style.scrollBehavior = 'auto';
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    root.scrollTop = 0;

    const restoreBehavior = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
    });

    return () => {
      window.cancelAnimationFrame(restoreBehavior);
      root.style.scrollBehavior = previousBehavior;
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    fetch('/api/worlds')
      .then(response => response.json())
      .then(body => setWorlds(body.worlds ?? []))
      .catch(() => setError('The public library could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  async function openPreset(name: string, playMode: 'solo' | 'group') {
    setBusy(name);
    setError('');
    try {
      const response = await fetch('/api/worlds/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ presetName: name, playMode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/yaggdrasil/world/${body.worldId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open that world.');
      setBusy('');
    }
  }

  function choosePreset(preset: WorldPreset, playMode: 'solo' | 'group') {
    if (PRESET_TRAILERS[preset.name]) {
      setTrailerChoice({ preset, playMode });
      return;
    }
    void openPreset(preset.name, playMode);
  }

  function completeTrailer() {
    const choice = trailerChoice;
    if (!choice) return;
    setTrailerChoice(null);
    void openPreset(choice.preset.name, choice.playMode);
  }

  return <main className="app-shell min-h-screen pb-24">
    <nav className="page-wrap flex items-center justify-between py-6">
      <Brand />
      <Link href="/yaggdrasil/create" className="btn btn-primary">Create a world <ArrowIcon /></Link>
    </nav>

    <header className="page-wrap pb-12 pt-14 sm:pt-20">
      <div className="flex items-center gap-3"><span className="h-px w-9 bg-[#8b7cff]" /><p className="eyebrow">The world library</p></div>
      <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <h1 className="text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-7xl">Find a world.<br /><span className="bg-gradient-to-r from-[#a99dff] to-[#76dce8] bg-clip-text text-transparent">Change its future.</span></h1>
        <p className="max-w-sm text-sm leading-7 text-[#8e96a8]">Choose a story at its beginning, or enter a living world already marked by other players.</p>
      </div>
    </header>

    <section className="page-wrap">
      <div className="mb-5 flex items-end justify-between">
        <div><p className="eyebrow eyebrow-muted">Playable setups</p><h2 className="mt-2 text-xl font-semibold tracking-[-.025em]">Choose tonight&apos;s game</h2></div>
        <span className="hidden text-xs text-[#687084] sm:inline">{PRESETS.length} solo + co-op games</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((preset, index) => <article key={preset.name} className={`group relative flex min-h-[390px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-b ${cardAtmospheres[index % cardAtmospheres.length]} p-6 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-white/20`}>
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/[.045] blur-2xl" />
          <div className="relative flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a99dff]">{preset.genre}</p>
            <span className="text-[10px] font-semibold text-white/30">0{index + 1}</span>
          </div>
          <div className="relative mt-auto">
            <div className="mb-5 h-px w-8 bg-[#8b7cff]" />
            <h3 className="text-2xl font-semibold leading-[1.05] tracking-[-.04em]">{preset.name}</h3>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#76dce8]">{preset.playerCount}</p>
            <p className="mt-4 line-clamp-3 text-xs leading-6 text-[#9ba3b5]">{preset.tagline}</p>
            <button disabled={!!busy} onClick={() => setSelectedPreset(preset)} className="mt-6 flex w-full items-center justify-between border-t border-white/10 pt-4 text-left text-xs font-semibold text-[#d9deea] transition group-hover:text-white">
              {busy === preset.name ? 'Opening the game…' : 'Choose how to play'} <span className="transition group-hover:translate-x-1">→</span>
            </button>
          </div>
        </article>)}
      </div>
    </section>

    <section className="page-wrap mt-20 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-5 flex items-end justify-between">
        <div><p className="eyebrow eyebrow-muted">Community canon</p><h2 className="mt-2 text-xl font-semibold tracking-[-.025em]">Stories already in motion</h2></div>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-white/[.09] bg-[#0c1019]/65">
          {loading ? <div className="p-8 text-sm text-[#747c8f]">Opening the library…</div> : worlds.length ? worlds.map((world, index) => <article key={world.id} className={`group grid gap-4 p-5 transition hover:bg-[#8b7cff]/[.035] sm:grid-cols-[1fr_auto] sm:items-center ${index ? 'border-t border-white/[.07]' : ''}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#70788b]">{world.genre} · {world.turnCount} {world.turnCount === 1 ? 'turn' : 'turns'}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-.025em] text-[#e7eaf2]">{world.name}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-[#687084]">{world.rulesText}</p>
            </div>
            <button onClick={() => router.push(`/yaggdrasil/world/${world.id}`)} className="btn btn-quiet w-full sm:w-auto">View story <span aria-hidden="true">→</span></button>
          </article>) : <div className="p-8">
            <p className="text-lg font-semibold tracking-[-.02em]">The shelves are quiet.</p>
            <p className="mt-2 text-sm text-[#747c8f]">Create the first public world and give someone else a door to open.</p>
            <Link href="/yaggdrasil/create" className="text-link mt-4 inline-block text-xs">Begin a world →</Link>
          </div>}
        </div>
      </div>

      <aside className="glass-card h-fit rounded-[22px] p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#8b7cff]/30 bg-[#8b7cff]/10 text-[#a99dff]" aria-hidden="true">⌁</div>
        <p className="eyebrow mt-5">Private invitation</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-.025em]">Enter by secret passage.</h2>
        <p className="mt-2 text-xs leading-5 text-[#747c8f]">Paste the world ID from your invitation and unlock it with the shared password.</p>
        <div className="mt-5 space-y-3">
          <label className="form-label">World ID<input className="field" value={privateId} onChange={event => setPrivateId(event.target.value)} placeholder="e.g. vR3jK8…" /></label>
          <label className="form-label">Password<input className="field" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="The secret phrase" /></label>
          <button disabled={!privateId.trim()} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40" onClick={() => router.push(`/yaggdrasil/world/${privateId}?password=${encodeURIComponent(password)}`)}>Open invitation <ArrowIcon /></button>
        </div>
      </aside>
    </section>
    {error && <div className="page-wrap mt-6"><div className="error-banner" role="alert">{error}</div></div>}

    {selectedPreset && <div className="fixed inset-0 z-50 grid place-items-center bg-[#05070c]/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="play-mode-title" onMouseDown={event => { if (event.currentTarget === event.target && !busy) setSelectedPreset(null); }}>
      <section className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#8b7cff]/25 bg-[#0c1019] shadow-[0_30px_120px_rgba(0,0,0,.7),0_0_80px_rgba(91,75,210,.12)]">
        <div className="border-b border-white/[.07] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow text-[#a99dff]">{selectedPreset.genre}</p>
              <h2 id="play-mode-title" className="mt-3 text-3xl font-semibold tracking-[-.045em]">Who is entering this game?</h2>
              <p className="mt-3 text-sm leading-6 text-[#8e96a8]">{selectedPreset.name} adapts its cast and story protocol to your choice.</p>
            </div>
            <button disabled={!!busy} onClick={() => setSelectedPreset(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.08] text-[#747c8f] transition hover:border-white/20 hover:text-white" aria-label="Close">×</button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <button disabled={!!busy} onClick={() => choosePreset(selectedPreset, 'solo')} className="group rounded-[20px] border border-white/[.09] bg-white/[.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#8b7cff]/45 hover:bg-[#8b7cff]/[.06] disabled:opacity-50">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#8b7cff]/20 bg-[#8b7cff]/10 text-[#a99dff]">01</span>
            <span className="mt-5 block text-lg font-semibold">Play solo</span>
            <span className="mt-2 block text-xs leading-5 text-[#747c8f]">A private, unlisted run. NPC companions fill missing roles without taking over your choices.</span>
            <span className="mt-5 flex items-center justify-between text-xs font-semibold text-[#a99dff]">{busy ? 'Building your run…' : 'Begin alone'} <span className="transition group-hover:translate-x-1">→</span></span>
          </button>
          <button disabled={!!busy} onClick={() => choosePreset(selectedPreset, 'group')} className="group rounded-[20px] border border-[#6ee7f2]/15 bg-[#6ee7f2]/[.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#6ee7f2]/40 hover:bg-[#6ee7f2]/[.055] disabled:opacity-50">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#6ee7f2]/20 bg-[#6ee7f2]/10 text-[#76dce8]">02</span>
            <span className="mt-5 block text-lg font-semibold">Play with others</span>
            <span className="mt-2 block text-xs leading-5 text-[#747c8f]">A shared world friends can join. Visible actions, clues, and scene consequences become co-op canon.</span>
            <span className="mt-5 flex items-center justify-between text-xs font-semibold text-[#76dce8]">{busy ? 'Opening the table…' : 'Create co-op world'} <span className="transition group-hover:translate-x-1">→</span></span>
          </button>
        </div>
      </section>
    </div>}
    {trailerChoice && <PresetCinematicTrailer trailerId={PRESET_TRAILERS[trailerChoice.preset.name].id} title={trailerChoice.preset.name} onComplete={completeTrailer} />}
  </main>;
}
