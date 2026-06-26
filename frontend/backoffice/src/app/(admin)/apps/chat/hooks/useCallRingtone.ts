import { useRef, useEffect, useCallback } from 'react';
import { CallState } from './useWebRTC';

interface UseCallRingtoneProps {
  callState: CallState;
}

export const useCallRingtone = ({ callState }: UseCallRingtoneProps) => {
  // ── UNE seule référence AudioContext ─────────────────────────
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const oscillatorRef  = useRef<OscillatorNode | null>(null);
  const gainRef        = useRef<GainNode | null>(null);
  const patternTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef   = useRef(false);
  const isFirstRender  = useRef(true);   // ← empêche le son au chargement

  // ── Arrêt propre de TOUT son ──────────────────────────────────
  const stopAll = useCallback(() => {
    // Arrêter le pattern timer
    if (patternTimerRef.current) {
      clearTimeout(patternTimerRef.current);
      patternTimerRef.current = null;
    }

    // Arrêter l'oscillateur en cours
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }

    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }

    // Fermer l'AudioContext (optionnel, mais propre)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    isPlayingRef.current = false;
  }, []);

  // ── Créer un AudioContext frais ───────────────────────────────
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // ── Jouer UN bip de sonnerie (fréquence + durée) ──────────────
  const playBeep = useCallback((
    frequency: number,
    durationMs: number,
    volume = 0.4
  ) => {
    const ctx  = getAudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type      = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope : fade in rapide → sustain → fade out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume, ctx.currentTime + durationMs / 1000 - 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);

    oscillatorRef.current = osc;
    gainRef.current       = gain;
  }, [getAudioContext]);

  // ── Sonnerie ENTRANTE : pattern téléphone classique ───────────
  // Pattern : RING(0.4s) + RING(0.4s) pause(0.2s) → silence(2s) → repeat
  const playIncomingPattern = useCallback(() => {
    if (!isPlayingRef.current) return;

    const ring = () => {
      if (!isPlayingRef.current) return;

      // Première sonnerie
      playBeep(440, 400, 0.45);                          // La4 — 400ms

      patternTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return;
        // Deuxième sonnerie
        playBeep(440, 400, 0.45);                        // La4 — 400ms

        // Silence de 2 secondes puis on recommence
        patternTimerRef.current = setTimeout(() => {
          ring(); // boucle
        }, 2200);
      }, 600); // 400ms ring + 200ms gap
    };

    ring();
  }, [playBeep]);

  // ── Sonnerie SORTANTE : bip long régulier (comme "ça sonne") ──
  // Pattern : BEEP(1s) → silence(2s) → repeat
  const playOutgoingPattern = useCallback(() => {
    if (!isPlayingRef.current) return;

    const beep = () => {
      if (!isPlayingRef.current) return;

      // Bip doux à 480 Hz pendant 1 seconde
      playBeep(480, 1000, 0.3);

      patternTimerRef.current = setTimeout(() => {
        beep(); // boucle après 3s total (1s son + 2s silence)
      }, 3000);
    };

    beep();
  }, [playBeep]);

  // ── Son court de fin d'appel (2 bips descendants) ────────────
  const playEndSound = useCallback(() => {
    const ctx = getAudioContext();

    // Bip 1 : 480 Hz
    const osc1  = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(480, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Bip 2 : 380 Hz (descendant) après 200ms
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(380, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.35);
  }, [getAudioContext]);

  // ── Réagir aux changements de callState ───────────────────────
  useEffect(() => {
    // ✅ Ne rien faire au premier render (évite le son au chargement)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Arrêter tout son précédent avant d'en jouer un nouveau
    stopAll();

    switch (callState) {
      case 'ringing':
        // Appel ENTRANT → sonnerie téléphone classique en boucle
        isPlayingRef.current = true;
        playIncomingPattern();
        break;

      case 'calling':
        // Appel SORTANT → bip "ça sonne" en boucle
        isPlayingRef.current = true;
        playOutgoingPattern();
        break;

      case 'idle':
        // Appel terminé → son de fin court (seulement si on venait d'un appel)
        playEndSound();
        break;

      case 'active':
        // Appel accepté → silence total (sonnerie déjà arrêtée par stopAll)
        break;
    }

    // Nettoyage si composant démonté pendant un appel
    return () => {
      stopAll();
    };
  }, [callState]); // ← callState uniquement, pas les fonctions

  // Nettoyage global au démontage du composant
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return { stopAll };
};
