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
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (callState !== 'active') { setDuration(0); return; }
    const id = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  const fmtDuration = (s: number) => {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  };

  const isVideoActive = callType === 'video' && callState === 'active';

  return (
    <div className={`call-modal${isVideoActive ? ' call-modal--video-active' : ''}`}>

      {/* Remote video (fullscreen, video active only) */}
      {isVideoActive && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="call-modal__remote-video" />
          {!isCamOff && (
            <video ref={localVideoRef} autoPlay playsInline muted className="call-modal__local-video" />
          )}
        </>
      )}

      {/* Audio / waiting: centered avatar */}
      {(callType === 'audio' || callState !== 'active') && (
        <div className="call-modal__hero">
          <div className={`call-modal__avatar${callState === 'active' ? ' call-modal__avatar--pulse' : ''}`}>
            {getInitials(calleeName)}
          </div>
          <h4 className="call-modal__callee-name">{calleeName}</h4>
          <p className="call-modal__state-text">
            {callState === 'calling' && `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} en cours...`}
            {callState === 'ringing' && `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} entrant`}
            {callState === 'active'  && fmtDuration(duration)}
          </p>
        </div>
      )}

      {/* Duration overlay for active video */}
      {isVideoActive && (
        <div className="call-modal__duration-overlay">{fmtDuration(duration)}</div>
      )}

      {/* Controls */}
      <div className="call-modal__controls">
        {callState === 'ringing' && (
          <>
            <button onClick={onDecline} className="call-modal__btn call-modal__btn--decline">
              <IconifyIcon icon="tabler:phone-x" style={{ fontSize: 24 }} />
            </button>
            <button onClick={onAccept} className="call-modal__btn call-modal__btn--accept">
              <IconifyIcon icon="tabler:phone-call" style={{ fontSize: 24 }} />
            </button>
          </>
        )}

        {(callState === 'active' || callState === 'calling') && (
          <>
            <button onClick={onToggleMute} className={`call-modal__btn call-modal__btn--${isMuted ? 'muted' : 'mic'}`}>
              <IconifyIcon icon={isMuted ? 'tabler:microphone-off' : 'tabler:microphone'} style={{ fontSize: 22 }} />
            </button>
            {callType === 'video' && (
              <button onClick={onToggleCamera} className={`call-modal__btn call-modal__btn--${isCamOff ? 'cam-off' : 'cam'}`}>
                <IconifyIcon icon={isCamOff ? 'tabler:video-off' : 'tabler:video'} style={{ fontSize: 22 }} />
              </button>
            )}
            <button onClick={onHangup} className="call-modal__btn call-modal__btn--hangup">
              <IconifyIcon icon="tabler:phone-off" style={{ fontSize: 24 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
