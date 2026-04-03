'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from './useMediaQuery';
import { SCROLL_CONFIG, BREAKPOINTS } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

function supportsWebMAlpha(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

export function useVideoScrub() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let killed = false;
    let scrollTriggerInstance: ScrollTrigger | null = null;
    let tlInstance: gsap.core.Timeline | null = null;

    // Pick the best source — WebM (alpha) if supported, else MP4 (ivory bg)
    const useWebM = supportsWebMAlpha();
    video.src = useWebM
      ? '/videos/sequence-01.webm'
      : '/videos/sequence-01.mp4';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.load();

    // Mobile Safari needs a play→pause cycle to allow currentTime seeking
    const prime = async () => {
      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch {
        // Autoplay blocked — scrubbing still works in most cases
      }
    };

    const setup = () => {
      if (killed) return;
      if (!video.duration || video.duration === Infinity) return;

      const scrub = isMobile
        ? SCROLL_CONFIG.mobile.videoScrub
        : SCROLL_CONFIG.desktop.videoScrub;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub,
        },
      });

      tl.to(video, {
        currentTime: video.duration,
        ease: 'none',
      });

      scrollTriggerInstance = tl.scrollTrigger!;
      tlInstance = tl;
    };

    const onReady = () => {
      prime().then(setup);
    };

    if (video.readyState >= 2) {
      onReady();
    } else {
      video.addEventListener('loadeddata', onReady, { once: true });
    }

    return () => {
      killed = true;
      video.removeEventListener('loadeddata', onReady);
      if (tlInstance) tlInstance.kill();
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
    };
  }, [isMobile]);

  return { videoRef, containerRef };
}
