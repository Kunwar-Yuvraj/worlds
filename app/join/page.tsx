'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader } from '@/lib/firebase/client';
import { PRESETS } from '@/lib/presets';
import { ArrowIcon, Brand } from '@/components/Brand';

type Listed = { id: string; name: string; genre: string; rulesText: string; turnCount: number };

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

  useEffect(() => {
    fetch('/api/worlds')
      .then(response => response.json())
      .then(body => setWorlds(body.worlds ?? []))
      .catch(() => setError('The public library could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  async function openPreset(name: string) {
    setBusy(name);
    setError('');
    try {
      const response = await fetch('/api/worlds/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ presetName: name }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/world/${body.worldId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open that world.');
      setBusy('');
    }
  }

  return <main className="app-shell min-h-screen pb-24">
    <nav className="page-wrap flex items-center justify-between py-6">
      <Brand />
      <Link href="/create" className="btn btn-primary">Create a world <ArrowIcon /></Link>
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
        <div><p className="eyebrow eyebrow-muted">Curated beginnings</p><h2 className="mt-2 text-xl font-semibold tracking-[-.025em]">Start at chapter one</h2></div>
        <span className="hidden text-xs text-[#687084] sm:inline">{PRESETS.length} worlds</span>
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
            <p className="mt-4 line-clamp-4 text-xs leading-6 text-[#9ba3b5]">{preset.seedContext.split('\n')[0]}</p>
            <button disabled={!!busy} onClick={() => openPreset(preset.name)} className="mt-6 flex w-full items-center justify-between border-t border-white/10 pt-4 text-left text-xs font-semibold text-[#d9deea] transition group-hover:text-white">
              {busy === preset.name ? 'Opening the story…' : 'Enter this world'} <span className="transition group-hover:translate-x-1">→</span>
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
            <button onClick={() => router.push(`/world/${world.id}`)} className="btn btn-quiet w-full sm:w-auto">View story <span aria-hidden="true">→</span></button>
          </article>) : <div className="p-8">
            <p className="text-lg font-semibold tracking-[-.02em]">The shelves are quiet.</p>
            <p className="mt-2 text-sm text-[#747c8f]">Create the first public world and give someone else a door to open.</p>
            <Link href="/create" className="text-link mt-4 inline-block text-xs">Begin a world →</Link>
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
          <button disabled={!privateId.trim()} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40" onClick={() => router.push(`/world/${privateId}?password=${encodeURIComponent(password)}`)}>Open invitation <ArrowIcon /></button>
        </div>
      </aside>
    </section>
    {error && <div className="page-wrap mt-6"><div className="error-banner" role="alert">{error}</div></div>}
  </main>;
}
