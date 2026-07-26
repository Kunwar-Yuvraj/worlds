'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authHeader } from '@/lib/firebase/client';
import { ArrowIcon, Brand } from '@/components/Brand';
import { StoryOracle } from '@/components/StoryOracle';
import type { OracleMessage } from '@/components/StoryOracle';

type Profile = {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  background: string;
  strengths: string[];
  constraints: string[];
  goals: string[];
  privateArc: string;
};
type PlayerState = {
  currentLocationId: string;
  currentObjective: string;
  currentActivity: string;
  privateSummary: string;
  activeQuestIds: string[];
  knownFacts: { fact: string; source: string; certainty: string }[];
  relationships: { entityId: string; label: string; trust: number; summary: string }[];
  inventory: string[];
  condition: string;
  cliffhanger: string;
  turnCount: number;
};
type Data = {
  world: {
    id: string;
    name: string;
    genre: string;
    visibility: string;
    worldSummary: string;
    storyState: { currentTime: string; publicSummary: string; currentSituation: string };
    worldParameters: { premise: string; tone: string; powerSystem: string; hardRules: string[]; factions: string[] };
    plotThreads: { id: string; title: string; status: string; publicSummary: string; stakes: string }[];
    turnCount: number;
  };
  player: { displayName: string; profile: Profile; state: PlayerState } | null;
  locations: { id: string; name: string; description: string; atmosphere: string; publicState: string }[];
  npcs: { id: string; name: string; role: string; appearance: string; personality: string; publicFace: string; currentLocationId: string; publicSummary: string }[];
  scene: { participantIds: string[]; sharedSummary: string; status: string } | null;
  events: { id: string; type: string; content: string; scope: 'private' | 'scene' | 'world'; actorId?: string | null; sequenceNumber?: number; optionsOffered?: string[] }[];
};

