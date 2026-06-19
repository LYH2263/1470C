import { useState, useEffect, useRef } from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface ArticleSearchBarProps {
  searchInput: string;
  selectedRowCount: number;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onCreate: () => void;
  onBatchDelete: () => void;
}

const DEBOUNCE_DELAY = 300;

export default function ArticleSearchBar({
  searchInput,
  selectedRowCount,
  onSearchInputChange,
  onSearch,
  onReset,
  onCreate,
  onBatchDelete,
}: ArticleSearchBarProps) {
  const [localValue, setLocalValue] = useState(searchInput);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setLocalValue(searchInput);
  }, [searchInput]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchInputChange(localValue);
      onSearch();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handlePressEnter = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearchInputChange(localValue);
    onSearch();
  };

  const handleSearchClick = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearchInputChange(localValue);
    onSearch();
  };

  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue('');
    onReset();
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Space>
        <Input
          placeholder="搜索标题"
          allowClear
          value={localValue}
          onChange={handleInputChange}
          onPressEnter={handlePressEnter}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchClick}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" onClick={onCreate}>
          新增
        </Button>
        <Button danger onClick={onBatchDelete} disabled={selectedRowCount === 0}>
          批量删除
        </Button>
      </Space>
    </div>
  );
}
