import { useQuery } from '@tanstack/react-query';

interface Campaign {
  id: number;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function MarketingManagement() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/campaigns', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* 使用 campaigns 数据渲染营销活动列表 */}
    </div>
  );
} 