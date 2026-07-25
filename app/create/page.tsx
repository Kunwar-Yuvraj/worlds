'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader } from '@/lib/firebase/client';
import { ArrowIcon, Brand, SparkIcon } from '@/components/Brand';

type Form = {
  name: string;
  genre: string;
  premise: string;
  tone: string;
  powerSystem: string;
  hardRules: string;
  factions: string;
  startingPressure: string;
  playerProtocol: string;
  storyProtocol: string;
  rulesText: string;
  visibility: 'public' | 'private';
  password: string;
};

const initial: Form = {
  name: '',
  genre: 'Murder mystery',
  premise: '',
  tone: 'Tense, cinematic, character-led',
  powerSystem: 'Grounded human capability; influence, leverage, and evidence have real costs.',
  hardRules: '',
  factions: '',
  startingPressure: '',
  playerProtocol: 'Every player owns a private protagonist arc. Players meet only through shared locations, visible actions, or agreed scenes.',
  storyProtocol: 'Claims are leads until verified. Private motives remain private. Shared canon records only observable consequences.',
  rulesText: '',
  visibility: 'public',
  password: '',
};

const genres = ['Murder mystery', 'Dark fantasy', 'Science fiction', 'Post-apocalyptic', 'Noir thriller', 'Historical intrigue'];

