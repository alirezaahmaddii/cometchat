import React, { useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import { useAuth } from '@/models/AuthProvider';
import { VideoCall } from './VideoCall';
import { Avatar, Button, Card, Flex } from 'antd';

interface Props {
  selectedUser: CometChat.UserObj | null;
}

const ChatBox: React.FC<Props> = ({ selectedUser }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [outgoingSessionId, setOutgoingSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const request = new CometChat.MessagesRequestBuilder()
        .setUID(selectedUser.uid)
        .setLimit(50)
        .build();
      const fetched = await request.fetchPrevious();
      setMessages(fetched);
    };

    fetchMessages();

    const listenerId = 'CHAT_LISTENER';
    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (msg) => {
          console.log(msg, 'message received');
          if (msg.sender.uid === selectedUser.uid) {
            setMessages(prev => [...prev, msg]);
          }
        },
      })
    );

    return () => CometChat.removeMessageListener(listenerId);
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const message = new CometChat.TextMessage(
      selectedUser.uid,
      text,
      CometChat.RECEIVER_TYPE.USER
    );

    try {
      const sent = await CometChat.sendMessage(message);
      setMessages(prev => [...prev, sent]);
      setText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const startVideoCall = async () => {
    const call = new CometChat.Call(
      selectedUser.uid,
      CometChat.CALL_TYPE.VIDEO,
      CometChat.RECEIVER_TYPE.USER
    );

    try {
      const outgoingCall = await CometChat.initiateCall(call);
      //  get sessionId for create video call room
      setOutgoingSessionId(outgoingCall.getSessionId());
    } catch (err) {
      console.error('Error starting video call:', err);
    }
  };

  useEffect(() => {
    // for last message in my content
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) return <div>Choose a user: </div>;


  // Check sender or receiver for style message box
  const messageBox = (isSender: boolean, text:string) => {
    if (isSender) {
      return (
        <Flex justify="end">
          <Card style={{ backgroundColor: '#367', maxWidth: 400 }}>{text}</Card>
        </Flex>
      );
    }

    return (
      <Flex justify="start">
        <Card>{text}</Card>
      </Flex>
    )
  }

  return (
    <Flex
      vertical
      style={{ flex: 1, padding: 20 }}
    >
      <Flex align="center" gap={5}>
        <h3>Chat with {selectedUser.name}</h3>
        <Avatar src={selectedUser.avatar} size={'large'} />
      </Flex>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((msg) => (
          <>
            {msg.type === 'text' &&
              messageBox(msg.sender.uid === currentUser?.uid, msg.text)}
          </>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer of message content  */}
      <Flex gap={10}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ width: '70%', padding: 8 }}
          placeholder="Please write message"
        />
        <Flex gap={10}>
          <Button variant="filled" type="primary" onClick={sendMessage}>
            Send
          </Button>
          <Button
            variant="filled"
            type="primary"
            onClick={startVideoCall}
            style={{ padding: '8px 16px' }}
          >
            Start Video Call
          </Button>
        </Flex>
      </Flex>

      {outgoingSessionId && (
        <VideoCall
          sessionId={outgoingSessionId}
          onClose={() => setOutgoingSessionId(null)}
        />
      )}
    </Flex>
  );
};

export default ChatBox;
