import React, { useEffect, useRef, useState } from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { CallState, CallType } from '../hooks/useWebRTC';

interface CallModalProps {
  callState:      CallState;
  callType:       CallType;
  localStream:    MediaStream | null;
  remoteStream:   MediaStream | null;
  calleeName:     string;
  isMuted:        boolean;
  isCamOff:       boolean;
  onAccept:       () => void;
  onDecline:      () => void;
  onHangup:       () => void;
  onToggleMute:   () => void;
  onToggleCamera: () => void;
}

const btnStyle = (bg: string): React.CSSProperties => ({
  width: 64, height: 64, borderRadius: '50%',
  border: 'none', background: bg, color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.3)',
  transition: 'transform .1s',
});

export const CallModal: React.FC<CallModalProps> = ({
  callState, callType,
  localStream, remoteStream,
  calleeName,
  isMuted, isCamOff,
  onAccept, onDecline, onHangup,
  onToggleMute, onToggleCamera,
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (callState !== 'active') { setDuration(0); return; }
    const id = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000,
      background: callType === 'video' && callState === 'active'
        ? '#000' : 'rgba(15,23,42,.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Remote video (fullscreen) */}
      {callType === 'video' && callState === 'active' && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {!isCamOff && (
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              style={{
                position: 'absolute', bottom: 100, right: 20,
                width: 120, height: 180, borderRadius: 12,
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,.3)',
                zIndex: 1,
              }}
            />
          )}
        </>
      )}

      {/* Audio / waiting: centered avatar */}
      {(callType === 'audio' || callState !== 'active') && (
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: '#0d6efd', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700,
            margin: '0 auto 16px',
            boxShadow: callState === 'active'
              ? '0 0 0 8px rgba(13,110,253,.2), 0 0 0 16px rgba(13,110,253,.1)' : 'none',
            animation: callState === 'active' ? 'callPulse 2s infinite' : 'none',
          }}>
            {getInitials(calleeName)}
          </div>
          <h4 style={{ color: '#fff', marginBottom: 4 }}>{calleeName}</h4>
          <p style={{ color: 'rgba(255,255,255,.6)', margin: 0, fontSize: 14 }}>
            {callState === 'calling'  && `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} en cours...`}
            {callState === 'ringing'  && `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} entrant`}
            {callState === 'active'   && fmtDuration(duration)}
          </p>
        </div>
      )}

      {/* Duration overlay for active video */}
      {callType === 'video' && callState === 'active' && (
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          color: '#fff', fontSize: 16, fontWeight: 600,
          background: 'rgba(0,0,0,.4)', padding: '4px 14px', borderRadius: 20,
          zIndex: 2,
        }}>
          {fmtDuration(duration)}
        </div>
      )}

      {/* Control buttons */}
      <div style={{
        position: 'absolute', bottom: 40,
        display: 'flex', alignItems: 'center', gap: 20, zIndex: 2,
      }}>
        {/* Incoming: Accept + Decline */}
        {callState === 'ringing' && (
          <>
            <button onClick={onDecline} style={btnStyle('#dc3545')}>
              <IconifyIcon icon="tabler:phone-x" style={{ fontSize: 24 }} />
            </button>
            <button onClick={onAccept} style={btnStyle('#198754')}>
              <IconifyIcon icon="tabler:phone-call" style={{ fontSize: 24 }} />
            </button>
          </>
        )}

        {/* Active / Calling controls */}
        {(callState === 'active' || callState === 'calling') && (
          <>
            <button onClick={onToggleMute} style={btnStyle(isMuted ? '#6c757d' : 'rgba(255,255,255,.2)')}>
              <IconifyIcon icon={isMuted ? 'tabler:microphone-off' : 'tabler:microphone'} style={{ fontSize: 22 }} />
            </button>
            {callType === 'video' && (
              <button onClick={onToggleCamera} style={btnStyle(isCamOff ? '#6c757d' : 'rgba(255,255,255,.2)')}>
                <IconifyIcon icon={isCamOff ? 'tabler:video-off' : 'tabler:video'} style={{ fontSize: 22 }} />
              </button>
            )}
            <button onClick={onHangup} style={btnStyle('#dc3545')}>
              <IconifyIcon icon="tabler:phone-off" style={{ fontSize: 24 }} />
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes callPulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(13,110,253,.2), 0 0 0 16px rgba(13,110,253,.1); }
          50%       { box-shadow: 0 0 0 14px rgba(13,110,253,.15), 0 0 0 28px rgba(13,110,253,.05); }
        }
      `}</style>
    </div>
  );
};
