import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Alert from '../components/Alert';

interface User {
  id: number;
  email: string;
  name: string;
}

export default function Profile() {
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/users/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setName(data.name);
      return data;
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('http://localhost:8787/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setAlert({ type: 'success', message: '个人信息更新成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '更新失败，请重试。' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('http://localhost:8787/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to change password');
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setAlert({ type: 'success', message: '密码修改成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '密码修改失败，请检查当前密码是否正确。' });
    },
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync({ name });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />

      <div className="space-y-8">
        {/* 基本信息 */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">基本信息</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>更新您的个人信息</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="mt-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  保存更改
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">修改密码</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>确保您的账户安全</p>
            </div>
            <form onSubmit={handleChangePassword} className="mt-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">当前密码</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  修改密码
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 