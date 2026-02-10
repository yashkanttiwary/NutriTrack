
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, DailyLog } from '../types';
import { getUserProfile, getTodayLog } from '../services/db';

interface UserContextType {
  userProfile: UserProfile | null;
  dailyLog: DailyLog | null;
  loading: boolean;
  refreshLog: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUserProfile: (p: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const profile = await getUserProfile();
    if (profile) setUserProfile(profile);
  };

  const refreshLog = async () => {
    const log = await getTodayLog();
    setDailyLog(log);
  };

  useEffect(() => {
    async function init() {
      await refreshProfile();
      await refreshLog();
      setLoading(false);
    }
    init();
  }, []);

  return (
    <UserContext.Provider value={{ 
      userProfile, 
      dailyLog, 
      loading, 
      refreshLog, 
      refreshProfile,
      setUserProfile 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
