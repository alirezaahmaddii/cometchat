import React, { useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import { useAuth } from '@/models/AuthProvider';
import { VideoCall } from './VideoCall';
import { Avatar, Button, Card, Flex } from 'antd';

interface Props {
  selectedUser: CometChat.UserObj | null;
}

interface TranslatedMessage {
  id: string;
  translatedText: string;
}

const ChatBox: React.FC<Props> = ({ selectedUser }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [outgoingSessionId, setOutgoingSessionId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslatedMessage[]>([]);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
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
          if (msg.sender.uid === selectedUser.uid) {
            setMessages((prev) => [...prev, msg]);
          }
        },
      })
    );

    return () => CometChat.removeMessageListener(listenerId);
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;

    const message = new CometChat.TextMessage(
      selectedUser.uid,
      text,
      CometChat.RECEIVER_TYPE.USER
    );

    try {
      const sent = await CometChat.sendMessage(message);
      setMessages((prev) => [...prev, sent]);
      setText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const startVideoCall = async () => {
    if (!selectedUser) return;
    const call = new CometChat.Call(
      selectedUser.uid,
      CometChat.CALL_TYPE.VIDEO,
      CometChat.RECEIVER_TYPE.USER
    );

    try {
      const outgoingCall = await CometChat.initiateCall(call);
      setOutgoingSessionId(outgoingCall.getSessionId());
    } catch (err) {
      console.error('Error starting video call:', err);
    }
  };

  const translateMessage = async (message: any) => {
    const alreadyTranslated = translations.find((t) => t.id === message.id);
    if (alreadyTranslated) return;

    try {
      setTranslatingId(message.id);
      // Add extension for translate we should enable to dashboard
      const translated = await CometChat.callExtension(
        'message-translation',
        'POST',
        'v2/translate',
        {
          msgId: message.id,
          text: message.text,
          languages: ['fa'],
        }
      );

      const translatedText = translated?.translations?.[0]?.message_translated;

      if (translatedText) {
        setTranslations((prev) => [
          ...prev,
          {
            id: message.id,
            translatedText,
          },
        ]);
      } else {
        console.warn('No translated text found in response:', translated);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslatingId(null);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) return <div>Choose a user:</div>;

  const renderMessage = (msg: any) => {
    const isSender = msg.sender.uid === currentUser?.uid;
    const translated = translations.find((t) => t.id === msg.id);
    const isTranslating = translatingId === msg.id;

    return (
      <Flex key={msg.id} justify={isSender ? 'end' : 'start'} style={{ marginBottom: 8 }}>
        <Card
          style={{
            maxWidth: 400,
            backgroundColor: isSender ? '#367' : '#fff',
            color: isSender ? '#fff' : '#000',
          }}
        >
          <div>{msg.text}</div>

          {!isSender && (
            <Button
              size="small"
              type="link"
              onClick={() => translateMessage(msg)}
              style={{ paddingLeft: 0 }}
              disabled={isTranslating}
            >
              {isTranslating ? 'translating...' : 'Translate'}
            </Button>
          )}

          {translated && (
            <div
              style={{
                marginTop: 6,
                fontStyle: 'italic',
                color: '#555',
                backgroundColor: '#f0f0f0',
                padding: '6px 10px',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {translated.translatedText}
            </div>
          )}
        </Card>
      </Flex>
    );
  };

  return (
    <Flex vertical style={{ flex: 1, padding: 20 }}>
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
        {messages.map((msg) => msg.type === 'text' && renderMessage(msg))}
        <div ref={messagesEndRef} />
      </div>

      <Flex gap={10}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ width: '70%', padding: 8 }}
          placeholder="Please write message"
        />
        <Flex gap={10}>
          <Button type="primary" onClick={sendMessage}>
            Send
          </Button>
          <Button type="primary" onClick={startVideoCall} style={{ padding: '8px 16px' }}>
            Start Video Call
          </Button>
        </Flex>
      </Flex>

      {outgoingSessionId && (
        <VideoCall sessionId={outgoingSessionId} onClose={() => setOutgoingSessionId(null)} />
      )}
    </Flex>
  );
};

export default ChatBox;
