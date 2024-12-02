import { createContext, useContext, useState, ReactNode } from 'react';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

type Locale = 'zh-CN' | 'en-US';
type Messages = typeof zhCN;

interface LocaleContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    return savedLocale || 'zh-CN';
  });

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  return (
    <LocaleContext.Provider 
      value={{ 
        locale, 
        messages: locales[locale], 
        setLocale: handleSetLocale 
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
} 