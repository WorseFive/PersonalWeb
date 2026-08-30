"use client";

import { useEffect, useRef } from "react";

type Orb = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  phase: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0.5, y: 0.35 };
    let frame = 0;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let lastTime = performance.now();
    let reducedMotion = prefersReducedMotion();

    const orbs: Orb[] = [
      { x: 0.18, y: 0.28, vx: 0.00008, vy: 0.00011, radius: 0.33, hue: 196, phase: 0.2 },
      { x: 0.76, y: 0.27, vx: -0.0001, vy: 0.00007, radius: 0.29, hue: 205, phase: 2.1 },
      { x: 0.55, y: 0.73, vx: 0.00007, vy: -0.00009, radius: 0.38, hue: 188, phase: 4.5 }
    ];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(255,255,255,.78)");
      gradient.addColorStop(0.52, "rgba(224,247,255,.22)");
      gradient.addColorStop(1, "rgba(196,234,249,.58)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "screen";
      for (const orb of orbs) {
        if (!reducedMotion) {
          orb.x = (orb.x + orb.vx * delta + 1) % 1;
          orb.y = (orb.y + orb.vy * delta + 1) % 1;
        }
        const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.00035 + orb.phase) * 0.035;
        const x = (orb.x + (pointer.x - 0.5) * 0.035) * width;
        const y = (orb.y + (pointer.y - 0.42) * 0.035) * height;
        const radius = Math.max(width, height) * orb.radius * pulse;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `hsla(${orb.hue}, 90%, 72%, .34)`);
        glow.addColorStop(0.42, `hsla(${orb.hue}, 82%, 76%, .16)`);
        glow.addColorStop(1, `hsla(${orb.hue}, 82%, 80%, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalCompositeOperation = "source-over";
      frame = reducedMotion ? 0 : requestAnimationFrame(draw);
    };

    const start = () => {
      if (frame || reducedMotion || document.visibilityState === "hidden") return;
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const handleVisibility = () => {
      stop();
      if (document.visibilityState === "visible") start();
    };
    const handleMotion = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      stop();
      if (!reducedMotion) start();
      else draw(performance.now());
    };
    const handlePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      pointer.y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    };

    resize();
    draw(performance.now());
    start();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotion);
    window.addEventListener("pointermove", handlePointer, { passive: true });

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotion);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="fluid-background" aria-hidden="true" />;
}
