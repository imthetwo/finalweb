import { useRef, useState } from "react";

// Data/logic for the hero background video — play/pause state and the
// imperative toggle against the <video> element. The component only renders.
export function useHeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  function toggleVideo() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return { videoRef, playing, toggleVideo };
}
