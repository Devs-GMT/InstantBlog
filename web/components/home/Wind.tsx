"use client";
// Scroll "wind" for paper: writes --wind (0…1, how hard the air pushes) and --wind-dir (-1 | 1) on <html>.
// Sticky notes read them in CSS and fold forward from their taped top edge. The rAF loop only runs while
// the page is scrolling or settling, and never under prefers-reduced-motion.
import { useEffect } from "react";

export function Wind() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastY = window.scrollY;
    let lastT = performance.now();
    let target = 0;
    let wind = 0;
    let dir = 1;
    let raf = 0;

    const tick = () => {
      // gusts rise fast and settle slowly, like paper falling back onto the page
      const k = target > wind ? 0.32 : 0.09;
      wind += (target - wind) * k;
      target *= 0.9;
      root.style.setProperty("--wind", wind.toFixed(3));
      root.style.setProperty("--wind-dir", String(dir));
      if (wind > 0.002 || target > 0.002) raf = requestAnimationFrame(tick);
      else {
        wind = 0;
        root.style.setProperty("--wind", "0");
        raf = 0;
      }
    };

    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastY;
      const dt = Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      const speed = Math.abs(dy) / dt; // px per ms; a brisk flick is ~3
      target = Math.max(target, Math.min(1, speed / 2.4));
      if (dy !== 0) dir = dy > 0 ? 1 : -1;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--wind");
      root.style.removeProperty("--wind-dir");
    };
  }, []);

  return null;
}
