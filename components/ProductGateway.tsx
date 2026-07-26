'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Destination = 'kalamish' | 'yaggdrasil';

const KALAMISH_URL = 'http://127.0.0.1:5173/kalamish';

export function ProductGateway() {
  const router = useRouter();
  const [focus, setFocus] = useState<Destination | null>(null);
  const [entering, setEntering] = useState<Destination | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const enter = (destination: Destination) => {
    if (entering) return;
    setFocus(destination);
    setEntering(destination);
    timerRef.current = window.setTimeout(() => {
      if (destination === 'kalamish') {
        window.location.assign(KALAMISH_URL);
      } else {
        router.push('/yaggdrasil');
      }
    }, 360);
  };

  return (
    <main
      className="product-gateway"
      data-focus={focus || 'none'}
      data-entering={entering || 'none'}
      onMouseLeave={() => !entering && setFocus(null)}
    >
      <div className="product-gateway__grain" aria-hidden="true" />

      <div className="product-gateway__brand" aria-label="reactJK">
        <span className="product-gateway__mark"><span /></span>
        <span><strong>reactJK</strong><small>one canon · two ways in</small></span>
      </div>

      <button
        type="button"
        className="product-gateway__panel product-gateway__panel--author"
        onMouseEnter={() => !entering && setFocus('kalamish')}
        onFocus={() => !entering && setFocus('kalamish')}
        onClick={() => enter('kalamish')}
      >
        <div className="product-gateway__content">
          <p className="product-gateway__kicker">01 / AUTHOR</p>
          <h1>Write worlds<span>from scratch.</span></h1>
          <p className="product-gateway__copy">
            Kalamish is the AI authoring studio for drafting, revising, remembering,
            and keeping an entire novel coherent.
          </p>
          <span className="product-gateway__cta">Open Kalamish <b>→</b></span>
        </div>
      </button>

      <button
        type="button"
        className="product-gateway__panel product-gateway__panel--world"
        onMouseEnter={() => !entering && setFocus('yaggdrasil')}
        onFocus={() => !entering && setFocus('yaggdrasil')}
        onClick={() => enter('yaggdrasil')}
      >
        <div className="product-gateway__content">
          <p className="product-gateway__kicker">02 / PLAYER</p>
          <h1>Enter worlds<span>already alive.</span></h1>
          <p className="product-gateway__copy">
            Yaggdrasil is persistent multiplayer fiction where every action changes
            one shared timeline that remembers.
          </p>
          <span className="product-gateway__cta">Enter Yaggdrasil <b>→</b></span>
        </div>
      </button>

      <div className="product-gateway__seam" aria-hidden="true"><span>✦</span></div>
      <p className="product-gateway__hint">
        {entering ? 'Opening your storyspace…' : 'Choose how you want to shape the story'}
      </p>
    </main>
  );
}
