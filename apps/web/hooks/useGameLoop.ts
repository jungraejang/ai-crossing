import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { simulationTick } from '@/lib/simulation';

export function useGameLoop() {
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const store = useGameStore.getState();

      if (!store.isInitialized || store.world.isPaused) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      simulationTick(dt);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
}
