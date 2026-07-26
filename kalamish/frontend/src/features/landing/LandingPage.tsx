import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Braces,
  GitBranch,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';

type Destination = 'author' | 'world';

const WORLD_APP_URL = 'http://127.0.0.1:3001';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<Destination | null>(null);
  const [entering, setEntering] = useState<Destination | null>(null);
  const transitionTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    },
    []
  );

  const enter = (destination: Destination) => {
    if (entering) return;
    setFocus(destination);
    setEntering(destination);
    transitionTimer.current = window.setTimeout(() => {
      if (destination === 'author') {
        navigate('/kalamish');
      } else {
        window.location.assign(WORLD_APP_URL);
      }
    }, 440);
  };

  return (
    <main
      className="gateway"
      data-focus={focus || 'none'}
      data-entering={entering || 'none'}
      onMouseLeave={() => !entering && setFocus(null)}
    >
      <div className="gateway-grain" />
      <div className="gateway-orbit gateway-orbit-one" />
      <div className="gateway-orbit gateway-orbit-two" />

      <div className="gateway-brand" aria-label="reactJK">
        <span className="gateway-brand-mark">
          <span />
          <i />
        </span>
        <span>
          <strong>reactJK</strong>
          <small>one canon · two ways in</small>
        </span>
      </div>

      <button
        type="button"
        className="gateway-panel gateway-panel-author"
        onMouseEnter={() => !entering && setFocus('author')}
        onFocus={() => !entering && setFocus('author')}
        onClick={() => enter('author')}
        aria-label="Open Kalamish, the AI novel authoring studio"
      >
        <div className="gateway-panel-glow" />
        <div className="gateway-panel-content gateway-content-author">
          <div className="gateway-kicker">
            <Braces className="h-3.5 w-3.5" />
            Creator superpower
          </div>
          <div>
            <p className="gateway-index">01 / AUTHOR</p>
            <h1>
              Write worlds
              <span>from scratch.</span>
            </h1>
            <p className="gateway-copy">
              Kalamish is the IDE for fiction—six AI agents that draft, revise, remember, and
              keep your entire canon coherent.
            </p>
            <div className="gateway-features">
              <span><GitBranch /> Multi-agent revision</span>
              <span><BookOpen /> Living story memory</span>
            </div>
            <span className="gateway-cta">
              Open Kalamish <ArrowRight />
            </span>
          </div>
          <div className="gateway-signal">
            <span className="gateway-code-line" />
            <span className="gateway-code-line short" />
            <span className="gateway-code-line cyan" />
            <div className="gateway-agent-row">
              {['D', 'C', 'W', 'T', 'R', 'E'].map((agent) => <i key={agent}>{agent}</i>)}
              <small>6 agents in sync</small>
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="gateway-panel gateway-panel-world"
        onMouseEnter={() => !entering && setFocus('world')}
        onFocus={() => !entering && setFocus('world')}
        onClick={() => enter('world')}
        aria-label="Open Worlds, the multiplayer interactive story experience"
      >
        <div className="gateway-panel-glow" />
        <div className="gateway-panel-content gateway-content-world">
          <div className="gateway-kicker">
            <Radio className="h-3.5 w-3.5" />
            Interactive entertainment
          </div>
          <div>
            <p className="gateway-index">02 / PLAYER</p>
            <h1>
              Enter worlds
              <span>already alive.</span>
            </h1>
            <p className="gateway-copy">
              Become a character in a persistent shared novel where every player acts, the
              timeline adapts, and one living canon remembers it all.
            </p>
            <div className="gateway-features">
              <span><Users /> Multiplayer canon</span>
              <span><Sparkles /> Infinite agency</span>
            </div>
            <span className="gateway-cta">
              Enter Worlds <ArrowRight />
            </span>
          </div>
          <div className="gateway-world-card">
            <div><span className="live-dot" /> world live</div>
            <p>Rain worries the glass roof. Someone has noticed the mud on your sleeve.</p>
            <small>What do you do?</small>
          </div>
        </div>
      </button>

      <div className="gateway-seam" aria-hidden="true">
        <span><Sparkles /></span>
      </div>

      <div className={`gateway-transition-copy ${entering ? 'is-visible' : ''}`}>
        <span className="live-dot" />
        {entering === 'author' ? 'Initializing the writing room' : 'Synchronizing with the living canon'}
      </div>

      <p className="gateway-hint">Choose how you want to shape the story</p>
    </main>
  );
};

export default LandingPage;
