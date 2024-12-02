import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import Alert from '../components/Alert';
import { motion } from 'framer-motion';
import LocaleToggle from '../components/LocaleToggle';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
      navigate('/');
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : t('operationFailed'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LocaleToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            className="mx-auto h-12 w-auto"
            src="/images/logo.svg"
            alt={t('brandName')}
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
            >
              {isLogin ? t('registerNow') : t('loginNow')}
            </button>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <Alert
            show={!!alert}
            type={alert?.type || 'success'}
            message={alert?.message || ''}
            onClose={() => setAlert(null)}
          />

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('username')}
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={t('usernamePlaceholder')}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLogin ? t('login') : t('register')}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('otherLoginMethods')}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">{t('wechatLogin')}</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.07 16.316c-.42 0-.819-.04-1.197-.122L4.21 17.497l.637-2.105c-1.175-.857-1.876-1.958-1.876-3.125 0-2.392 2.277-4.333 5.098-4.333 2.503 0 4.687 1.525 5.127 3.593-.174-.027-.35-.04-.527-.04-2.32 0-4.2 1.732-4.2 3.867 0 .355.054.698.155 1.026-.17-.04-.347-.064-.527-.064zM20.5 19l.823-2.67c.952-.695 1.677-1.708 1.677-2.83 0-2.392-2.277-4.333-5.098-4.333-2.82 0-5.098 1.94-5.098 4.333 0 2.392 2.277 4.333 5.098 4.333.642 0 1.257-.074 1.82-.213l2.657.87-.879-2.49z"/>
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">{t('alipayLogin')}</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.422 15.358c-1.037-.803-2.38-1.478-3.737-2.115-1.343-.637-2.686-1.235-4.028-1.833-.536-.24-1.073-.48-1.61-.72.134-.48.268-.96.402-1.44.335-1.2.67-2.4 1.005-3.6h2.515V4.41h-3.22l.402-1.44H9.93l-.402 1.44H6.31v1.2h2.917l-.938 3.36H5.37v1.2h2.515c-.134.48-.268.96-.402 1.44-.335 1.2-.67 2.4-1.005 3.6H3.96v1.2h2.112c.134-.48.268-.96.402-1.44h3.22l-.402 1.44h3.22l.402-1.44h3.22c-.134.48-.268.96-.402 1.44h2.515v-1.2h-2.112c.134-.48.268-.96.402-1.44h3.22v-1.2h-2.917l.938-3.36h2.917v-1.2h-2.515l.402-1.44h-3.22l-.402 1.44H9.93l.402-1.44H7.113l-.402 1.44H4.295v1.2h2.112l-.938 3.36H2.552v1.2h2.515c-.134.48-.268.96-.402 1.44-.335 1.2-.67 2.4-1.005 3.6h2.515v-1.2H3.557l.938-3.36h3.22l-.402 1.44h3.22l.402-1.44h3.22l-.402 1.44h3.22l.402-1.44h3.22l-.938 3.36h-2.515v1.2h2.112c-.134.48-.268.96-.402 1.44h2.515v-1.2z"/>
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">{t('phoneLogin')}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 