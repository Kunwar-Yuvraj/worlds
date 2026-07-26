'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const EXIT_DURATION_MS = 280;

export default function PresetCinematicTrailer({
  trailerId,
  title,
  onComplete,
}: {
  trailerId: string;
  title: string;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [needsStart, setNeedsStart] = useState(false);
  const [failed, setFailed] = useState(false);

  const finish = useCallback(() => {
    if (isLeaving) return;
    setIsLeaving(true);
    exitTimerRef.current = window.setTimeout(onComplete, EXIT_DURATION_MS);
  }, [isLeaving, onComplete]);

  const playWithSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      setNeedsStart(false);
    } catch {
      setNeedsStart(true);
    }
  }, []);

  useEffect(() => {
    void playWithSound();
  }, [playWithSound]);

  useEffect(() => () => {
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
  }, []);

  return (
    <section className={`cinematic-gate${isLeaving ? ' cinematic-gate--leaving' : ''}`} aria-label={`${title} trailer`}>
      <video
        ref={videoRef}
        className="cinematic-gate__video"
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={() => setFailed(true)}
      >
        <source src={`/api/assets/preset/${trailerId}`} type="video/mp4" />
      </video>
      <div className="cinematic-gate__vignette" />
      <div className="cinematic-gate__grain" />
      <div className="cinematic-gate__hud">
        <p className="cinematic-gate__eyebrow">A Chronicle Presents</p>
        <h1 className="cinematic-gate__title serif">{title}</h1>
        <div className="cinematic-gate__progress"><span /></div>
      </div>
      <div className="cinematic-gate__actions">
        {failed ? (
          <button className="cinematic-gate__start" type="button" onClick={finish}>Continue to game <span aria-hidden="true">›</span></button>
        ) : needsStart ? (
          <button className="cinematic-gate__start" type="button" onClick={() => void playWithSound()}>Begin with sound <span aria-hidden="true">›</span></button>
        ) : null}
        <button className="cinematic-gate__skip" type="button" onClick={finish}>Skip trailer</button>
      </div>
    </section>
  );
}
