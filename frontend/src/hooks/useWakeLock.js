import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Keeps the screen awake while `active` is true.
 * Re-acquires the wake lock when the document becomes visible again
 * (browsers automatically release wake locks on visibility change).
 */
export function useWakeLock(active) {
  const sentinelRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  const acquire = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setHeld(true);
      sentinel.addEventListener("release", () => {
        setHeld(false);
        sentinelRef.current = null;
      });
    } catch {
      // user gesture missing / not allowed
    }
  }, []);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try { await sentinelRef.current.release(); } catch { /* noop */ }
      sentinelRef.current = null;
      setHeld(false);
    }
  }, []);

  useEffect(() => {
    if (active) acquire();
    else release();
  }, [active, acquire, release]);

  // Re-acquire when tab becomes visible again
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible" && active && !sentinelRef.current) {
        acquire();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, acquire]);

  // Release on unmount
  useEffect(() => () => { release(); }, [release]);

  return { supported, held };
}
