import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/models/AuthProvider';
import UserList from '@/components/UserList';
import ChatBox from '@/components/ChatBox';
import { VideoCall } from '@/components/VideoCall';
import { Button, Tabs } from 'antd';
import { CometChat } from '@cometchat-pro/chat';

const { TabPane } = Tabs;

const HomeContent: React.FC = () => {
  const { user, currentUID, setCurrentUID } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [incomingSession, setIncomingSession] = useState<string | null>(null);
  const [callPrompt, setCallPrompt] = useState<{ sessionId: string; callerUid: string } | null>(null);

  useEffect(() => {
    // Create listener for video call
    const listenerId = 'GLOBAL_CALL_LISTENER';

    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          setCallPrompt({ sessionId: call.sessionId, callerUid: call.sender.uid });
        },
        onCallEnded: () => {
          setIncomingSession(null);
          setCallPrompt(null);
        },
      })
    );

    return () => CometChat.removeCallListener(listenerId);
  }, []);


  // Check user login
  if (!user) return <div>You are joining in cometChat</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 400, borderRight: '1px solid #ccc', padding: 10 }}>
        <Tabs
          activeKey={currentUID}
          onChange={(key) => {
            setSelectedUser(null);
            setCurrentUID(key);
          }}
        >
          <TabPane tab="user 1" key="cometchat-uid-1" />
          <TabPane tab="user 2" key="cometchat-uid-2" />
        </Tabs>
        <UserList onSelectUser={setSelectedUser} />
      </div>
      <ChatBox selectedUser={selectedUser} />
      {incomingSession && (
        <VideoCall sessionId={incomingSession} onClose={() => setIncomingSession(null)} />
      )}
      {callPrompt && (
        <div style={{ position: 'fixed', bottom: 20, left: 20, background: '#fff', padding: 20, border: '1px solid #ccc', zIndex: 1001 }}>
          <p> {user.name} is calling to you</p>
          <Button
            onClick={async () => {
              try {
                const accepted = await CometChat.acceptCall(callPrompt.sessionId);
                setIncomingSession(accepted.sessionId);
                setCallPrompt(null);
              } catch (err) {
                console.error('Error when accept call', err);
              }
            }}
            type="primary"
            variant="filled"
            style={{ marginRight: 10 }}
          >
            Accept
          </Button>
          <Button type="primary" variant="filled"  onClick={() => setCallPrompt(null)}>Reject</Button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
