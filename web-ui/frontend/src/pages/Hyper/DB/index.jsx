import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Space,
    Tabs,
    Popconfirm,
    Tag,
    Descriptions,
    Card,
    Spin,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const HyperDB = () => {
    const [vertices, setVertices] = useState([]);
    const [hyperedges, setHyperedges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalType, setModalType] = useState('add'); // add, edit, view
    const [modalDataType, setModalDataType] = useState('vertex'); // vertex, hyperedge
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form] = Form.useForm();

    // 获取数据
    const fetchData = async () => {
        setLoading(true);
        console.log('Fetching data from:', SERVER_URL);
        try {
            console.log('Making requests to:');
            console.log('- Vertices:', `${SERVER_URL}/db/vertices`);
            console.log('- Hyperedges:', `${SERVER_URL}/db/hyperedges`);

            const [verticesRes, hyperedgesRes] = await Promise.all([
                fetch(`${SERVER_URL}/db/vertices`),
                fetch(`${SERVER_URL}/db/hyperedges`)
            ]);

            console.log('Response status:');
            console.log('- Vertices:', verticesRes.status, verticesRes.ok);
            console.log('- Hyperedges:', hyperedgesRes.status, hyperedgesRes.ok);

            if (!verticesRes.ok) {
                throw new Error(`Vertices API failed: ${verticesRes.status} ${verticesRes.statusText}`);
            }
            if (!hyperedgesRes.ok) {
                throw new Error(`Hyperedges API failed: ${hyperedgesRes.status} ${hyperedgesRes.statusText}`);
            }

            const verticesData = await verticesRes.json();
            const hyperedgesData = await hyperedgesRes.json();

            console.log('Data received:');
            console.log('- Vertices:', verticesData);
            console.log('- Hyperedges:', hyperedgesData);

            setVertices(verticesData);
            setHyperedges(hyperedgesData);
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('获取数据失败：' + error.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 获取vertex详细信息
    const getVertexDetail = async (vertexId) => {
        try {
            const response = await fetch(`${SERVER_URL}/db/vertices/${encodeURIComponent(vertexId)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            message.error('获取vertex详情失败：' + error.message);
            return null;
        }
    };

    // 获取hyperedge详细信息
    const getHyperedgeDetail = async (hyperedgeId) => {
        try {
            const response = await fetch(`${SERVER_URL}/db/hyperedges/${encodeURIComponent(hyperedgeId)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            message.error('获取hyperedge详情失败：' + error.message);
            return null;
        }
    };

    // 添加/编辑vertex
    const handleVertexSubmit = async (values) => {
        try {
            setLoading(true);
            let response;

            if (modalType === 'add') {
                response = await fetch(`${SERVER_URL}/db/vertices`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
            } else {
                response = await fetch(`${SERVER_URL}/db/vertices/${encodeURIComponent(selectedRecord)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
            }

            const result = await response.json();

            if (result.success) {
                message.success(result.message);
                setModalVisible(false);
                form.resetFields();
                fetchData();
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error('操作失败：' + error.message);
        }
        setLoading(false);
    };

    // 添加/编辑hyperedge
    const handleHyperedgeSubmit = async (values) => {
        try {
            setLoading(true);

            // 处理vertices字符串，转换为数组
            const verticesArray = values.vertices.split(',').map(v => v.trim()).filter(v => v);
            const submitData = {
                ...values,
                vertices: verticesArray
            };

            let response;

            if (modalType === 'add') {
                response = await fetch(`${SERVER_URL}/db/hyperedges`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            } else {
                response = await fetch(`${SERVER_URL}/db/hyperedges/${encodeURIComponent(selectedRecord)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keywords: values.keywords,
                        summary: values.summary
                    }),
                });
            }

            const result = await response.json();

            if (result.success) {
                message.success(result.message);
                setModalVisible(false);
                form.resetFields();
                fetchData();
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error('操作失败：' + error.message);
        }
        setLoading(false);
    };

    // 删除vertex
    const handleDeleteVertex = async (vertexId) => {
        try {
            setLoading(true);
            const response = await fetch(`${SERVER_URL}/db/vertices/${encodeURIComponent(vertexId)}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                message.success(result.message);
                fetchData();
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error('删除失败：' + error.message);
        }
        setLoading(false);
    };

    // 删除hyperedge
    const handleDeleteHyperedge = async (hyperedgeId) => {
        try {
            setLoading(true);
            const response = await fetch(`${SERVER_URL}/db/hyperedges/${encodeURIComponent(hyperedgeId)}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                message.success(result.message);
                fetchData();
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error('删除失败：' + error.message);
        }
        setLoading(false);
    };

    // 打开modal
    const openModal = async (type, dataType, record = null) => {
        setModalType(type);
        setModalDataType(dataType);
        setSelectedRecord(record);

        // 重置表单
        form.resetFields();

        if ((type === 'edit' || type === 'view') && record) {
            if (dataType === 'vertex') {
                // 先显示modal，然后加载数据
                setModalVisible(true);
                setModalLoading(true);

                try {
                    const data = await getVertexDetail(record);
                    if (data) {
                        form.setFieldsValue({
                            vertex_id: record,
                            entity_name: data.entity_name || '',
                            entity_type: data.entity_type || '',
                            description: data.description || '',
                            additional_properties: data.additional_properties || ''
                        });
                    }
                } catch (error) {
                    message.error('获取vertex详情失败：' + error.message);
                } finally {
                    setModalLoading(false);
                }
            } else if (dataType === 'hyperedge') {
                if (type === 'view') {
                    // 查看hyperedge详情
                    setModalVisible(true);
                    setModalLoading(true);

                    try {
                        const data = await getHyperedgeDetail(record);
                        if (data) {
                            form.setFieldsValue({
                                vertices: record.replace(/\|#\|/g, ', '),
                                keywords: data.keywords || '',
                                summary: data.summary || ''
                            });
                        }
                    } catch (error) {
                        message.error('获取hyperedge详情失败：' + error.message);
                    } finally {
                        setModalLoading(false);
                    }
                } else {
                    // hyperedge编辑时，使用现有数据
                    setModalVisible(true);
                    setModalLoading(true);

                    try {
                        const data = await getHyperedgeDetail(record);
                        if (data) {
                            form.setFieldsValue({
                                vertices: record.replace(/\|#\|/g, ', '),
                                keywords: data.keywords || '',
                                summary: data.summary || ''
                            });
                        }
                    } catch (error) {
                        message.error('获取hyperedge详情失败：' + error.message);
                    } finally {
                        setModalLoading(false);
                    }
                }
            }
        } else {
            // 添加模式直接显示modal
            setModalVisible(true);
        }
    };

    // Vertices表格列定义
    const vertexColumns = [
        {
            title: 'Vertex ID',
            dataIndex: 'vertex_id',
            key: 'vertex_id',
            width: 200,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => openModal('view', 'vertex', record.vertex_id)}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openModal('edit', 'vertex', record.vertex_id)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这个vertex吗？"
                        onConfirm={() => handleDeleteVertex(record.vertex_id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Hyperedges表格列定义
    const hyperedgeColumns = [
        {
            title: 'Hyperedge',
            dataIndex: 'hyperedge_id',
            key: 'hyperedge_id',
            width: 300,
            render: (text, record) => {
                const vertices = text.split('|*|');
                const tooltipContent = (
                    <div>
                        <div><strong>顶点数量:</strong> {vertices.length}</div>
                        {record.keywords && <div><strong>关键词:</strong> {record.keywords}</div>}
                        {record.summary && <div><strong>摘要:</strong> {record.summary}</div>}
                    </div>
                );

                return (
                    <Tooltip title={tooltipContent} placement="topLeft">
                        <div>
                            {vertices.map((vertex, index) => (
                                <Tag key={index} color="green" style={{ margin: '2px' }}>
                                    {vertex}
                                </Tag>
                            ))}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            render: (text) => text || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 250,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => openModal('view', 'hyperedge', record.hyperedge_id)}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openModal('edit', 'hyperedge', record.hyperedge_id)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这个hyperedge吗？"
                        onConfirm={() => handleDeleteHyperedge(record.hyperedge_id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 处理vertices数据为表格格式
    const verticesTableData = vertices.map(vertex => ({
        key: vertex,
        vertex_id: vertex
    }));

    // 处理hyperedges数据为表格格式
    const hyperedgesTableData = hyperedges.map((hyperedge, index) => ({
        key: index,
        hyperedge_id: hyperedge.id || hyperedge,
        description: hyperedge.description || hyperedge.keywords || '-',
        keywords: hyperedge.keywords || '',
        summary: hyperedge.summary || ''
    }));

    return (
        <div style={{ padding: '20px' }}>
            <Card title="HyperGraph 数据库管理" style={{ marginBottom: '20px' }}>
                <Descriptions column={2}>
                    <Descriptions.Item label="Vertices 总数">{vertices.length}</Descriptions.Item>
                    <Descriptions.Item label="Hyperedges 总数">{hyperedges.length}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Tabs defaultActiveKey="vertices">
                <TabPane tab="Vertices 管理" key="vertices">
                    <div style={{ marginBottom: '16px' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('add', 'vertex')}
                        >
                            添加 Vertex
                        </Button>
                    </div>
                    <Table
                        columns={vertexColumns}
                        dataSource={verticesTableData}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 600 }}
                    />
                </TabPane>

                <TabPane tab="Hyperedges 管理" key="hyperedges">
                    <div style={{ marginBottom: '16px' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('add', 'hyperedge')}
                        >
                            添加 Hyperedge
                        </Button>
                    </div>
                    <Table
                        columns={hyperedgeColumns}
                        dataSource={hyperedgesTableData}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 600 }}
                    />
                </TabPane>
            </Tabs>

            {/* Modal for Add/Edit/View */}
            <Modal
                title={
                    modalType === 'add'
                        ? `添加 ${modalDataType === 'vertex' ? 'Vertex' : 'Hyperedge'}`
                        : modalType === 'edit'
                            ? `编辑 ${modalDataType === 'vertex' ? 'Vertex' : 'Hyperedge'}`
                            : `查看 ${modalDataType === 'vertex' ? 'Vertex' : 'Hyperedge'}`
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setModalLoading(false);
                    form.resetFields();
                }}
                footer={modalType === 'view' ? [
                    <Button key="close" onClick={() => {
                        setModalVisible(false);
                        setModalLoading(false);
                    }}>
                        关闭
                    </Button>
                ] : [
                    <Button key="cancel" onClick={() => {
                        setModalVisible(false);
                        setModalLoading(false);
                    }}>
                        取消
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        {modalType === 'add' ? '添加' : '更新'}
                    </Button>
                ]}
                width={600}
            >
                <Spin spinning={modalLoading} tip="加载数据中...">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={modalDataType === 'vertex' ? handleVertexSubmit : handleHyperedgeSubmit}
                    >
                        {modalDataType === 'vertex' ? (
                            <>
                                <Form.Item
                                    name="vertex_id"
                                    label="Vertex ID"
                                    rules={[{ required: modalType === 'add', message: '请输入Vertex ID' }]}
                                >
                                    <Input
                                        placeholder="输入唯一的Vertex ID"
                                        disabled={modalType !== 'add'}
                                    />
                                </Form.Item>
                                <Form.Item name="entity_name" label="实体名称">
                                    <Input placeholder="输入实体名称" disabled={modalType === 'view'} />
                                </Form.Item>
                                <Form.Item name="entity_type" label="实体类型">
                                    <Input placeholder="输入实体类型" disabled={modalType === 'view'} />
                                </Form.Item>
                                <Form.Item name="description" label="描述">
                                    <TextArea
                                        rows={3}
                                        placeholder="输入描述信息，多个描述用<SEP>分隔"
                                        disabled={modalType === 'view'}
                                    />
                                </Form.Item>
                                <Form.Item name="additional_properties" label="附加属性">
                                    <TextArea
                                        rows={3}
                                        placeholder="输入附加属性，多个属性用<SEP>分隔"
                                        disabled={modalType === 'view'}
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <>
                                {modalType === 'view' && (
                                    <Card
                                        title="Hyperedge 信息"
                                        size="small"
                                        style={{ marginBottom: '16px' }}
                                    >
                                        <Descriptions size="small" column={1}>
                                            <Descriptions.Item label="包含顶点">
                                                {selectedRecord && selectedRecord.split('|*|').map((vertex, index) => (
                                                    <Tag key={index} color="blue" style={{ margin: '2px' }}>
                                                        {vertex}
                                                    </Tag>
                                                ))}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                )}

                                <Form.Item
                                    name="vertices"
                                    label="Vertices"
                                    rules={[{ required: modalType === 'add', message: '请输入vertices' }]}
                                >
                                    <Input
                                        placeholder="输入vertices，用逗号分隔，如：vertex1, vertex2, vertex3"
                                        disabled={modalType === 'edit' || modalType === 'view'}
                                    />
                                </Form.Item>
                                <Form.Item name="keywords" label="关键词">
                                    <Input
                                        placeholder="输入关键词，多个关键词用逗号分隔"
                                        disabled={modalType === 'view'}
                                    />
                                </Form.Item>
                                <Form.Item name="summary" label="摘要">
                                    <TextArea
                                        rows={3}
                                        placeholder="输入摘要信息"
                                        disabled={modalType === 'view'}
                                    />
                                </Form.Item>
                            </>
                        )}
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default HyperDB;
