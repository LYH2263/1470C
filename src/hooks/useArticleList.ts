import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, message } from 'antd';
import type { Article, ArticleListResponse } from '@/types/article';
import { fetchWithAuth } from '@/lib/api';

interface UseArticleListOptions {
  pageSize?: number;
}

interface UseArticleListReturn {
  loading: boolean;
  data: Article[];
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  searchInput: string;
  selectedRowKeys: React.Key[];
  setSearchInput: (value: string) => void;
  setPage: (page: number) => void;
  setSelectedRowKeys: (keys: React.Key[]) => void;
  fetchArticles: () => Promise<void>;
  handleSearch: () => void;
  handleReset: () => void;
  handleDelete: (id: string) => void;
  handleBatchDelete: () => void;
}

export function useArticleList(
  options: UseArticleListOptions = {}
): UseArticleListReturn {
  const { pageSize: initialPageSize = 10 } = options;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchRef = useRef<number | null>(null);

  const fetchArticles = useCallback(async () => {
    const requestId = Date.now();
    fetchRef.current = requestId;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(keyword && { keyword }),
      });

      const response = await fetchWithAuth(`/api/articles?${params}`);
      const result = await response.json();

      if (fetchRef.current !== requestId) {
        return;
      }

      if (result.success) {
        const listData: ArticleListResponse = result.data;
        setData(listData.data);
        setTotal(listData.total);
      } else {
        message.error(result.error || '获取数据失败');
      }
    } catch (error) {
      if (fetchRef.current !== requestId) {
        return;
      }
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      if (fetchRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const handleSearch = useCallback(() => {
    setKeyword(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleReset = useCallback(() => {
    setSearchInput('');
    setKeyword('');
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这篇文章吗？',
        onOk: async () => {
          try {
            const response = await fetchWithAuth('/api/articles', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: [id] }),
            });

            const result = await response.json();

            if (result.success) {
              message.success('删除成功');
              fetchArticles();
            } else {
              message.error(result.error || '删除失败');
            }
          } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败');
          }
        },
      });
    },
    [fetchArticles]
  );

  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的文章');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 篇文章吗？`,
      onOk: async () => {
        try {
          const response = await fetchWithAuth('/api/articles', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedRowKeys }),
          });

          const result = await response.json();

          if (result.success) {
            message.success('删除成功');
            setSelectedRowKeys([]);
            fetchArticles();
          } else {
            message.error(result.error || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      },
    });
  }, [selectedRowKeys, fetchArticles]);

  return {
    loading,
    data,
    total,
    page,
    pageSize,
    keyword,
    searchInput,
    selectedRowKeys,
    setSearchInput,
    setPage,
    setSelectedRowKeys,
    fetchArticles,
    handleSearch,
    handleReset,
    handleDelete,
    handleBatchDelete,
  };
}
