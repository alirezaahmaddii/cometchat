// models/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import { Simulate } from 'react-dom/test-utils';
import change = Simulate.change;

interface AuthContextType {
  user: CometChat.UserObj | null;
  currentUID: string;
  setCurrentUID: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUID: '',
  setCurrentUID: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CometChat.UserObj | null>(null);
  const [initialized, setInitialized] = useState(false);
  // default value for initial login
  const [currentUID, setCurrentUID] = useState<string>('cometchat-uid-1');

  useEffect(() => {
    console.log(process.env.APPID);
    // set config for cometchat
    const init = async () => {
      const appSetting = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(process.env.REGION)
        .build();

      try {
        await CometChat.init(process.env.APPID, appSetting);
      } catch (error) {
        console.error('Error init CometChat:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // can remove this line
    if (!currentUID) return;

    const login = async () => {
      setInitialized(false);
      try {
        const loggedUser = await CometChat.login(currentUID, process.env.AUTH_KEY);
        // @ts-ignore
        setUser(loggedUser);
      } catch (error) {
        console.error('Error in login', error);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };

    login();
  }, [currentUID]);

  return (
    <AuthContext.Provider value={{ user, currentUID, setCurrentUID }}>
      {initialized ? children : <div>You are joining in CometChat</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
