import { Table, Button, Space, Tag } from 'antd';
import type { TableProps } from 'antd';
import type { Article } from '@/types/article';
import { formatDate, importanceMap } from '@/lib/utils';

interface ArticleTableProps {
  data: Article[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  selectedRowKeys: React.Key[];
  onPageChange: (page: number) => void;
  onSelectedRowKeysChange: (keys: React.Key[]) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ArticleTable({
  data,
  loading,
  page,
  pageSize,
  total,
  selectedRowKeys,
  onPageChange,
  onSelectedRowKeysChange,
  onView,
  onEdit,
  onDelete,
}: ArticleTableProps) {
  const columns: TableProps<Article>['columns'] = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => formatDate(text),
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      width: 100,
      render: (importance: 'low' | 'medium' | 'high') => {
        const config = importanceMap[importance];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '阅读数',
      dataIndex: 'views',
      key: 'views',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onView(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectedRowKeysChange,
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条`,
      }}
    />
  );
}
