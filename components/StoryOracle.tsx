'use client';

import { useEffect, useRef, useState } from 'react';
import { authHeader } from '@/lib/firebase/client';

export type OracleMessage = { role: 'user' | 'assistant'; content: string };
type Status = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ending';

const timecode = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export function StoryOracle({
  worldId,
  disabled,
  onCommit,
}: {
  worldId: string;
  disabled?: boolean;
  onCommit: (action: string, transcript: OracleMessage[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState<OracleMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [commitSeconds, setCommitSeconds] = useState(0);
  const [error, setError] = useState('');
  const peer = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<OracleMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [transcript]);
  useEffect(() => {
    if (!open || ['idle', 'connecting', 'ending'].includes(status)) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [open, status]);
  useEffect(() => {
    if (status !== 'ending') return;
    const timer = window.setInterval(() => setCommitSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  function disconnect() {
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    channel.current?.close();
    channel.current = null;
    peer.current?.close();
    peer.current = null;
    if (remoteAudio.current) {
      remoteAudio.current.pause();
      remoteAudio.current.srcObject = null;
      remoteAudio.current.remove();
      remoteAudio.current = null;
    }
  }

  useEffect(() => () => disconnect(), []);

  function append(message: OracleMessage) {
    if (!message.content) return;
    setTranscript(current => {
      const last = current.at(-1);
      if (last?.role === message.role && last.content === message.content) return current;
      return [...current, message];
    });
  }

  function handleEvent(message: MessageEvent) {
    try {
      const event = JSON.parse(String(message.data));
      if (event.type === 'input_audio_buffer.speech_started') setStatus('listening');
      if (event.type === 'input_audio_buffer.speech_stopped' || event.type === 'response.created') setStatus('thinking');
      if (event.type === 'response.output_audio.delta') setStatus('speaking');
      if (event.type === 'response.done') setStatus('listening');
      if (event.type === 'conversation.item.input_audio_transcription.completed') {
        append({ role: 'user', content: typeof event.transcript === 'string' ? event.transcript.trim() : '' });
      }
      if (event.type === 'response.output_audio_transcript.done') {
        append({ role: 'assistant', content: typeof event.transcript === 'string' ? event.transcript.trim() : '' });
      }
      if (event.type === 'error') setError(event.error?.message || 'The Oracle connection was interrupted.');
    } catch {
      // WebRTC may emit control messages that are not JSON.
    }
  }

  async function start() {
    if (status !== 'idle' || disabled) return;
    setStatus('connecting');
    setError('');
    setSeconds(0);
    setTranscript([]);
    setMuted(false);
    try {
      const connection = new RTCPeerConnection();
      peer.current = connection;
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', '');
      remoteAudio.current = audio;
      connection.ontrack = event => {
        audio.srcObject = event.streams[0];
        void audio.play().catch(() => undefined);
      };
      connection.onconnectionstatechange = () => {
        if (['failed', 'disconnected'].includes(connection.connectionState)) {
          setError('The Oracle connection was lost.');
          setStatus('idle');
        }
      };

      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      stream.current = microphone;
      microphone.getAudioTracks().forEach(track => connection.addTrack(track, microphone));

      const events = connection.createDataChannel('oai-events');
      channel.current = events;
      events.addEventListener('message', handleEvent);
      events.addEventListener('open', () => {
        setStatus('listening');
        events.send(JSON.stringify({
          type: 'response.create',
          response: {
            output_modalities: ['audio'],
            instructions: 'Give a concise 1-2 sentence recap of the protagonist’s location, latest event, and immediate pressure using concrete canon—never generic scene-setting. Then invite them to speak. Accept their actions, continue the scene, and use genre-aware nudges only when helpful instead of interviewing them.',
          },
        }));
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      const response = await fetch(`/api/worlds/${worldId}/oracle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp', ...(await authHeader()) },
        body: offer.sdp,
      });
      const answer = await response.text();
      if (!response.ok) {
        let detail = 'The Story Oracle could not connect.';
        try { detail = JSON.parse(answer).error || detail; } catch {}
        throw new Error(detail);
      }
      await connection.setRemoteDescription({ type: 'answer', sdp: answer });
    } catch (caught) {
      disconnect();
      setStatus('idle');
      setError(caught instanceof Error ? caught.message : 'Microphone or Realtime connection failed.');
    }
  }

  function cancel() {
    disconnect();
    setOpen(false);
    setStatus('idle');
    setTranscript([]);
    setError('');
  }

  async function finish() {
    if (status === 'ending') return;
    setCommitSeconds(0);
    setStatus('ending');
    disconnect();
    const messages = transcriptRef.current;
    const userLines = messages.filter(message => message.role === 'user');
    if (!userLines.length) {
      setOpen(false);
      setStatus('idle');
      return;
    }
    const lastWords = userLines.at(-1)!.content;
    const action = lastWords.length > 8 ? lastWords : 'Carry out the final plan reached during the private Story Oracle conversation.';
    const committed = await onCommit(action, messages);
    if (committed) {
      setOpen(false);
      setStatus('idle');
      setTranscript([]);
      setError('');
    } else {
      setStatus('idle');
      setError('The narrator could not continue the story. Your transcript is still here.');
    }
  }

  function toggleMute() {
    const next = !muted;
    stream.current?.getAudioTracks().forEach(track => { track.enabled = !next; });
    setMuted(next);
  }

  const active = !['idle', 'connecting', 'ending'].includes(status);
  const commitLabel = commitSeconds < 7 ? 'Securing the conversation…'
    : commitSeconds < 22 ? 'The narrator is resolving your choice…'
      : commitSeconds < 42 ? 'Updating the world and everyone inside it…'
        : 'The new scene is almost ready…';
  const label = status === 'connecting' ? 'Opening the veil…'
    : status === 'thinking' ? 'Oracle is listening within…'
      : status === 'speaking' ? 'Oracle is speaking'
        : status === 'ending' ? commitLabel
          : muted ? 'Microphone muted' : 'Listening';

  return <>
    <button
      type="button"
      disabled={disabled}
      onClick={() => { setOpen(true); setError(''); }}
      className="group relative mt-3 flex w-full shrink-0 items-center gap-3 overflow-hidden rounded-[20px] border border-[#8b7cff]/20 bg-[#0b101a] p-3 text-left shadow-[0_16px_50px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-[#8b7cff]/45 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="pointer-events-none absolute -left-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-[#8b7cff]/30 blur-2xl transition group-hover:bg-[#6ee7f2]/30" />
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#a99dff_18%,#6757dc_45%,rgba(42,31,105,.25)_72%)] shadow-[0_0_22px_rgba(139,124,255,.65)]">
        <span className="absolute inset-0 animate-ping rounded-full border border-[#b9b0ff]/30 [animation-duration:2.8s]" />
        <MicIcon />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="eyebrow block text-[#a99dff]">Story Oracle</span>
        <span className="mt-1 block truncate text-[10px] text-[#687084]">Talk through this moment</span>
      </span>
      <span className="relative text-[#a99dff] transition group-hover:translate-x-1">↗</span>
    </button>

    {open && <div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-[#02030a]/90 p-3 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="oracle-title">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6757dc]/10 blur-[100px]" />
      <section className="relative flex h-[min(760px,calc(100dvh-24px))] w-full max-w-[560px] flex-col overflow-hidden rounded-[32px] border border-white/[.09] bg-[#070a12] shadow-[0_45px_160px_rgba(0,0,0,.82),0_0_100px_rgba(105,84,230,.16)]">
        <header className="flex shrink-0 items-center justify-between px-5 py-4">
          <div><p id="oracle-title" className="eyebrow text-[#8b7cff]">Private communion</p><p className="mt-1 text-[10px] text-[#5f6678]">Nothing becomes canon until you end the session</p></div>
          <button onClick={cancel} disabled={status === 'ending'} className="grid h-9 w-9 place-items-center rounded-full border border-white/[.08] text-lg text-[#747c8f] transition hover:border-white/20 hover:text-white disabled:cursor-wait disabled:opacity-25" aria-label="Close without continuing">×</button>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col items-center px-5">
          <div className="relative mt-2 grid h-44 w-44 shrink-0 place-items-center sm:h-52 sm:w-52">
            <span className={`absolute inset-3 rounded-full bg-[#7764ed]/20 blur-2xl transition duration-700 ${status === 'speaking' ? 'scale-125 opacity-100' : 'scale-90 opacity-60'}`} />
            <span className={`absolute inset-7 rounded-full border border-[#8b7cff]/25 ${active ? 'animate-[spin_12s_linear_infinite]' : ''}`} />
            <span className={`absolute inset-12 rounded-full border border-dashed border-[#6ee7f2]/20 ${active ? 'animate-[spin_8s_linear_infinite_reverse]' : ''}`} />
            <span className={`relative h-24 w-24 rounded-full bg-[radial-gradient(circle_at_34%_27%,#fff_0%,#b9b0ff_12%,#7665ec_34%,#29214f_62%,#080b14_76%)] shadow-[0_0_55px_rgba(139,124,255,.65)] transition duration-500 ${status === 'speaking' ? 'scale-110' : status === 'thinking' ? 'scale-95' : ''}`}>
              {active && <span className="absolute inset-0 animate-ping rounded-full border border-[#b9b0ff]/25 [animation-duration:2.4s]" />}
            </span>
          </div>
          <p className="text-sm font-medium text-[#d9dce5]">{label}</p>
          <p className="mt-1 font-mono text-[10px] tracking-[.18em] text-[#596174]">{status === 'ending' ? `${commitSeconds}s · one canonical turn` : timecode(seconds)}</p>

          <div className="module-scroll relative mt-4 min-h-0 w-full flex-1 overflow-y-auto rounded-2xl border border-white/[.06] bg-white/[.018] px-4 py-3">
            {status === 'ending' && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080b13]/95 px-8 text-center">
              <span className="relative block h-12 w-12">
                <span className="absolute inset-0 animate-ping rounded-full border border-[#8b7cff]/35 [animation-duration:2s]" />
                <span className="absolute inset-2 animate-spin rounded-full border border-white/10 border-t-[#8b7cff]" />
              </span>
              <p className="mt-5 serif text-lg text-[#dfe3ec]">Your choice is becoming canon.</p>
              <p className="mt-2 max-w-xs text-[10px] leading-5 text-[#737b8d]">The full conversation is being reconciled with world memory, character state, shared events, and unresolved threads. You can stay here—the transcript is safe.</p>
            </div>}
            {!transcript.length && status === 'idle' && <div className="flex h-full min-h-24 items-center justify-center text-center"><div><p className="serif text-lg text-[#dfe3ec]">Step inside the moment.</p><p className="mt-2 max-w-sm text-[11px] leading-5 text-[#6d7486]">The Oracle knows your scene, protagonist, world memory, and visible chronicle. Speak naturally; interrupt whenever you want.</p></div></div>}
            {!transcript.length && status === 'connecting' && <p className="py-8 text-center text-xs text-[#777f92]">Connecting to the world…</p>}
            <div className="space-y-3">
              {transcript.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'pl-10 text-right' : 'pr-10'}>
                <p className={`mb-1 text-[8px] font-bold uppercase tracking-[.17em] ${message.role === 'user' ? 'text-[#667082]' : 'text-[#9788ff]'}`}>{message.role === 'user' ? 'You' : 'Oracle'}</p>
                <p className="text-[11px] leading-5 text-[#aeb5c3]">{message.content}</p>
              </div>)}
              <div ref={endRef} />
            </div>
          </div>
          {error && <p className="mt-3 text-center text-[10px] leading-4 text-[#ff9cad]">{error}</p>}
        </div>

        <footer className="shrink-0 p-5">
          {status === 'idle' ? <button onClick={start} disabled={disabled} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#7867ed] to-[#5a9de8] px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(105,84,230,.28)] transition hover:brightness-110 disabled:opacity-40">
            <MicIcon />{transcript.length ? 'Reconnect to the Oracle' : 'Begin voice session'}
          </button> : <div className="flex gap-3">
            <button onClick={toggleMute} disabled={!active} className={`grid h-[52px] w-14 shrink-0 place-items-center rounded-2xl border transition ${muted ? 'border-[#ff8298]/30 bg-[#ff8298]/10 text-[#ff9cad]' : 'border-white/[.09] bg-white/[.035] text-[#9da4b5] hover:text-white'} disabled:opacity-40`} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}><MicIcon crossed={muted} /></button>
            <button onClick={finish} disabled={status === 'connecting' || status === 'ending'} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#6ee7f2]/25 bg-[#6ee7f2]/[.08] px-5 py-3 text-xs font-semibold text-[#8be4ed] transition hover:border-[#6ee7f2]/45 hover:bg-[#6ee7f2]/[.12] disabled:opacity-40">
              {status === 'ending' ? 'Continuing the story…' : 'End & continue story'} <span>→</span>
            </button>
          </div>}
        </footer>
      </section>
    </div>}
  </>;
}

function MicIcon({ crossed = false }: { crossed?: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />{crossed && <path d="m4 4 16 16" />}</svg>;
}
