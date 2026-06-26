import { useRef, useState, useCallback, useEffect } from 'react';
import signalRService from '@/services/signalRService';

export type CallType  = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'active';

export interface IncomingCallInfo {
  callerId: number;
  callType: CallType;
  offer:    string;
}

export const useWebRTC = (currentUserId: string) => {
  const [callState,    setCallState]    = useState<CallState>('idle');
  const [callType,     setCallType]     = useState<CallType>('audio');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall]  = useState<IncomingCallInfo | null>(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCamOff,     setIsCamOff]     = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [duration,     setDuration]     = useState(0);
  const [conversationId, setConversationId] = useState<number>(0);
  const [isInitiator,  setIsInitiator]  = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const durationRef = useRef(0);

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  // ── Duration timer ──
  useEffect(() => {
    if (callState !== 'active') {
      setDuration(0);
      durationRef.current = 0;
      return;
    }
    const id = setInterval(() => {
      setDuration(d => {
        durationRef.current = d + 1;
        return d + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [callState]);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setTargetUserId(null);
    setIsMuted(false);
    setIsCamOff(false);
    setIsInitiator(false);
    setDuration(0);
    durationRef.current = 0;
  }, [localStream]);

  // ── Create peer connection ──
  const createPeerConnection = useCallback((targetId: number): RTCPeerConnection => {
    const conn = signalRService.getConnection();
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && conn) {
        conn.invoke('SendIceCandidate', targetId, JSON.stringify(candidate));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallState('active');
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) cleanup();
    };

    return pc;
  }, [cleanup]);

  // ── Start outgoing call ──
  const startCall = useCallback(async (userId: number, type: CallType, convId?: number) => {
    const conn = signalRService.getConnection();
    if (!conn) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      setLocalStream(stream);
      setCallType(type);
      setTargetUserId(userId);
      setCallState('calling');
      setIsInitiator(true);
      if (convId) setConversationId(convId);

      const pc = createPeerConnection(userId);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const cId = convId || conversationId;
      await conn.invoke('InitiateCall', userId, type, JSON.stringify(offer), cId);
    } catch (err) {
      console.error('[useWebRTC] startCall error:', err);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  // ── Accept incoming call ──
  const acceptCall = useCallback(async () => {
    const conn = signalRService.getConnection();
    if (!incomingCall || !conn) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video',
      });
      setLocalStream(stream);
      setCallType(incomingCall.callType);
      setTargetUserId(incomingCall.callerId);
      setCallState('active');
      setIsInitiator(false);

      const pc = createPeerConnection(incomingCall.callerId);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = JSON.parse(incomingCall.offer);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await conn.invoke('AnswerCall', incomingCall.callerId, JSON.stringify(answer));
      setIncomingCall(null);
    } catch (err) {
      console.error('[useWebRTC] acceptCall error:', err);
      cleanup();
    }
  }, [incomingCall, createPeerConnection, cleanup]);

  // ── End call (with status + history) ──
  const endCall = useCallback(async (
    status: 'Missed' | 'Declined' | 'Completed' | 'Cancelled' = 'Completed',
    convId?: number
  ) => {
    const conn = signalRService.getConnection();
    const cId = convId || conversationId;
    if (conn && targetUserId) {
      await conn.invoke(
        'EndCall',
        targetUserId,
        callType,
        status,
        durationRef.current,
        cId,
        isInitiator ? parseInt(currentUserId) : targetUserId
      ).catch(() => {});
    }
    cleanup();
  }, [targetUserId, callType, conversationId, currentUserId, isInitiator, cleanup]);

  // ── Decline incoming ──
  const declineCall = useCallback(async (convId?: number) => {
    const conn = signalRService.getConnection();
    if (conn && incomingCall) {
      const cId = convId || conversationId;
      await conn.invoke(
        'EndCall',
        incomingCall.callerId,
        incomingCall.callType,
        'Declined',
        0,
        cId,
        incomingCall.callerId
      ).catch(() => {});
    }
    setIncomingCall(null);
    setCallState('idle');
    cleanup();
  }, [incomingCall, conversationId, cleanup]);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(v => !v);
  }, [localStream]);

  // ── Toggle camera ──
  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(v => !v);
  }, [localStream]);

  // ── Listen to SignalR events ──
  useEffect(() => {
    const onIncomingCall = (callerId: number, type: string, offer: string) => {
      setIncomingCall({ callerId, callType: type as CallType, offer });
      setCallState('ringing');
    };

    const onCallAnswered = async (answer: string) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(answer))
      );
      setCallState('active');
    };

    const onIceCandidate = async (candidate: string) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
      } catch (err) {
        console.warn('[useWebRTC] ICE candidate error:', err);
      }
    };

    const onCallEnded = () => cleanup();

    signalRService.on('IncomingCall',  onIncomingCall);
    signalRService.on('CallAnswered',  onCallAnswered);
    signalRService.on('IceCandidate',  onIceCandidate);
    signalRService.on('CallEnded',     onCallEnded);

    return () => {
      signalRService.off('IncomingCall',  onIncomingCall);
      signalRService.off('CallAnswered',  onCallAnswered);
      signalRService.off('IceCandidate',  onIceCandidate);
      signalRService.off('CallEnded',     onCallEnded);
    };
  }, [cleanup]);

  return {
    callState, callType, duration,
    localStream, remoteStream,
    incomingCall,
    isMuted, isCamOff,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera,
    setConversationId,
  };
};