function readableNarration(content: string) {
  const normalized = content.trim().replace(/\s+(?=["“])/g, '\n\n');
  const explicitBlocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);

  return explicitBlocks.flatMap(block => {
    if (block.length <= 230) return [block];
    const sentences = block.match(/[^.!?]+(?:[.!?]+["”']?|$)/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [block];
    const paragraphs: string[] = [];
    let paragraph = '';
    sentences.forEach(sentence => {
      if (paragraph && (paragraph.length + sentence.length > 230 || paragraph.split(/[.!?]/).length > 2)) {
        paragraphs.push(paragraph);
        paragraph = sentence;
      } else {
        paragraph = paragraph ? `${paragraph} ${sentence}` : sentence;
      }
    });
    if (paragraph) paragraphs.push(paragraph);
    return paragraphs;
  });
}

function EmptyLoading({ error }: { error?: string }) {
  return <main className="app-shell grid min-h-screen place-items-center px-5">
    <div className="text-center">
      <span className="mx-auto block h-8 w-8 animate-spin rounded-full border border-white/10 border-t-[#8b7cff]" />
      <p className={`mt-5 text-sm ${error ? 'text-[#ff9cad]' : 'text-[#747c8f]'}`}>{error || 'Opening the world…'}</p>
    </div>
  </main>;
}

export default function WorldRoom({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('');
  const [password, setPassword] = useState('');
  const [memoryDocked, setMemoryDocked] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(true);
  const [protagonistOpen, setProtagonistOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [storyStatsOpen, setStoryStatsOpen] = useState(true);
  const [join, setJoin] = useState({ name: '', background: '', appearance: '', personality: '', storyIntent: '' });
  const storyEndRef = useRef<HTMLDivElement>(null);
  const memoryReopenGuardRef = useRef(false);
  const memoryDockBeforeFocusRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/worlds/${id}`, { headers: await authHeader(), cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load this world.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Warm the narrator route while the player reads, so the first committed turn
    // does not pay Next.js' development-time route compilation cost.
    void fetch(`/api/worlds/${id}/action`, { cache: 'no-store' }).catch(() => undefined);
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  useEffect(() => {
    const keepMemoryVisible = () => {
      if (window.innerWidth < 1280) setMemoryDocked(false);
    };
    window.addEventListener('resize', keepMemoryVisible);
    return () => window.removeEventListener('resize', keepMemoryVisible);
  }, []);

  useEffect(() => {
    setMemoryDocked(false);
  }, [id]);

  useEffect(() => {
    if (!focusMode) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusMode(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [focusMode]);

  async function joinWorld() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/worlds/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          password: password || new URLSearchParams(window.location.search).get('password'),
          displayName: join.name,
          background: join.background,
          appearance: join.appearance,
          personality: join.personality,
          storyIntent: join.storyIntent,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to cast your character.');
    } finally {
      setBusy(false);
    }
  }

  async function act(value = action, consultation: OracleMessage[] = []): Promise<boolean> {
    if (!value.trim() || busy) return false;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/worlds/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ action: value, consultation }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAction('');
      await load();
      requestAnimationFrame(() => storyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That action could not be resolved.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function collapseWorldMemory() {
    memoryReopenGuardRef.current = false;
    setMemoryOpen(false);
  }

  function revealWorldMemory(docked = false) {
    memoryReopenGuardRef.current = !docked;
    setMemoryDocked(docked);
    setMemoryOpen(true);
    if (docked) return;
    window.setTimeout(() => {
      memoryReopenGuardRef.current = false;
    }, 450);
  }

  if (loading) return <EmptyLoading />;
  if (!data) return <EmptyLoading error={error || 'This world could not be found.'} />;
  if (!data.player) return <CharacterEntry data={data} join={join} setJoin={setJoin} password={password} setPassword={setPassword} busy={busy} error={error} onJoin={joinWorld} />;

  const profile = data.player.profile;
  const state = data.player.state;
  const latestNarration = [...data.events].reverse().find(event => event.type === 'narration' && (event.optionsOffered?.length ?? 0) > 0);
  const latestForeignSharedUpdate = [...data.events].reverse().find(event =>
    (event.scope === 'scene' || event.scope === 'world')
    && event.actorId !== latestNarration?.actorId
    && (event.sequenceNumber ?? 0) > (latestNarration?.sequenceNumber ?? -1)
  );
  const offeredOptions = latestForeignSharedUpdate ? [] : (latestNarration?.optionsOffered ?? []);
  const location = data.locations.find(item => item.id === state.currentLocationId);
  const localNpcs = data.npcs.filter(npc => npc.currentLocationId === state.currentLocationId);
  const sharedBeat = latestForeignSharedUpdate?.content.replace(/\s+/g, ' ').trim();
  const sharedBeatPreview = sharedBeat && sharedBeat.length > 72 ? `${sharedBeat.slice(0, 69)}…` : sharedBeat;
  const options = offeredOptions.length > 0 ? offeredOptions.slice(0, 3) : sharedBeatPreview ? [
    `Investigate the new development: “${sharedBeatPreview}”`,
    localNpcs[0] ? `Ask ${localNpcs[0].name} what they noticed about the change` : `Watch ${location?.name || 'the scene'} for the immediate consequences`,
    state.currentObjective ? `Reassess “${state.currentObjective}” against the changed scene` : 'Adapt your plan before the shared scene shifts again',
  ] : [
    `Search ${location?.name || 'the area'} for a detail everyone else may have missed`,
    localNpcs[0] ? `Speak to ${localNpcs[0].name} and test their story` : 'Stay quiet and watch for a change in the scene',
    state.currentObjective ? `Take a careful step toward: ${state.currentObjective}` : 'Follow the most urgent unresolved lead',
  ];

  return <main className="app-shell min-h-screen overflow-visible">
    <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07090f]/[.98]">
      <div className="page-wrap flex min-h-[68px] items-center justify-between gap-4">
        <Brand />
        <div className="min-w-0 text-center">
          <p className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-[#687084] sm:block">{data.world.genre} · {data.world.storyState.currentTime || 'Time unknown'}</p>
          <h1 className="truncate text-sm font-semibold tracking-[-.02em] sm:mt-1 sm:text-base">{data.world.name}</h1>
        </div>
        <Link href="/yaggdrasil/join" className="text-link text-xs">Leave <span className="hidden sm:inline">world</span> ↗</Link>
      </div>
    </header>

    <div className={`mx-auto grid w-[min(1440px,calc(100%-48px))] items-start gap-5 py-6 transition-[grid-template-columns] duration-300 ${protagonistOpen ? 'lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)_280px]' : 'lg:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[72px_minmax(0,1fr)_280px]'}`}>
      <aside className="hidden space-y-4 lg:block">
        {protagonistOpen ? <div className="relative">
          <button onClick={() => setProtagonistOpen(false)} className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-xl border border-white/[.08] bg-[#0c1019] text-[#747c8f] transition hover:border-[#8b7cff]/35 hover:text-[#a99dff]" aria-label="Collapse protagonist">−</button>
          <CharacterDossier profile={profile} state={state} />
        </div> : <button onClick={() => setProtagonistOpen(true)} className="flex h-[calc(100vh-116px)] min-h-[680px] max-h-[900px] w-full flex-col items-center rounded-[24px] border border-[#8b7cff]/20 bg-[#0a0e17]/95 px-3 py-5 text-[#747c8f] transition hover:border-[#8b7cff]/40 hover:text-[#a99dff]" aria-label="Expand protagonist">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8b7cff]/10 text-sm font-semibold text-[#a99dff]">{profile.name?.charAt(0) || '?'}</span>
          <span className="mt-5 text-[9px] font-bold uppercase tracking-[.18em] [writing-mode:vertical-rl]">Your protagonist</span>
          <span className="mt-auto text-lg">＋</span>
        </button>}
      </aside>

      <div className="min-w-0">
        <details className="mt-4 rounded-[18px] border border-white/[.08] bg-[#0c1019]/80 lg:hidden">
          <summary className="cursor-pointer list-none p-4 text-xs font-semibold text-[#c4c9d5]">Your protagonist · {profile.name}<span className="float-right text-[#8b7cff]">＋</span></summary>
          <div className="border-t border-white/[.07] p-4"><CharacterDossier profile={profile} state={state} compact /></div>
        </details>
        <details className="mt-3 rounded-[18px] border border-white/[.08] bg-[#0c1019]/80 xl:hidden">
          <summary className="cursor-pointer list-none p-4 text-xs font-semibold text-[#c4c9d5]">Scene context<span className="float-right text-[#8b7cff]">＋</span></summary>
          <div className="grid gap-px border-t border-white/[.07] bg-white/[.06] sm:grid-cols-2">
            <SceneContext title="Your location" primary={location?.name || state.currentLocationId} secondary={location?.publicState || location?.atmosphere} />
            <SceneContext title="In the room" primary={localNpcs.map(npc => npc.name).join(', ') || 'Only shadows—for now.'} secondary={localNpcs[0]?.publicFace || 'No one obvious is watching.'} />
          </div>
        </details>

        <section
          className={`overflow-hidden border border-[#8b7cff]/20 shadow-[0_30px_90px_rgba(0,0,0,.4),0_0_80px_rgba(91,75,210,.06)] ${focusMode ? 'fixed inset-0 z-50 isolate flex h-screen min-h-0 max-h-none flex-col rounded-none bg-[#070a12]' : 'relative mt-4 rounded-[28px] bg-[#0a0e17]/95 lg:mt-0 lg:flex lg:h-[calc(100vh-116px)] lg:min-h-[680px] lg:max-h-[900px] lg:flex-col'}`}
          onWheel={event => {
            if (focusMode) return;
            memoryReopenGuardRef.current = false;
            if (memoryOpen && window.innerWidth >= 1280 && event.deltaY > 4 && !memoryDocked) setMemoryDocked(true);
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top_right,rgba(139,124,255,.16),transparent_64%)]" />
          <div className={`relative shrink-0 overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${memoryDocked || !memoryOpen ? 'pointer-events-none max-h-0 opacity-0' : 'max-h-[620px] opacity-100'}`}>
            <WorldMemoryPanel storyState={data.world.storyState} onCollapse={collapseWorldMemory} />
          </div>
          {!memoryOpen && !memoryDocked && <button
            type="button"
            onClick={() => revealWorldMemory(false)}
            aria-label="Reopen world memory"
            className="group relative flex w-full shrink-0 items-center justify-between border-b border-white/[.08] bg-[#0d121e]/95 px-6 py-3 text-left transition hover:bg-[#8b7cff]/[.07] sm:px-8"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#8b7cff]/20 bg-[#8b7cff]/10 text-[#a99dff]" aria-hidden="true">⌁</span>
              <span>
                <span className="eyebrow block">World memory</span>
                <span className="mt-0.5 block text-[10px] text-[#626a7d]">Canonical state is collapsed</span>
              </span>
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#8b7cff]/20 text-[#a99dff] transition group-hover:border-[#8b7cff]/45">＋</span>
          </button>}

          {data.scene && <div className="relative border-b border-[#6ee7f2]/15 bg-[#6ee7f2]/[.035] px-6 py-5 sm:px-9">
            <div className="flex items-center gap-3"><span className="live-dot" /><p className="eyebrow text-[#6ee7f2]">Shared scene</p></div>
            <p className="serif mt-3 leading-7 text-[#d9dee8]">{data.scene.sharedSummary || 'Other protagonists are nearby. Visible actions here may become shared canon.'}</p>
          </div>}

          <div className="flex flex-col lg:min-h-0 lg:flex-1">
            <div className="relative flex shrink-0 items-center justify-between border-b border-white/[.07] bg-[#0d121e]/70 px-6 py-4 sm:px-9">
              <div className="flex items-center gap-3">
                <span className="h-px w-5 bg-[#8b7cff]" />
                <div><p className="eyebrow eyebrow-muted">Narrative stream</p><h2 className="mt-1 text-sm font-semibold tracking-[-.015em]">Your chronicle</h2></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  if (!focusMode) {
                    memoryDockBeforeFocusRef.current = memoryDocked;
                    if (memoryOpen) revealWorldMemory(false);
                    else setMemoryDocked(false);
                  } else if (memoryDockBeforeFocusRef.current) {
                    setMemoryDocked(true);
                  }
                  setFocusMode(open => !open);
                }} className="rounded-lg border border-white/[.08] px-2.5 py-1.5 text-[9px] font-semibold text-[#8e96a8] transition hover:border-[#6ee7f2]/30 hover:text-[#76dce8]">{focusMode ? 'Exit focus' : 'Full screen'} <span aria-hidden="true">{focusMode ? '↙' : '↗'}</span></button>
              </div>
            </div>

            <div
              className="module-scroll relative flex-1 overflow-y-auto overscroll-contain px-6 py-3 sm:px-9"
              onScroll={event => {
                if (focusMode || memoryReopenGuardRef.current || window.innerWidth < 1280) return;
                const scrollTop = event.currentTarget.scrollTop;
                if (scrollTop > 36 && !memoryDocked) setMemoryDocked(true);
              }}
            >
              {data.events.length ? data.events.map((event, index) => {
                const narration = event.type === 'narration';
                const actionEvent = event.type === 'action' || event.type === 'player_action';
                return <article key={event.id} className={`relative border-b border-white/[.055] py-7 last:border-0 ${narration ? '' : 'pl-5'}`}>
                  {narration && <span className="absolute -left-6 top-9 hidden h-px w-4 bg-[#8b7cff] sm:block" />}
                  <div className="mb-3 flex items-center gap-3">
                    <p className={`text-[9px] font-bold uppercase tracking-[.2em] ${narration ? 'text-[#a99dff]' : 'text-[#687084]'}`}>
                      {event.scope === 'world' ? 'World canon' : event.scope === 'scene' ? 'Shared scene' : narration ? 'Narrator' : actionEvent ? 'Your choice' : 'World'}
                    </p>
                    <span className="h-px flex-1 bg-white/[.04]" />
                    <span className="text-[9px] text-[#4f5769]">#{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  {narration
                    ? <div className="serif space-y-4 text-lg leading-8 text-[#dfe3ec] sm:text-[1.18rem] sm:leading-9">{readableNarration(event.content).map((paragraph, paragraphIndex) => <p key={`${event.id}-${paragraphIndex}`} className="whitespace-pre-line">{paragraph}</p>)}</div>
                    : <p className={actionEvent ? 'text-sm italic leading-6 text-[#a9b0c0]' : 'whitespace-pre-line text-sm leading-6 text-[#8e96a8]'}>{actionEvent ? `“${event.content}”` : event.content}</p>}
                </article>;
              }) : <div className="py-14 text-center"><p className="text-lg font-semibold text-[#b7bdca]">The page is waiting.</p><p className="mt-2 text-xs text-[#687084]">Your first choice begins the chronicle.</p></div>}
              <div ref={storyEndRef} />
            </div>
          </div>

          <div className={`relative shrink-0 border-t border-[#8b7cff]/20 bg-[linear-gradient(180deg,rgba(20,26,44,.95),rgba(13,18,31,.98))] ${focusMode ? 'p-2' : 'p-2.5 sm:p-3'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8b7cff]/10 text-xs text-[#a99dff]">✦</span><p className="eyebrow">Next move</p></div>
              <span className="hidden text-[10px] text-[#626a7d] sm:block">Your action becomes canon</span>
            </div>
            {options.length > 0 && <>
              <div className="mt-2 flex items-center gap-3"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#687084]">Suggested next moves</p><span className="h-px flex-1 bg-white/[.06]" /></div>
              <div className="mt-1.5 grid gap-2 md:grid-cols-3">
              {options.map((option, index) => <button disabled={busy} onClick={() => act(option)} key={option} className={`group flex w-full items-center gap-2 rounded-xl border border-white/[.08] bg-[#090d16]/65 px-3 text-left text-xs leading-5 text-[#b7bdca] transition hover:-translate-y-0.5 hover:border-[#8b7cff]/45 hover:bg-[#8b7cff]/[.07] hover:text-white ${focusMode ? 'min-h-[42px] py-1.5' : 'min-h-[50px] py-2'}`}>
                <span className="shrink-0 text-[9px] font-semibold text-[#687084]">0{index + 1}</span>
                <span className="flex-1">{option}</span>
                <span className="shrink-0 transition group-hover:translate-x-1 group-hover:text-[#a99dff]">→</span>
              </button>)}
              </div>
            </>}
            <div className="mt-2 flex gap-2 rounded-[14px] border border-white/[.08] bg-[#070a11]/65 p-1 focus-within:border-[#8b7cff]/45 focus-within:ring-2 focus-within:ring-[#8b7cff]/10">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#f7f8fc] outline-none placeholder:text-[#535b6d]"
                value={action}
                onChange={event => setAction(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) act(); }}
                placeholder={options[0] ? `Try: “${options[0]}” — or write your own…` : 'Describe what your character does next…'}
                aria-label="Your next action"
              />
              <button disabled={busy || !action.trim()} onClick={() => act()} className="btn btn-primary min-w-20 px-4 sm:min-w-28">{busy ? <span className="animate-pulse">Writing…</span> : <>Act <ArrowIcon /></>}</button>
            </div>
            {error && <div className="error-banner mt-3" role="alert">{error}</div>}
          </div>
        </section>
      </div>

      <aside className="sticky top-[92px] hidden h-[calc(100vh-116px)] min-h-[680px] max-h-[900px] flex-col xl:flex">
        {memoryDocked && !memoryOpen && <button
          type="button"
          onClick={() => revealWorldMemory(true)}
          aria-label="Expand docked world memory"
          className="mb-5 flex w-full shrink-0 items-center justify-between rounded-[18px] border border-[#8b7cff]/15 bg-[#0c1019]/95 px-4 py-3 text-left transition hover:border-[#8b7cff]/35 hover:bg-[#8b7cff]/[.05]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8b7cff]/10 text-[#a99dff]" aria-hidden="true">⌁</span>
            <span className="eyebrow">World memory</span>
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#8b7cff]/20 text-[#a99dff]">＋</span>
        </button>}
        <div className={`shrink-0 overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${memoryDocked && memoryOpen ? 'max-h-[620px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'}`}>
          <div className="pb-5"><WorldMemoryPanel storyState={data.world.storyState} compact onCollapse={collapseWorldMemory} /></div>
        </div>
        <div className={`min-h-0 overflow-hidden rounded-[22px] border border-white/[.09] bg-[#0c1019]/95 transition-[flex-grow] duration-200 ${storyStatsOpen ? 'flex flex-1 flex-col' : 'shrink-0'}`}>
          <button
            type="button"
            aria-expanded={storyStatsOpen}
            onClick={() => setStoryStatsOpen(open => !open)}
            className="flex w-full shrink-0 items-center justify-between px-5 py-4 text-left transition hover:bg-white/[.025]"
          >
            <span>
              <span className="eyebrow eyebrow-muted block">Story stats</span>
              <span className="mt-1 block text-[10px] text-[#626a7d]">{storyStatsOpen ? 'World and scene intelligence' : 'Open world and scene intelligence'}</span>
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[.08] text-sm text-[#8b7cff]">{storyStatsOpen ? '−' : '＋'}</span>
          </button>

          {storyStatsOpen && <div className="module-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/[.07]">
            <div className="p-5">
              <p className="eyebrow eyebrow-muted">Story state</p>
              <div className="mt-4 space-y-4 border-l border-white/[.08] pl-4">
                <div><p className="text-[9px] uppercase tracking-widest text-[#626a7d]">Turn</p><p className="mt-1 text-lg font-semibold">{data.world.turnCount}</p></div>
                <div><p className="text-[9px] uppercase tracking-widest text-[#626a7d]">Visibility</p><p className="mt-1 text-xs capitalize text-[#a9b0c0]">{data.world.visibility}</p></div>
                <div><p className="text-[9px] uppercase tracking-widest text-[#626a7d]">Continuity</p><p className="mt-1 flex items-center gap-2 text-xs text-[#a9b0c0]"><span className="live-dot" /> Synced</p></div>
              </div>
            </div>
            <div className="h-px bg-white/[.07]" />
            <SceneContext title="Your location" primary={location?.name || state.currentLocationId} secondary={location?.publicState || location?.atmosphere} />
            <div className="h-px bg-white/[.07]" />
            <SceneContext title="In the room" primary={localNpcs.map(npc => npc.name).join(', ') || 'Only shadows—for now.'} secondary={localNpcs[0]?.publicFace || 'No one obvious is watching.'} />
            {data.world.plotThreads?.length > 0 && <div className="border-t border-white/[.07] p-5">
              <p className="eyebrow eyebrow-muted">Open threads</p>
              <div className="mt-4 space-y-3">{data.world.plotThreads.slice(0, 3).map(thread => <div key={thread.id}><p className="text-xs leading-5 text-[#a9b0c0]">{thread.title}</p><p className="text-[9px] uppercase tracking-wider text-[#626a7d]">{thread.status}</p></div>)}</div>
            </div>}
          </div>}
        </div>
        <StoryOracle worldId={id} disabled={busy} onCommit={(oracleAction, transcript) => act(oracleAction, transcript)} />
      </aside>
    </div>
  </main>;
}

function SceneContext({ title, primary, secondary }: { title: string; primary: string; secondary?: string }) {
  return <div className="bg-[#0c1019] p-4">
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cff] shadow-[0_0_10px_rgba(139,124,255,.7)]" />
      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#687084]">{title}</p>
    </div>
    <p className="mt-2 text-xs font-semibold leading-5 text-[#d8dce6]">{primary}</p>
    {secondary && <p className="mt-1 text-[10px] leading-4 text-[#687084]">{secondary}</p>}
  </div>;
}

function WorldMemoryPanel({ storyState, compact = false, onCollapse }: { storyState: Data['world']['storyState']; compact?: boolean; onCollapse?: () => void }) {
  return <div className={compact
    ? 'rounded-[22px] border border-[#8b7cff]/15 bg-[#0c1019]/85 p-5'
    : 'relative shrink-0 border-b border-white/[.08] p-6 sm:p-8'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} grid place-items-center rounded-xl border border-[#8b7cff]/25 bg-[#8b7cff]/10 text-[#a99dff]`} aria-hidden="true">⌁</span>
        <div><p className="eyebrow">World memory</p><p className="mt-1 text-[10px] text-[#687084]">Canonical state · always current</p></div>
      </div>
      <div className="flex items-center gap-2">
        {!compact && <span className="flex items-center gap-2 rounded-full border border-[#6ee7f2]/15 bg-[#6ee7f2]/[.045] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#82dce5]"><span className="live-dot" /> Synced</span>}
        {onCollapse && <button onClick={onCollapse} className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.08] text-sm text-[#747c8f] transition hover:border-[#8b7cff]/35 hover:text-[#a99dff]" aria-label="Collapse world memory">−</button>}
      </div>
    </div>
    <p className={`serif text-[#dfe3ec] ${compact ? 'mt-4 text-sm leading-6' : 'mt-5 text-lg leading-8 sm:text-xl sm:leading-9'}`}>{storyState.publicSummary}</p>
    {storyState.currentSituation && <div className={`rounded-xl border border-[#8b7cff]/15 bg-[#8b7cff]/[.045] ${compact ? 'mt-4 px-3 py-2.5' : 'mt-5 px-4 py-3'}`}><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8f83eb]">Active situation</p><p className={`mt-2 leading-6 text-[#929aac] ${compact ? 'text-xs' : 'text-sm'}`}>{storyState.currentSituation}</p></div>}
  </div>;
}

function CharacterDossier({ profile, state, compact = false }: { profile: Profile; state: PlayerState; compact?: boolean }) {
  return <div className={compact ? '' : 'module-scroll rounded-[28px] border border-[#8b7cff]/20 bg-[#0a0e17]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,.28)] lg:h-[calc(100vh-116px)] lg:min-h-[680px] lg:max-h-[900px] lg:overflow-y-auto'}>
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#8b7cff]/25 bg-[#8b7cff]/10 text-sm font-semibold text-[#a99dff]">{profile.name?.charAt(0) || '?'}</span>
      <div className="min-w-0"><p className="eyebrow eyebrow-muted">Your protagonist</p><h2 className="mt-1 truncate text-base font-semibold tracking-[-.02em]">{profile.name}</h2></div>
    </div>
    <p className="mt-4 text-xs font-medium text-[#b8becb]">{profile.role}</p>
    {profile.appearance && <p className="mt-2 text-xs leading-5 text-[#747c8f]">{profile.appearance}</p>}
    <div className="my-5 divider" />
    <p className="eyebrow eyebrow-muted">Now</p>
    <p className="mt-2 text-sm leading-6 text-[#c8cdd8]">{state.currentObjective}</p>
    <p className="mt-2 text-[10px] uppercase tracking-wider text-[#687084]">{state.currentActivity} {state.condition ? `· ${state.condition}` : ''}</p>
    <div className="my-5 divider" />
    <p className="eyebrow eyebrow-muted">Private memory</p>
    <p className="mt-2 text-xs leading-6 text-[#8e96a8]">{state.privateSummary || profile.privateArc}</p>
    {state.cliffhanger && <p className="serif mt-3 text-sm italic leading-6 text-[#a99dff]">“{state.cliffhanger}”</p>}
    {(state.knownFacts?.length ?? 0) > 0 && <details className="mt-5 border-t border-white/[.07] pt-4">
      <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[.16em] text-[#687084]">Private leads <span className="float-right">＋</span></summary>
      <ul className="mt-3 space-y-3">{state.knownFacts.map(fact => <li key={`${fact.fact}-${fact.source}`} className="text-xs leading-5 text-[#8e96a8]"><span className="mr-2 text-[#8b7cff]">—</span>{fact.fact}<span className="block pl-4 text-[9px] uppercase tracking-wider text-[#596174]">{fact.certainty}</span></li>)}</ul>
    </details>}
  </div>;
}

type JoinState = { name: string; background: string; appearance: string; personality: string; storyIntent: string };

function CharacterEntry({
  data,
  join,
  setJoin,
  password,
  setPassword,
  busy,
  error,
  onJoin,
}: {
  data: Data;
  join: JoinState;
  setJoin: React.Dispatch<React.SetStateAction<JoinState>>;
  password: string;
  setPassword: (value: string) => void;
  busy: boolean;
  error: string;
  onJoin: () => void;
}) {
  const update = (key: keyof JoinState, value: string) => setJoin(current => ({ ...current, [key]: value }));
  return <main className="app-shell min-h-screen pb-16">
    <nav className="page-wrap flex items-center justify-between py-6"><Brand /><Link href="/yaggdrasil/join" className="text-link flex items-center gap-2 text-xs">Back to library <ArrowIcon /></Link></nav>
    <div className="page-wrap grid min-h-[calc(100vh-90px)] items-center gap-12 py-10 lg:grid-cols-[.9fr_1.1fr]">
      <section className="max-w-xl">
        <div className="flex items-center gap-3"><span className="h-px w-9 bg-[#8b7cff]" /><p className="eyebrow">{data.world.genre}</p></div>
        <h1 className="mt-6 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-6xl">{data.world.name}</h1>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[#687084]">Before you enter</p>
        <p className="serif mt-4 whitespace-pre-line text-lg leading-8 text-[#b9c0cd] sm:text-xl sm:leading-9">{data.world.worldSummary}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {data.world.worldParameters.factions?.slice(0, 4).map(faction => <span key={faction} className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1.5 text-[10px] text-[#747c8f]">{faction}</span>)}
        </div>
      </section>

      <section className="glass-card rounded-[26px] p-6 sm:p-9">
        <p className="eyebrow">Cast your protagonist</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">Who are you in this story?</h2>
        <p className="mt-2 text-xs leading-5 text-[#747c8f]">Give the narrator a few signals. Leave anything blank and the world will choose for you.</p>
        <p className="mt-2 rounded-lg border border-[#6ee7f2]/15 bg-[#6ee7f2]/[.04] px-3 py-2 text-[11px] leading-5 text-[#8baeb5]">
          Returning player? Enter your character&apos;s exact name to resume their profile, memories, inventory, relationships, and current story state.
        </p>
        <div className="mt-7 space-y-4">
          <label className="form-label">Name <span className="form-hint">— optional</span><input className="field" value={join.name} onChange={event => update('name', event.target.value)} placeholder="Let the world name me" /></label>
          <label className="form-label">History and secrets<textarea className="field min-h-28 resize-y" value={join.background} onChange={event => update('background', event.target.value)} placeholder="A former detective who left the city after a case went wrong…" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-label">Appearance<input className="field" value={join.appearance} onChange={event => update('appearance', event.target.value)} placeholder="Distinctive details" /></label>
            <label className="form-label">Temperament<input className="field" value={join.personality} onChange={event => update('personality', event.target.value)} placeholder="Patient, proud, reckless…" /></label>
          </div>
          <label className="form-label">The story you want<textarea className="field min-h-24 resize-y" value={join.storyIntent} onChange={event => update('storyIntent', event.target.value)} placeholder="Investigation, revenge, romance, political intrigue…" /></label>
          {data.world.visibility === 'private' && <label className="form-label">World password<input className="field" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter the secret phrase" /></label>}
          {error && <div className="error-banner" role="alert">{error}</div>}
          <button disabled={busy} onClick={onJoin} className="btn btn-primary mt-2 w-full">{busy ? 'Writing you into the story…' : 'Enter as this character'} <ArrowIcon /></button>
        </div>
      </section>
    </div>
  </main>;
}
