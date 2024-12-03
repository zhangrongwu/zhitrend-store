import { XMarkIcon } from '@heroicons/react/20/solid';

interface AlertProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export default function Alert({ show, type, message, onClose }: AlertProps) {
  if (!show) return null;

  return (
    <div className={`rounded-md p-4 ${
      type === 'success' ? 'bg-green-50' : 'bg-red-50'
    }`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${
            type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success' 
                ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
            }`}
          >
            <span className="sr-only">关闭</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 