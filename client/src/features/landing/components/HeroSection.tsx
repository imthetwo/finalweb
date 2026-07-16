"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";

import { useHeroSection } from "../hooks/useHeroSection";

export default function HeroSection({
  videoUrl = "/hero.mp4",
  posterUrl = "/hero-poster.jpg",
}: {
  videoUrl?: string;
  posterUrl?: string;
}) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { videoRef, playing, toggleVideo } = useHeroSection();

  return (
    <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden bg-base">
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={videoUrl}
        poster={posterUrl}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay + grid (above video so text stays readable) */}
      <div className="absolute inset-0 z-1">
        <div className="absolute inset-0 bg-base/55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,transparent_25%,transparent_70%,#050505_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:60px_60px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
        {/* Main headline */}
        <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.03em] text-fg sm:text-7xl md:text-8xl xl:text-[9rem]">
          Build Your
          <br />
          <span
            className="text-brand"
            style={{ textShadow: "var(--text-shadow-brand)" }}
          >
            World
          </span>
        </h1>

        {/* CTAs */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-brand px-9 py-4 text-sm font-black uppercase tracking-[0.25em] text-brand-fg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-btn"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#050505] to-transparent z-10" />

      {/* Play/Pause video control — bottom right */}
      <button
        type="button"
        onClick={toggleVideo}
        aria-label={
          playing ? "Pause background video" : "Play background video"
        }
        className="absolute bottom-6 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-base/40 text-fg backdrop-blur-sm transition-all duration-200 hover:border-brand/50 hover:bg-base/60 hover:text-brand"
      >
        {playing ? (
          <Pause size={16} />
        ) : (
          <Play size={16} className="translate-x-0.5" />
        )}
      </button>
    </section>
  );
}
