import React, { useEffect, useRef } from 'react';
import { CometChat } from '@cometchat-pro/chat';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export const VideoCall: React.FC<Props> = ({ sessionId, onClose }) => {
  const callScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const callSettings = new CometChat.CallSettingsBuilder()
      .setSessionID(sessionId)
      .enableDefaultLayout(true)
      .build();

    CometChat.startCall(sessionId, callScreenRef.current!, callSettings);

    const listenerId = 'VIDEO_CALL_LISTENER';

    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onCallEnded: () => onClose(),
      })
    );

    return () => {
      CometChat.removeCallListener(listenerId);
      CometChat.endCall(sessionId);
    };
  }, [sessionId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 1000 }}>
      <div ref={callScreenRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
