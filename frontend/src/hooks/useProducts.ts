import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_level: number;
  unit_price: number;
  category_id?: number;
  supplier_id?: number;
  category?: { id: number; name: string };
  supplier?: { id: number; name: string };
}

export const useProducts = () => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products/');
      return data as Product[];
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const { data } = await api.post('/products/', newProduct);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { data: res } = await api.put(`/products/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
    refetch: productsQuery.refetch
  };
};
