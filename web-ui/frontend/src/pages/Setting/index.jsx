import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    message,
    Space,
    Divider,
    Typography,
    Alert,
    Row,
    Col,
    Tabs,
    AutoComplete
} from 'antd';
import {
    SettingOutlined,
    KeyOutlined,
    DatabaseOutlined,
    ApiOutlined,
    SaveOutlined,
    ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Password } = Input;
const { TabPane } = Tabs;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const Setting = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [availableDatabases, setAvailableDatabases] = useState([]);
    const [testResults, setTestResults] = useState({});

    // 默认配置
    const defaultSettings = {
        apiKey: '',
        modelProvider: 'openai',
        modelName: 'gpt-3.5-turbo',
        baseUrl: 'https://api.openai.com/v1',
        selectedDatabase: '',
        maxTokens: 2000,
        temperature: 0.7
    };

    // 模型提供商配置
    const modelProviders = [
        {
            value: 'openai',
            label: 'OpenAI',
            models: ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
            defaultBaseUrl: 'https://api.openai.com/v1'
        },
        {
            value: 'azure',
            label: 'Azure OpenAI',
            models: ['gpt-35-turbo', 'gpt-4', 'gpt-4o-mini', 'gpt-4-32k'],
            defaultBaseUrl: 'https://your-resource.openai.azure.com'
        },
        {
            value: 'anthropic',
            label: 'Anthropic',
            models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
            defaultBaseUrl: 'https://api.anthropic.com'
        },
        {
            value: 'custom',
            label: '自定义API',
            models: ['custom-model'],
            defaultBaseUrl: 'http://localhost:11434'
        }
    ];

    // 加载设置
    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/settings`);
            if (response.ok) {
                const settings = await response.json();
                form.setFieldsValue({ ...defaultSettings, ...settings });
            } else {
                // 如果获取失败，使用默认设置
                form.setFieldsValue(defaultSettings);
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            form.setFieldsValue(defaultSettings);
            message.warning('加载设置失败，已应用默认设置');
        } finally {
            setLoading(false);
        }
    };

    // 加载可用数据库列表
    const loadDatabases = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/databases`);
            if (response.ok) {
                const databases = await response.json();
                setAvailableDatabases(databases);
            }
        } catch (error) {
            console.error('加载数据库列表失败:', error);
            // 如果API不存在，提供一些默认选项
            setAvailableDatabases([
                { name: 'hypergraph_wukong', description: '西游记超图' },
                { name: 'hypergraph_A_Christmas_Carol', description: '圣诞颂歌超图' }
            ]);
        }
    };

    // 保存设置
    const saveSettings = async (values) => {
        setSaveLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                message.success('设置保存成功');
                // 保存到本地存储作为备份
                localStorage.setItem('hyperrag_settings', JSON.stringify(values));
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            // 即使后端保存失败，也保存到本地存储
            localStorage.setItem('hyperrag_settings', JSON.stringify(values));
            message.warning('后端保存失败，已保存到本地设置');
        } finally {
            setSaveLoading(false);
        }
    };

    // 测试API连接
    const testAPIConnection = async () => {
        const values = form.getFieldsValue();
        if (!values.apiKey) {
            message.error('请先输入API Key');
            return;
        }

        setTestResults({ ...testResults, api: 'testing' });
        try {
            const response = await fetch(`${SERVER_URL}/test-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: values.apiKey,
                    baseUrl: values.baseUrl,
                    modelName: values.modelName,
                    modelProvider: values.modelProvider
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setTestResults({ ...testResults, api: 'success' });
                message.success('API连接测试成功');
            } else {
                setTestResults({ ...testResults, api: 'failed' });
                message.error('API连接测试失败');
            }
        } catch (error) {
            setTestResults({ ...testResults, api: 'failed' });
            message.error('API连接测试失败: ' + error.message);
        }
    };

    // 测试数据库连接
    const testDatabaseConnection = async () => {
        const values = form.getFieldsValue();
        if (!values.selectedDatabase) {
            message.error('请先选择数据库');
            return;
        }

        setTestResults({ ...testResults, database: 'testing' });
        try {
            const response = await fetch(`${SERVER_URL}/test-database`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    database: values.selectedDatabase
                }),
            });

            if (response.ok) {
                setTestResults({ ...testResults, database: 'success' });
                message.success('数据库连接测试成功');
            } else {
                setTestResults({ ...testResults, database: 'failed' });
                message.error('数据库连接测试失败');
            }
        } catch (error) {
            setTestResults({ ...testResults, database: 'failed' });
            message.error('数据库连接测试失败: ' + error.message);
        }
    };

    // 重置设置
    const resetSettings = () => {
        form.setFieldsValue(defaultSettings);
        setTestResults({});
        message.info('已重置为默认设置');
    };

    // 监听模型提供商变化
    const handleProviderChange = (value) => {
        const provider = modelProviders.find(p => p.value === value);
        if (provider) {
            form.setFieldsValue({
                baseUrl: provider.defaultBaseUrl,
                modelName: provider.models[0] // 设置默认模型，用户仍可输入自定义模型
            });
        }
    };

    useEffect(() => {
        loadSettings();
        loadDatabases();
    }, []);

    return (
        <div className='m-2'>
            <Card>
                <div className='mb-4'>
                    <div className='flex items-center text-2xl font-bold'>
                        <SettingOutlined style={{ marginRight: '8px' }} />
                        系统设置
                    </div>
                    <Text type="secondary">配置API密钥、模型参数和数据库连接</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={saveSettings}
                    initialValues={defaultSettings}
                >
                    <Tabs defaultActiveKey="api">
                        <TabPane
                            tab={
                                <span>
                                    <ApiOutlined />
                                    API 配置
                                </span>
                            }
                            key="api"
                        >
                            <Alert
                                message="API 配置说明"
                                description="请配置您的AI模型API信息。API Key将被安全存储，不会在前端显示。"
                                type="info"
                                showIcon
                                style={{ marginBottom: '24px' }}
                            />

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="modelProvider"
                                        label="模型提供商"
                                        rules={[{ required: true, message: '请选择模型提供商' }]}
                                    >
                                        <Select onChange={handleProviderChange}>
                                            {modelProviders.map(provider => (
                                                <Option key={provider.value} value={provider.value}>
                                                    {provider.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="modelName"
                                        label="模型名称"
                                        rules={[{ required: true, message: '请输入或选择模型' }]}
                                        extra="可从预设选项中选择，或直接输入自定义模型名称"
                                    >
                                        <AutoComplete
                                            placeholder="请选择或输入模型名称 (如: gpt-4o, claude-3-sonnet 等)"
                                            allowClear
                                            filterOption={(inputValue, option) =>
                                                option.value.toLowerCase().includes(inputValue.toLowerCase())
                                            }
                                            options={
                                                form.getFieldValue('modelProvider') ?
                                                    modelProviders
                                                        .find(p => p.value === form.getFieldValue('modelProvider'))
                                                        ?.models.map(model => ({
                                                            value: model,
                                                            label: model
                                                        })) || []
                                                    : []
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="baseUrl"
                                label="API Base URL"
                                rules={[{ required: true, message: '请输入API Base URL' }]}
                            >
                                <Input placeholder="https://api.openai.com/v1" />
                            </Form.Item>

                            <Form.Item
                                name="apiKey"
                                label="API Key"
                                rules={[{ required: true, message: '请输入API Key' }]}
                            >
                                <Password
                                    placeholder="请输入您的API Key"
                                    iconRender={(visible) => visible ? <KeyOutlined /> : <KeyOutlined />}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="maxTokens"
                                        label="最大Token数"
                                        rules={[{ required: true, message: '请输入最大Token数' }]}
                                    >
                                        <Input type="number" min={1} max={8000} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="temperature"
                                        label="Temperature"
                                        rules={[{ required: true, message: '请输入Temperature值' }]}
                                    >
                                        <Input type="number" min={0} max={2} step={0.1} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item>
                                <Button
                                    type="default"
                                    onClick={testAPIConnection}
                                    loading={testResults.api === 'testing'}
                                    style={{ marginRight: '8px' }}
                                >
                                    测试API连接
                                </Button>
                                {testResults.api === 'success' && (
                                    <Text type="success">✓ 连接成功</Text>
                                )}
                                {testResults.api === 'failed' && (
                                    <Text type="danger">✗ 连接失败</Text>
                                )}
                            </Form.Item>
                        </TabPane>

                        <TabPane
                            tab={
                                <span>
                                    <DatabaseOutlined />
                                    数据库配置
                                </span>
                            }
                            key="database"
                        >
                            <Alert
                                message="数据库配置说明"
                                description="选择要使用的超图数据库。不同数据库包含不同领域的知识内容。"
                                type="info"
                                showIcon
                                style={{ marginBottom: '24px' }}
                            />

                            <Form.Item
                                name="selectedDatabase"
                                label="选择数据库"
                                rules={[{ required: true, message: '请选择一个数据库' }]}
                            >
                                <Select
                                    placeholder="请选择要使用的数据库"
                                    loading={loading}
                                >
                                    {availableDatabases.map(db => (
                                        <Option key={db.name} value={db.name}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{db.name}</div>
                                                {db.description && (
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {db.description}
                                                    </div>
                                                )}
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="default"
                                    onClick={testDatabaseConnection}
                                    loading={testResults.database === 'testing'}
                                    style={{ marginRight: '8px' }}
                                >
                                    测试数据库连接
                                </Button>
                                {testResults.database === 'success' && (
                                    <Text type="success">✓ 连接成功</Text>
                                )}
                                {testResults.database === 'failed' && (
                                    <Text type="danger">✗ 连接失败</Text>
                                )}
                            </Form.Item>
                        </TabPane>
                    </Tabs>

                    <Divider />

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={saveLoading}
                            >
                                保存设置
                            </Button>
                            <Button
                                type="default"
                                icon={<ReloadOutlined />}
                                onClick={resetSettings}
                            >
                                重置为默认
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Setting; 