'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authHeader } from '@/lib/firebase/client';

type VoiceProfile = { voice: string; instructions: string };
type Profile = { name: string; role: string; appearance: string; personality: string; background: string; strengths: string[]; constraints: string[]; goals: string[]; privateArc: string; voiceProfile?: VoiceProfile };
type PlayerState = { currentLocationId: string; currentObjective: string; currentActivity: string; privateSummary: string; knownFacts: { fact: string; source: string; certainty: string }[]; condition: string; cliffhanger: string };
type Event = { id: string; type: string; content: string; scope: 'private' | 'scene' | 'world'; payload?: { options?: string[] } };
type Data = {
  world: { id: string; name: string; genre: string; visibility: string; worldSummary: string; storyState: { currentTime: string; publicSummary: string; currentSituation: string }; worldParameters: { tone: string }; turnCount: number };
  player: { profile: Profile; state: PlayerState } | null;
  locations: { id: string; name: string; publicState: string }[];
  npcs: { id: string; name: string; currentLocationId: string }[];
  scene: { sharedSummary: string } | null;
  events: Event[];
};

export default function WorldRoom({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [action, setAction] = useState('');
  const [password, setPassword] = useState('');
  const [join, setJoin] = useState({ name: '', background: '', appearance: '', personality: '', storyIntent: '' });

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/worlds/${id}`, { headers: await authHeader(), cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load world.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('focus', refresh); audioRef.current?.pause(); };
  }, [load]);

  async function joinWorld() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/worlds/${id}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ password: password || new URLSearchParams(window.location.search).get('password'), displayName: join.name, background: join.background, appearance: join.appearance, personality: join.personality, storyIntent: join.storyIntent }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create character.'); }
    finally { setBusy(false); }
  }

  async function act(value = action) {
    if (!value.trim()) return; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/worlds/${id}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ action: value }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error); setAction(''); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'That action could not be resolved.'); }
    finally { setBusy(false); }
  }

  async function speak(key: string, text: string, voice: VoiceProfile) {
    try {
      audioRef.current?.pause(); setSpeakingId(key);
      const response = await fetch('/api/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ text, voice: voice.voice, instructions: voice.instructions }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error); }
      const url = URL.createObjectURL(await response.blob()); const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setSpeakingId(null); };
      await audio.play();
    } catch (caught) { setSpeakingId(null); setError(caught instanceof Error ? caught.message : 'Voice narration could not play.'); }
  }

  if (loading) return <main className="shell flex min-h-screen items-center justify-center text-stone-400">Opening the world...</main>;
  if (!data) return <main className="shell flex min-h-screen items-center justify-center text-red-300">{error || 'World not found.'}</main>;
  if (!data.player) return <main className="shell flex min-h-screen items-center justify-center px-5"><section className="card max-w-2xl p-8"><a href="/join" className="text-sm text-gold">← All worlds</a><p className="mt-6 text-xs uppercase tracking-widest text-gold">{data.world.genre}</p><h1 className="serif mt-2 text-4xl">{data.world.name}</h1><p className="serif mt-5 whitespace-pre-line leading-relaxed text-stone-300">{data.world.worldSummary}</p><div className="mt-7 space-y-3"><input className="field" value={join.name} onChange={event => setJoin(current => ({ ...current, name: event.target.value }))} placeholder="Character name (optional)" /><textarea className="field min-h-28" value={join.background} onChange={event => setJoin(current => ({ ...current, background: event.target.value }))} placeholder="Background, role, secret, and history" /><div className="grid gap-3 sm:grid-cols-2"><input className="field" value={join.appearance} onChange={event => setJoin(current => ({ ...current, appearance: event.target.value }))} placeholder="Appearance" /><input className="field" value={join.personality} onChange={event => setJoin(current => ({ ...current, personality: event.target.value }))} placeholder="Personality" /></div><textarea className="field min-h-20" value={join.storyIntent} onChange={event => setJoin(current => ({ ...current, storyIntent: event.target.value }))} placeholder="What story do you want: revenge, intrigue, detective work, romance...?" />{data.world.visibility === 'private' && <input className="field" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="World password" />}{error && <p className="text-red-300">{error}</p>}<button disabled={busy} onClick={joinWorld} className="btn btn-primary w-full">{busy ? 'Writing your protagonist...' : 'Begin my story'}</button></div></section></main>;

  const profile = data.player.profile; const state = data.player.state;
  const latest = [...data.events].reverse().find(event => event.type === 'narration');
  const options = latest?.payload?.options ?? [];
  const location = data.locations.find(item => item.id === state.currentLocationId);
  const localNpcs = data.npcs.filter(npc => npc.currentLocationId === state.currentLocationId);
  const narratorVoice: VoiceProfile = { voice: 'marin', instructions: `A cinematic interactive-fiction narrator. ${data.world.worldParameters.tone}` };

  return <main className="shell min-h-screen px-4 py-5 sm:px-7"><header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5"><a href="/join" className="text-sm text-gold">← Leave to worlds</a><div className="text-right"><p className="text-xs uppercase tracking-widest text-gold">{data.world.genre} · {data.world.storyState.currentTime}</p><h1 className="serif text-2xl">{data.world.name}</h1></div></header><div className="mx-auto grid max-w-7xl gap-5 py-6 lg:grid-cols-[310px_1fr]"><aside className="card h-fit p-5"><p className="text-xs uppercase tracking-widest text-gold">Your protagonist</p><h2 className="serif mt-3 text-3xl">{profile.name}</h2><p className="mt-1 text-stone-400">{profile.role}</p><p className="mt-3 text-sm text-stone-300">{profile.appearance}</p><p className="mt-3 text-sm leading-relaxed text-stone-300">{profile.background}</p><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-widest text-stone-500">Current objective</p><p className="mt-2 text-sm text-mist">{state.currentObjective}</p><p className="mt-2 text-xs text-stone-400">{state.currentActivity} · {state.condition}</p></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-widest text-stone-500">Private story memory</p><p className="mt-2 text-sm leading-relaxed text-stone-300">{state.privateSummary}</p>{state.cliffhanger && <p className="mt-3 text-sm italic text-gold">Hook: {state.cliffhanger}</p>}</div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-widest text-stone-500">Private leads</p><ul className="mt-2 space-y-2 text-sm text-stone-300">{state.knownFacts.length ? state.knownFacts.map(fact => <li key={`${fact.fact}-${fact.source}`}>— {fact.fact} <span className="text-stone-500">({fact.certainty})</span></li>) : <li>— No verified leads yet.</li>}</ul></div></aside><div className="space-y-5"><section className="card p-5 sm:p-7"><p className="text-xs uppercase tracking-widest text-gold">Shared world canon</p><p className="serif mt-3 text-lg leading-relaxed text-stone-100">{data.world.storyState.publicSummary}</p><p className="mt-3 text-sm text-stone-400">{data.world.storyState.currentSituation}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-black/15 p-3"><p className="text-xs uppercase tracking-widest text-gold">Your location</p><p className="mt-1 text-sm text-mist">{location?.name || state.currentLocationId}</p><p className="mt-1 text-xs text-stone-400">{location?.publicState}</p></div><div className="rounded-lg bg-black/15 p-3"><p className="text-xs uppercase tracking-widest text-gold">Present NPCs</p><p className="mt-1 text-sm text-mist">{localNpcs.map(npc => npc.name).join(', ') || 'No one obvious.'}</p></div></div></section>{data.scene && <section className="card border-gold/40 p-5"><p className="text-xs uppercase tracking-widest text-gold">Shared scene</p><p className="serif mt-2 leading-relaxed text-mist">{data.scene.sharedSummary || 'Other protagonists are nearby. Visible actions here may become shared canon.'}</p></section>}<section className="card max-h-[40vh] overflow-y-auto p-5 sm:p-7"><p className="text-xs uppercase tracking-widest text-gold">Your story chronicle</p><div className="mt-5 space-y-5">{data.events.map(event => { const voice = event.type === 'narration' ? (profile.voiceProfile ?? narratorVoice) : narratorVoice; return <article key={event.id} className={event.type === 'narration' ? 'border-l-2 border-gold pl-4' : 'pl-4'}><div className="mb-1 flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-widest text-stone-500">{event.scope === 'world' ? 'World canon' : event.scope === 'scene' ? 'Shared scene' : event.type === 'narration' ? 'Your narrator' : 'Your action'}</p><button type="button" onClick={() => speak(event.id, event.content, voice)} disabled={speakingId === event.id} title="Play narration" aria-label="Play narration" className="rounded-full border border-gold/40 px-2 py-1 text-xs text-gold hover:bg-gold/10 disabled:opacity-50">{speakingId === event.id ? '…' : '🔊'}</button></div><p className={event.type === 'narration' ? 'serif text-lg leading-relaxed text-mist' : 'text-sm leading-relaxed text-stone-300'}>{event.content}</p></article>; })}</div></section><section className="card p-5 sm:p-7"><p className="text-xs uppercase tracking-widest text-gold">What do you do?</p>{options.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{options.map(option => <button disabled={busy} onClick={() => act(option)} key={option} className="btn btn-quiet text-left text-sm">{option}</button>)}</div>}<div className="mt-5 flex flex-col gap-3 sm:flex-row"><input className="field flex-1" value={action} onChange={event => setAction(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') act(); }} placeholder="Choose a deliberate action..." /><button disabled={busy} onClick={() => act()} className="btn btn-primary">{busy ? 'Resolving state...' : 'Act'}</button></div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}</section></div></div></main>;
}
