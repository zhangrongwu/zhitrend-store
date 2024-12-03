import { createContext, useContext, useState, ReactNode } from 'react';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

type LocaleType = 'zh-CN' | 'en-US';

interface LocaleContextType {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleType>('zh-CN');

  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = messages[locale];
      
      for (const k of keys) {
        if (value === undefined) return key;
        value = value[k];
      }
      
      return value || key;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

  const value = {
    locale,
    setLocale,
    t,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
} 