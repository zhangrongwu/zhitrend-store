import { QueryKey } from '@tanstack/react-query';

export type ValidQueryKey = 
  | ['products']
  | ['product', string | number]
  | ['cart']
  | ['cartCount']
  | ['orders']
  | ['order', string | number]
  | ['user']
  | ['categories']
  | ['favorites']
  | ['ratings', number]
  | ['search-history']
  | ['admin-orders']
  | ['inventory', string]
  | ['inventory-logs'];

export function createQueryKey(key: ValidQueryKey): { queryKey: QueryKey } {
  return { queryKey: key };
} 