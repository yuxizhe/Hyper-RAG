import React, { useEffect } from 'react';
import { Select, Typography, Space, Button, message, Spin } from 'antd';
import { observer } from 'mobx-react';
import { DatabaseOutlined, ReloadOutlined } from '@ant-design/icons';
import { storeGlobalUser } from '../../store/globalUser';

const { Text } = Typography;
const { Option } = Select;

/**
 * 数据库选择组件
 * @param {Object} props
 * @param {'select'|'buttons'|'compact'} props.mode - 显示模式：选择器/按钮组/紧凑模式
 * @param {boolean} props.showCurrent - 是否显示当前数据库信息
 * @param {boolean} props.showRefresh - 是否显示刷新按钮
 * @param {string} props.placeholder - 选择器占位文本
 * @param {Object} props.style - 自定义样式
 * @param {string} props.size - 组件大小 'small'|'middle'|'large'
 * @param {Function} props.onChange - 数据库变更回调
 * @param {boolean} props.disabled - 是否禁用
 */
const DatabaseSelector = ({
    mode = 'select',
    showCurrent = true,
    showRefresh = false,
    placeholder = '请选择数据库',
    style = {},
    size = 'middle',
    onChange,
    disabled = false
}) => {

    // 初始化数据库列表
    useEffect(() => {
        if (!storeGlobalUser.selectedDatabase) {
            storeGlobalUser.restoreSelectedDatabase();
        }
        if (storeGlobalUser.availableDatabases.length === 0) {
            storeGlobalUser.loadDatabases();
        }
    }, []);

    // 处理数据库变更
    const handleDatabaseChange = (value) => {
        storeGlobalUser.setSelectedDatabase(value);
        onChange && onChange(value);
    };

    // 刷新数据库列表
    const handleRefresh = async () => {
        try {
            await storeGlobalUser.loadDatabases();
            message.success('数据库列表已刷新');
        } catch (error) {
            message.error('刷新数据库列表失败');
        }
    };

    // 选择器模式
    const renderSelectMode = () => (
        <Space size="middle" style={style}>
            <Select
                value={storeGlobalUser.selectedDatabase}
                onChange={handleDatabaseChange}
                style={{ minWidth: 250 }}
                placeholder={placeholder}
                size={size}
                disabled={disabled}
                loading={storeGlobalUser.availableDatabases.length === 0}
                dropdownRender={(menu) => (
                    <div>
                        {menu}
                        {showRefresh && (
                            <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={handleRefresh}
                                    style={{ width: '100%' }}
                                >
                                    刷新列表
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            >
                {storeGlobalUser.availableDatabases.map((db) => (
                    <Option key={db.name} value={db.name}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <DatabaseOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                {db.description}
                            </div>
                        </div>
                    </Option>
                ))}
            </Select>

            {showCurrent && storeGlobalUser.selectedDatabase && (
                <Text type="secondary">
                    当前: {storeGlobalUser.selectedDatabase}
                </Text>
            )}

            {showRefresh && (
                <Button
                    type="text"
                    size={size}
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    disabled={disabled}
                />
            )}
        </Space>
    );

    // 按钮组模式
    const renderButtonsMode = () => (
        <Space wrap size="small" style={style}>
            {storeGlobalUser.availableDatabases.map((db) => (
                <Button
                    key={db.name}
                    size={size}
                    type={storeGlobalUser.selectedDatabase === db.name ? 'primary' : 'default'}
                    onClick={() => handleDatabaseChange(db.name)}
                    disabled={disabled}
                    icon={<DatabaseOutlined />}
                    title={db.description}
                    style={{
                        borderColor: storeGlobalUser.selectedDatabase === db.name ? '#1890ff' : undefined
                    }}
                >
                    {db.description}
                </Button>
            ))}
            {showRefresh && (
                <Button
                    type="text"
                    size={size}
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    disabled={disabled}
                />
            )}
        </Space>
    );

    // 紧凑模式
    const renderCompactMode = () => (
        <Space size="small" style={style}>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <Select
                value={storeGlobalUser.selectedDatabase}
                onChange={handleDatabaseChange}
                style={{ minWidth: 180 }}
                size={size}
                disabled={disabled}
                // bordered={false}
                placeholder={placeholder}
            >
                {storeGlobalUser.availableDatabases.map((db) => (
                    <Option key={db.name} value={db.name} title={db.description}>
                        {db.description}
                    </Option>
                ))}
            </Select>
        </Space>
    );

    // 加载状态
    if (storeGlobalUser.availableDatabases.length === 0) {
        return (
            <Space style={style}>
                <Spin size="small" />
                <Text type="secondary">加载数据库列表...</Text>
            </Space>
        );
    }

    // 根据模式渲染不同的UI
    switch (mode) {
        case 'buttons':
            return renderButtonsMode();
        case 'compact':
            return renderCompactMode();
        case 'select':
        default:
            return renderSelectMode();
    }
};

export default observer(DatabaseSelector); 