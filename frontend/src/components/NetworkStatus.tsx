import { useState, useEffect } from 'react';
import { WifiIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMessage) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg ${
        isOnline ? 'bg-green-50' : 'bg-red-50'
      }`}
    >
      {isOnline ? (
        <WifiIcon className="h-5 w-5 text-green-400" />
      ) : (
        <XMarkIcon className="h-5 w-5 text-red-400" />
      )}
      <span
        className={`ml-2 text-sm font-medium ${
          isOnline ? 'text-green-800' : 'text-red-800'
        }`}
      >
        {isOnline ? '网络已连接' : '网络已断开'}
      </span>
      <button
        onClick={() => setShowMessage(false)}
        className="ml-4 text-gray-400 hover:text-gray-500"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
} 