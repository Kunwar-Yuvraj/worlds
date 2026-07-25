'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CINEMATIC_WORLD_ID = 'bVtRf0apwnbFtc6ZoPZZ';
const EXIT_DURATION_MS = 650;

export default function WorldCinematicIntro({
  worldId,
  children,
}: {
  worldId: string;
  children: React.ReactNode;
}) {
  const shouldPlay = worldId === CINEMATIC_WORLD_ID;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showIntro, setShowIntro] = useState(shouldPlay);
  const [isLeaving, setIsLeaving] = useState(false);
  const [needsStart, setNeedsStart] = useState(false);

  const finish = useCallback(() => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => setShowIntro(false), EXIT_DURATION_MS);
  }, [isLeaving]);

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
    if (!showIntro) return;
    void playWithSound();
  }, [playWithSound, showIntro]);

  if (!showIntro) return <>{children}</>;

  return (
    <section className={`cinematic-gate${isLeaving ? ' cinematic-gate--leaving' : ''}`} aria-label="Echoes of Valor trailer">
      <video
        ref={videoRef}
        className="cinematic-gate__video"
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={() => setNeedsStart(true)}
      >
        <source src="/api/assets/echoes-of-valor" type="video/mp4" />
      </video>
      <div className="cinematic-gate__vignette" />
      <div className="cinematic-gate__grain" />
      <div className="cinematic-gate__hud">
        <p className="cinematic-gate__eyebrow">A Chronicle Presents</p>
        <h1 className="cinematic-gate__title serif">Echoes of Valor</h1>
        <div className="cinematic-gate__progress"><span /></div>
      </div>
      <div className="cinematic-gate__actions">
        {needsStart ? (
          <button className="cinematic-gate__start" type="button" onClick={() => void playWithSound()}>
            Begin with sound <span aria-hidden="true">›</span>
          </button>
        ) : null}
        <button className="cinematic-gate__skip" type="button" onClick={finish}>Skip trailer</button>
      </div>
    </section>
  );
}
