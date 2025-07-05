import React, { useEffect, useState } from 'react';
import { Select, Card, Tag, Spin } from 'antd';
import { observer } from 'mobx-react';
import { storeGlobalUser } from '../../../store/globalUser';
import HyperGraph from '../../../components/HyperGraph';
import DatabaseSelector from '../../../components/DatabaseSelector';
import { DatabaseOutlined } from '@ant-design/icons';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const GraphPage = () => {
  const [keys, setKeys] = useState(undefined);
  const [key, setKey] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    entity_name: '',
    entity_type: '',
    descriptions: [''],
    properties: ['']
  });

  // 初始化数据库
  useEffect(() => {
    storeGlobalUser.restoreSelectedDatabase();
    storeGlobalUser.loadDatabases();
  }, []);

  // 获取vertices列表
  useEffect(() => {
    if (!storeGlobalUser.selectedDatabase) return;

    setLoading(true);
    const url = `${SERVER_URL}/db/vertices?database=${encodeURIComponent(storeGlobalUser.selectedDatabase)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setKeys(data);
        // 设置默认选中第一个vertex
        if (data && data.length > 0) {
          setKey(data[0]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('获取vertices失败:', error);
        setLoading(false);
      });
  }, [storeGlobalUser.selectedDatabase]);

  // 获取选中实体的详细信息（用于右侧详情展示）
  useEffect(() => {
    if (!key || !storeGlobalUser.selectedDatabase) return;

    const url = `${SERVER_URL}/db/vertices_neighbor/${encodeURIComponent(key)}?database=${encodeURIComponent(storeGlobalUser.selectedDatabase)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const item = data.vertices[key];
        if (item) {
          setItem({
            entity_name: item.entity_name,
            entity_type: item.entity_type,
            descriptions: item.description ? item.description.split('<SEP>') : [''],
            properties: item.additional_properties ? item.additional_properties.split('<SEP>') : ['']
          });
        }
      })
      .catch((error) => {
        console.error('获取邻居数据失败:', error);
      });
  }, [key, storeGlobalUser.selectedDatabase]);

  // 数据库切换处理
  const onDatabaseChange = () => {
    // 清空选择
    setKey(undefined);
    setItem({
      entity_name: '',
      entity_type: '',
      descriptions: [''],
      properties: ['']
    });
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>正在加载数据...</div>
      </div>
    );
  }

  // 渲染未选择数据库状态
  if (!storeGlobalUser.selectedDatabase) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
        <div>请先选择一个数据库</div>
        <DatabaseSelector
          mode="select"
          showRefresh={true}
          size="middle"
          onChange={onDatabaseChange}
        />
      </div>
    );
  }

  // 渲染无数据状态
  if (!keys || keys.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
        <div>当前数据库没有实体数据</div>
        <div style={{ color: '#999' }}>数据库: {storeGlobalUser.selectedDatabase}</div>
        <DatabaseSelector
          mode="select"
          showRefresh={true}
          size="middle"
          onChange={onDatabaseChange}
        />
      </div>
    );
  }

  return (
    <>
      <div className='m-4' style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>超图数据库：</span>
        <DatabaseSelector
          mode="compact"
          showRefresh={false}
          size="middle"
          onChange={onDatabaseChange}
        />

        <span className='ml-4'>选择实体：</span>
        <Select
          onChange={setKey}
          style={{ width: 300 }}
          value={key}
          showSearch
          placeholder="请选择实体"
        >
          {keys.map((vertexKey) => (
            <Select.Option key={vertexKey} value={vertexKey}>
              {vertexKey}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        {/* 使用HyperGraph组件展示超图 */}
        <div style={{ width: '70%', height: '600px' }}>
          <HyperGraph
            vertexId={key}
            database={storeGlobalUser.selectedDatabase}
            height="600px"
            width="100%"
            showTooltip={true}
            graphId="graph-page-hypergraph"
          />
        </div>

        {/* 实体详情卡片 */}
        <Card 
          title="实体详情"
          style={{ width: '28%', height: '600px', overflow: 'auto' }}
        >
          <p><strong>实体名称:</strong> {item.entity_name}</p>
          <p><strong>实体类型:</strong> <Tag color="blue">{item.entity_type}</Tag></p>
          <p><strong>描述:</strong></p>
          <ul>
            {item.descriptions.map((desc, idx) => (
              <li key={idx}>{desc}</li>
            ))}
          </ul>
          <p><strong>属性:</strong></p>
          <ul>
            {item.properties.map((prop, idx) => (
              <li key={idx}>{prop}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
};

export default observer(GraphPage);