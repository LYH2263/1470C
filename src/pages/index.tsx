import { useCallback } from 'react';
import { Card } from 'antd';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import { useArticleList } from '@/hooks/useArticleList';
import ArticleSearchBar from '@/components/articles/ArticleSearchBar';
import ArticleTable from '@/components/articles/ArticleTable';

export default function ArticlesPage() {
  const router = useRouter();
  const {
    loading,
    data,
    total,
    page,
    pageSize,
    searchInput,
    selectedRowKeys,
    setSearchInput,
    setPage,
    setSelectedRowKeys,
    handleSearch,
    handleReset,
    handleDelete,
    handleBatchDelete,
  } = useArticleList({ pageSize: 10 });

  const handleView = useCallback(
    (id: string) => {
      router.push(`/articles/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/articles/${id}/edit`);
    },
    [router]
  );

  const handleCreate = useCallback(() => {
    router.push('/articles/create');
  }, [router]);

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Card>
          <ArticleSearchBar
            searchInput={searchInput}
            selectedRowCount={selectedRowKeys.length}
            onSearchInputChange={setSearchInput}
            onSearch={handleSearch}
            onReset={handleReset}
            onCreate={handleCreate}
            onBatchDelete={handleBatchDelete}
          />

          <ArticleTable
            data={data}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            selectedRowKeys={selectedRowKeys}
            onPageChange={setPage}
            onSelectedRowKeysChange={setSelectedRowKeys}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
