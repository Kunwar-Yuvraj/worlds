'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Brand } from '@/components/Brand';

const TRANSITION_DELAY = 180;

export default function RouteTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const navigationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLeaving(false);

    function followLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return;

      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (destination.pathname === window.location.pathname && destination.hash) return;

      event.preventDefault();
      setLeaving(true);
      navigationTimerRef.current = window.setTimeout(() => {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      }, TRANSITION_DELAY);
    }

    document.addEventListener('click', followLink, true);
    return () => {
      document.removeEventListener('click', followLink, true);
      if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
    };
  }, [pathname, router]);

  return <div className={`route-stage ${leaving ? 'is-leaving' : ''}`}>
    <div className="route-transition" aria-hidden="true">
      <div className="route-panel route-panel-left" />
      <div className="route-panel route-panel-right" />
      <div className="route-grid" />
      <div className="route-beam" />
      <div className="route-core">
        <Brand compact />
        <span>Entering worldspace</span>
      </div>
    </div>
    <div className="route-content">{children}</div>
  </div>;
}
