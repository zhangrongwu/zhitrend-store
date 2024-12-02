import { useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Alert from './Alert';

interface ImportDataProps {
  endpoint: string;
  templateUrl: string;
  buttonText: string;
  onSuccess?: () => void;
}

export default function ImportData({ endpoint, templateUrl, buttonText, onSuccess }: ImportDataProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8787/api/import/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();
      setAlert({
        type: 'success',
        message: `成功导入 ${result.imported} 条数据${result.failed ? `，${result.failed} 条失败` : ''}`,
      });
      onSuccess?.();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : '导入失败，请重试',
      });
    } finally {
      setIsImporting(false);
      e.target.value = ''; // 重置文件输入
    }
  };

  return (
    <div>
      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />
      
      <div className="flex items-center space-x-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleImport}
            disabled={isImporting}
            className="sr-only"
          />
          <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            {isImporting ? '导入中...' : buttonText}
          </div>
        </label>
        <a
          href={templateUrl}
          download
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          下载模板
        </a>
      </div>
    </div>
  );
} 