function SectionHeading({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="mb-6 flex gap-4">
    <span className="text-xs font-bold tracking-[.12em] text-[#8b7cff]">{number}</span>
    <div><h2 className="text-xl font-semibold tracking-[-.025em]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#747c8f]">{copy}</p></div>
  </div>;
}

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const update = (key: keyof Form, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function autoGenerate() {
    if (!idea.trim()) return setError('Give us a sentence or two about the world first.');
    setDrafting(true);
    setError('');
    try {
      const response = await fetch('/api/worlds/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ description: idea }),
      });
      const draft = await response.json();
      if (!response.ok) throw new Error(draft.error);
      setForm(current => ({
        ...current,
        name: draft.name || current.name,
        genre: draft.genre || current.genre,
        premise: draft.premise || current.premise,
        tone: draft.tone || current.tone,
        powerSystem: draft.powerSystem || current.powerSystem,
        hardRules: Array.isArray(draft.hardRules) ? draft.hardRules.join('\n') : current.hardRules,
        factions: Array.isArray(draft.factions) ? draft.factions.join(', ') : current.factions,
        startingPressure: draft.startingPressure || current.startingPressure,
        playerProtocol: draft.playerProtocol || current.playerProtocol,
        storyProtocol: draft.storyProtocol || current.storyProtocol,
        rulesText: draft.rulesText || current.rulesText,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not shape that idea.');
    } finally {
      setDrafting(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        hardRules: form.hardRules.split('\n').map(item => item.trim()).filter(Boolean),
        factions: form.factions.split(',').map(item => item.trim()).filter(Boolean),
      };
      const response = await fetch('/api/worlds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/world/${body.worldId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create this world.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="app-shell min-h-screen pb-20">
    <nav className="page-wrap flex items-center justify-between py-6">
      <Brand />
      <Link href="/join" className="text-link flex items-center gap-2 text-xs">Explore instead <ArrowIcon /></Link>
    </nav>

    <header className="page-wrap border-b border-white/[.08] pb-9 pt-10">
      <p className="eyebrow">World studio</p>
      <div className="mt-4 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl">Design the rules.<br /><span className="bg-gradient-to-r from-[#a99dff] to-[#75dce8] bg-clip-text text-transparent">Set the story alive.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#8e96a8]">Start with one strong idea. Shape its tone and boundaries, then invite players into a world that remembers every consequence.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#626a7d]">
          <span className="text-[#a99dff]">01 Idea</span><span className="h-px w-7 bg-white/10" /><span>02 Rules</span><span className="h-px w-7 bg-white/10" /><span>03 Access</span>
        </div>
      </div>
    </header>

    <form onSubmit={submit} className="page-wrap mt-10 grid items-start gap-8 lg:grid-cols-[1fr_330px]">
      <div className="space-y-6">
        <section className="glass-card rounded-[24px] p-6 sm:p-8">
          <SectionHeading number="01" title="Begin with a spark" copy="Describe the world naturally. The architect can turn it into editable parameters." />
          <textarea
            className="field min-h-32 resize-y text-base leading-7"
            value={idea}
            onChange={event => setIdea(event.target.value)}
            placeholder="A rain-soaked city where a locked-room murder could ignite a gang war..."
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#656d7f]">A vivid sentence is enough to start.</p>
            <button type="button" disabled={drafting} onClick={autoGenerate} className="btn btn-quiet">
              <SparkIcon /> {drafting ? 'Shaping your world…' : 'Generate the foundation'}
            </button>
          </div>
        </section>

        <section className="glass-card rounded-[24px] p-6 sm:p-8">
          <SectionHeading number="02" title="Name the world" copy="These are the first words players see when choosing a story." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">World name<input required className="field" value={form.name} onChange={event => update('name', event.target.value)} placeholder="The Locked Pavilion" /></label>
            <label className="form-label">Genre
              <select required className="field" value={form.genre} onChange={event => update('genre', event.target.value)}>
                {genres.map(genre => <option key={genre}>{genre}</option>)}
              </select>
            </label>
          </div>
          <label className="form-label mt-5">Core premise<textarea required className="field min-h-28 resize-y" value={form.premise} onChange={event => update('premise', event.target.value)} placeholder="Where are we, what is changing, and why must someone act now?" /></label>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="form-label">Tone<textarea className="field min-h-24 resize-y" value={form.tone} onChange={event => update('tone', event.target.value)} /></label>
            <label className="form-label">Starting pressure<textarea className="field min-h-24 resize-y" value={form.startingPressure} onChange={event => update('startingPressure', event.target.value)} placeholder="The immediate danger or unanswered question." /></label>
          </div>
        </section>

        <section className="glass-card rounded-[24px] p-6 sm:p-8">
          <SectionHeading number="03" title="Set the laws" copy="Good constraints create better choices. Define what the narrator must never forget." />
          <label className="form-label">Power and capability system<textarea className="field min-h-24 resize-y" value={form.powerSystem} onChange={event => update('powerSystem', event.target.value)} placeholder="What is possible, impossible, and costly?" /></label>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="form-label">Hard rules <span className="form-hint">— one per line</span><textarea className="field min-h-32 resize-y" value={form.hardRules} onChange={event => update('hardRules', event.target.value)} placeholder={'Magic takes a memory\nNo one can be resurrected'} /></label>
            <label className="form-label">Factions <span className="form-hint">— comma separated</span><textarea className="field min-h-32 resize-y" value={form.factions} onChange={event => update('factions', event.target.value)} placeholder="City Hall, Fourth Precinct, The Bell Society" /></label>
          </div>
          <details className="mt-6 rounded-2xl border border-white/[.08] bg-black/10">
            <summary className="cursor-pointer list-none p-4 text-xs font-semibold text-[#a9b0c0]">Advanced story protocols <span className="float-right text-[#687084]">＋</span></summary>
            <div className="space-y-5 border-t border-white/[.07] p-4">
              <label className="form-label">Player protocol<textarea className="field min-h-24 resize-y" value={form.playerProtocol} onChange={event => update('playerProtocol', event.target.value)} /></label>
              <label className="form-label">Canon protocol<textarea className="field min-h-24 resize-y" value={form.storyProtocol} onChange={event => update('storyProtocol', event.target.value)} /></label>
            </div>
          </details>
          <label className="form-label mt-5">Narrator’s non-negotiables<textarea required className="field min-h-28 resize-y" value={form.rulesText} onChange={event => update('rulesText', event.target.value)} placeholder="Any final rule the narrator must always respect." /></label>
        </section>
      </div>

      <aside className="glass-card top-6 rounded-[24px] p-6 lg:sticky">
        <p className="eyebrow">03 · Access</p>
        <h2 className="serif mt-3 text-2xl">Who finds this story?</h2>
        <p className="mt-2 text-xs leading-5 text-[#747c8f]">Public worlds appear in the library. Private worlds need their ID and password.</p>
        <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
          <button type="button" aria-pressed={form.visibility === 'public'} className={`rounded-[9px] px-3 py-2.5 text-xs font-semibold transition ${form.visibility === 'public' ? 'bg-[#8b7cff] text-white shadow-[0_8px_22px_rgba(139,124,255,.22)]' : 'text-[#737b8d]'}`} onClick={() => setForm(current => ({ ...current, visibility: 'public' }))}>Public</button>
          <button type="button" aria-pressed={form.visibility === 'private'} className={`rounded-[9px] px-3 py-2.5 text-xs font-semibold transition ${form.visibility === 'private' ? 'bg-[#8b7cff] text-white shadow-[0_8px_22px_rgba(139,124,255,.22)]' : 'text-[#737b8d]'}`} onClick={() => setForm(current => ({ ...current, visibility: 'private' }))}>Private</button>
        </div>
        {form.visibility === 'private' && <label className="form-label mt-5">World password<input required type="password" className="field" value={form.password} onChange={event => update('password', event.target.value)} placeholder="Choose a memorable key" /></label>}
        <div className="my-6 divider" />
        <div className="space-y-3 text-xs text-[#7c8496]">
          <p className="flex gap-3"><span className="text-[#6ee7f2]">✓</span> Opening scene and plot bible</p>
          <p className="flex gap-3"><span className="text-[#6ee7f2]">✓</span> Persistent shared canon</p>
          <p className="flex gap-3"><span className="text-[#6ee7f2]">✓</span> Player-specific protagonists</p>
        </div>
        {error && <div className="error-banner mt-5" role="alert">{error}</div>}
        <button disabled={busy} className="btn btn-primary mt-6 w-full">{busy ? 'Opening the first chapter…' : 'Create this world'} <ArrowIcon /></button>
        <p className="mt-3 text-center text-[10px] leading-4 text-[#5b6375]">The first scene may take a moment to write.</p>
      </aside>
    </form>
  </main>;
}
