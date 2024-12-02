import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../contexts/LocaleContext';

const locales = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' }
];

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center text-gray-500 hover:text-gray-700">
        <GlobeAltIcon className="h-5 w-5" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {locales.map((l) => (
              <Menu.Item key={l.code}>
                {({ active }) => (
                  <button
                    onClick={() => setLocale(l.code)}
                    className={`
                      ${active ? 'bg-gray-100' : ''}
                      ${locale === l.code ? 'text-indigo-600' : 'text-gray-900'}
                      group flex w-full items-center px-4 py-2 text-sm
                    `}
                  >
                    {l.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 