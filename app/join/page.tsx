'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader } from '@/lib/firebase/client';
import { PRESETS } from '@/lib/presets';
type Listed = { id: string; name: string; genre: string; rulesText: string; premise: string; turnCount: number };
function WorldThumb({ id, name }: { id: string; name: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  useEffect(() => {
    let cancelled = false; let attempts = 0;
    async function poll() {
      while (!cancelled && attempts < 4) {
        try {
          const res = await fetch(`/api/worlds/${id}/image`);
          if (cancelled) return;
          if (res.status === 200) { const blob = await res.blob(); if (cancelled) return; setImgUrl(URL.createObjectURL(blob)); setStatus('loaded'); return; }
          if (res.status === 202) { attempts++; await new Promise(r => setTimeout(r, 10000)); continue; }
          setStatus('failed'); return;
        } catch { attempts++; if (attempts >= 4) { setStatus('failed'); return; } await new Promise(r => setTimeout(r, 10000)); }
      }
      if (!cancelled) setStatus('failed');
    }
    poll();
    return () => { cancelled = true; };
  }, [id]);
  useEffect(() => { return () => { if (imgUrl) URL.revokeObjectURL(imgUrl); }; }, [imgUrl]);
  return <div className="world-thumb">{status === 'loading' && <div className="shimmer" style={{ width: '100%', height: '100%' }} />}{imgUrl ? <img src={imgUrl} alt={`Cover for ${name}`} style={{ opacity: 1, transition: 'opacity 0.5s ease' }} /> : null}</div>;
}

export default function JoinPage() { const router = useRouter(); const [worlds, setWorlds] = useState<Listed[]>([]); const [busy, setBusy] = useState(''); const [privateId, setPrivateId] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); useEffect(() => { fetch('/api/worlds').then(r => r.json()).then(x => setWorlds(x.worlds ?? [])).catch(() => setError('Could not load public worlds.')); }, []); async function preset(name: string) { setBusy(name); try { const r = await fetch('/api/worlds/preset', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ presetName: name }) }); const x = await r.json(); if (!r.ok) throw new Error(x.error); router.push(`/world/${x.worldId}`); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to open preset.'); setBusy(''); } } return <main className="shell min-h-screen px-5 py-10"><section className="mx-auto max-w-6xl"><a href="/" className="text-sm text-gold">← Worlds</a><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="serif text-5xl">Choose your door.</h1><p className="mt-2 text-stone-400">Every world is a living record of the choices inside it.</p></div><a href="/create" className="btn btn-primary">Create a world</a></div><h2 className="serif mt-12 text-2xl">Begin with a premise</h2><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{PRESETS.map(p => <article className="card flex min-h-64 flex-col p-5" key={p.name}><p className="text-xs uppercase tracking-widest text-gold">{p.genre}</p><h3 className="serif mt-3 text-2xl">{p.name}</h3><p className="mt-3 flex-1 text-sm leading-relaxed text-stone-400">{p.rulesText}</p><button disabled={!!busy} onClick={() => preset(p.name)} className="btn btn-quiet mt-5">{busy === p.name ? 'Opening…' : 'Enter this world'}</button></article>)}</div><h2 className="serif mt-12 text-2xl">Community worlds</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{worlds.length ? worlds.map(w => <article className="card overflow-hidden p-0" key={w.id}><WorldThumb id={w.id} name={w.name} /><div className="p-5"><p className="text-xs uppercase tracking-widest text-gold">{w.genre} · {w.turnCount} turns</p><h3 className="serif mt-2 text-2xl">{w.name}</h3><p className="mt-2 text-sm text-stone-400">{w.premise || w.rulesText}</p><button onClick={() => router.push(`/world/${w.id}`)} className="btn btn-quiet mt-4">View world</button></div></article>) : <p className="text-stone-400">No public worlds yet. Be the first to create one.</p>}</div><section className="card mt-12 max-w-xl p-6"><h2 className="serif text-2xl">Private invitation</h2><p className="mt-1 text-sm text-stone-400">Paste a world ID and its password to enter.</p><div className="mt-4 grid gap-3"><input className="field" value={privateId} onChange={e => setPrivateId(e.target.value)} placeholder="World ID" /><input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /><button className="btn btn-primary" onClick={() => privateId && router.push(`/world/${privateId}?password=${encodeURIComponent(password)}`)}>Continue</button></div></section>{error && <p className="mt-5 text-red-300">{error}</p>}</section></main>; }

