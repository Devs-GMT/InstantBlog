"use client";
// Scroll reveals for [data-reveal] elements. Only elements that start BELOW the viewport are hidden (no flash,
// nothing hidden if JS fails); each one reveals once, then its attribute is removed so hover transitions are
// unaffected. Variants are in CSS: default (rise), "left", "right", "print", "fan", "line".
import { useEffect } from "react";

export function Reveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const below = els.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
    below.forEach((el) => el.classList.add("reveal-pending"));

    // "print" elements are clipped to zero height while pending, so the observer watches their parent instead.
    const watched = new Map<Element, HTMLElement[]>();
    for (const el of below) {
      const target = el.dataset.reveal === "print" && el.parentElement ? el.parentElement : el;
      watched.set(target, [...(watched.get(target) ?? []), el]);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          for (const el of watched.get(e.target) ?? []) {
            el.classList.remove("reveal-pending");
            // after the entrance, hand the element back to its normal transitions
            window.setTimeout(() => el.removeAttribute("data-reveal"), 1600);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    watched.forEach((_, target) => io.observe(target));
    return () => io.disconnect();
  }, []);

  return null;
}
