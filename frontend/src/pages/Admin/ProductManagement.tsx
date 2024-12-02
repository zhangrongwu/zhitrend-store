import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '../../components/Alert';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ImportData from '../../components/ImportData';
import ImageCompressor from '../../components/ImageCompressor';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

export default function ProductManagement() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8787/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const response = await fetch('http://localhost:8787/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
      setAlert({ type: 'success', message: '产品创建成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '产品创建失败，请重试。' });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const response = await fetch(`http://localhost:8787/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
      setAlert({ type: 'success', message: '产品更新成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '产品更新失败，请重试。' });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8787/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAlert({ type: 'success', message: '产品删除成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '产品删除失败，请重试。' });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImage(null);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = editingProduct?.image;
      
      if (image) {
        const uploadResult = await uploadMutation.mutateAsync(image);
        imageUrl = uploadResult.url;
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        image: imageUrl,
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({ ...productData, id: editingProduct.id });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setAlert({ type: 'error', message: '操作失败，请重试。' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      await deleteProductMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">产品管理</h2>
        <ImportData
          endpoint="products"
          templateUrl="/templates/products-import-template.csv"
          buttonText="批量导入"
          onSuccess={() => {
            queryClient.invalidateQueries(['products']);
            setAlert({ type: 'success', message: '批量导入完成' });
          }}
        />
      </div>

      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />
      
      <div className="space-y-8">
        {/* Form section */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">
            {editingProduct ? '编辑产品' : '添加新产品'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">产品名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">价格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">图片</label>
              <ImageCompressor
                onCompress={(compressedFile) => setImage(compressedFile)}
                maxSizeMB={0.5}
                maxWidthOrHeight={1200}
                className="mt-1"
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {editingProduct ? '更新产品' : '添加产品'}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-3 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                取消
              </button>
            )}
          </form>
        </div>

        {/* Products list */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">现有产品</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products?.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <h4 className="mt-2 text-lg font-medium">{product.name}</h4>
                  <p className="text-gray-600">{product.description}</p>
                  <p className="mt-2 text-lg font-bold">¥{product.price}</p>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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