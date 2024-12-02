import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '../../components/Alert';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function CategoryManagement() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await fetch('http://localhost:8787/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      resetForm();
      setAlert({ type: 'success', message: '分类创建成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '分类创建失败，请重试。' });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const response = await fetch(`http://localhost:8787/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      resetForm();
      setAlert({ type: 'success', message: '分类更新成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '分类更新失败，请重试。' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8787/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setAlert({ type: 'success', message: '分类删除成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '分类删除失败，请重试。' });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description };
    
    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({ ...data, id: editingCategory.id });
    } else {
      await createCategoryMutation.mutateAsync(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个分类吗？')) {
      await deleteCategoryMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />

      <div className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">
            {editingCategory ? '编辑分类' : '添加新分类'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">分类名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                {editingCategory ? '更新分类' : '添加分类'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">分类列表</h3>
            <div className="space-y-4">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between border-b border-gray-200 py-4 last:border-0"
                >
                  <div>
                    <h4 className="text-lg font-medium">{category.name}</h4>
                    <p className="text-gray-500">{category.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 