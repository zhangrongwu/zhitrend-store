import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  onCancel?: () => void;
  error?: string;
}

export default function UploadProgress({
  progress,
  fileName,
  status,
  onCancel,
  error,
}: UploadProgressProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{fileName}</span>
        {status === 'uploading' && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            取消
          </button>
        )}
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${progress}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              status === 'error'
                ? 'bg-red-500'
                : status === 'success'
                ? 'bg-green-500'
                : 'bg-indigo-500'
            }`}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center">
        {status === 'success' && (
          <div className="flex items-center text-green-500">
            <CheckCircleIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">上传成功</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center text-red-500">
            <XCircleIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">{error || '上传失败'}</span>
          </div>
        )}
        {status === 'uploading' && (
          <span className="text-sm text-gray-500">{progress}%</span>
        )}
      </div>
    </div>
  );
} 