import React, { useState } from 'react'
import { Card, Tag, Collapse, Badge, Tooltip, Typography, Space, Divider } from 'antd'
import {
    NodeIndexOutlined,
    ShareAltOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    DatabaseOutlined
} from '@ant-design/icons'

const { Panel } = Collapse
const { Text, Paragraph } = Typography

const RetrievalInfo = ({ entities = [], hyperedges = [], textUnits = [], className = '' }) => {
    const [activeKey, setActiveKey] = useState([])

    // 如果没有任何检索信息，不渲染组件
    if (!entities.length && !hyperedges.length && !textUnits.length) {
        return null
    }

    const renderEntityCard = (entity, index) => (
        <Card
            key={index}
            size="small"
            className="mb-2"
            title={
                <Space>
                    <NodeIndexOutlined className="text-blue-500" />
                    <Text strong>{entity.entity_name}</Text>
                    <Tag color="blue" size="small">{entity.entity_type}</Tag>
                </Space>
            }
        >
            <div className="text-sm">
                {entity.description && (
                    <div className="mb-2">
                        <Text type="secondary">描述: </Text>
                        <Paragraph
                            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                            className="mb-1"
                        >
                            {entity.description}
                        </Paragraph>
                    </div>
                )}
                {entity.additional_properties && entity.additional_properties !== 'UNKNOWN' && (
                    <div className="mb-2">
                        <Text type="secondary">属性: </Text>
                        <Text>{entity.additional_properties}</Text>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span>
                        <Text type="secondary">相关度: </Text>
                        <Badge
                            count={entity.rank || 0}
                            showZero
                            style={{ backgroundColor: '#52c41a' }}
                        />
                    </span>
                </div>
            </div>
        </Card>
    )

    const renderHyperedgeCard = (hyperedge, index) => (
        <Card
            key={index}
            size="small"
            className="mb-2"
            title={
                <Space>
                    <ShareAltOutlined className="text-green-500" />
                    <Text strong>超边 #{index + 1}</Text>
                </Space>
            }
        >
            <div className="text-sm">
                <div className="mb-2">
                    <Text type="secondary">连接实体: </Text>
                    <div className="mt-1">
                        {Array.isArray(hyperedge.entity_set)
                            ? hyperedge.entity_set.map((entity, idx) => (
                                <Tag key={idx} color="green" size="small" className="mb-1">
                                    {entity}
                                </Tag>
                            ))
                            : <Tag color="green" size="small">{hyperedge.entity_set}</Tag>
                        }
                    </div>
                </div>

                {hyperedge.description && (
                    <div className="mb-2">
                        <Text type="secondary">描述: </Text>
                        <Paragraph
                            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                            className="mb-1"
                        >
                            {hyperedge.description}
                        </Paragraph>
                    </div>
                )}

                {hyperedge.keywords && (
                    <div className="mb-2">
                        <Text type="secondary">关键词: </Text>
                        <Text italic>{hyperedge.keywords}</Text>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <span>
                        <Text type="secondary">权重: </Text>
                        <Tag color="orange">{hyperedge.weight || 0}</Tag>
                    </span>
                    <span>
                        <Text type="secondary">相关度: </Text>
                        <Badge
                            count={hyperedge.rank || 0}
                            showZero
                            style={{ backgroundColor: '#52c41a' }}
                        />
                    </span>
                </div>
            </div>
        </Card>
    )

    const renderTextUnit = (textUnit, index) => (
        <Card
            key={index}
            size="small"
            className="mb-2"
            title={
                <Space>
                    <FileTextOutlined className="text-purple-500" />
                    <Text strong>文档片段 #{index + 1}</Text>
                </Space>
            }
        >
            <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                className="text-sm mb-0"
            >
                {textUnit.content}
            </Paragraph>
        </Card>
    )

    const panelItems = []

    // 超边面板
    if (hyperedges.length > 0) {
        panelItems.push({
            key: 'hyperedges',
            label: (
                <Space>
                    <ShareAltOutlined className="text-green-500" />
                    <span>检索到的超边</span>
                    <Badge count={hyperedges.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
            ),
            children: (
                <div className="max-h-80 overflow-y-auto">
                    {hyperedges.map(renderHyperedgeCard)}
                </div>
            )
        })
    }

    // 实体面板
    if (entities.length > 0) {
        panelItems.push({
            key: 'entities',
            label: (
                <Space>
                    <NodeIndexOutlined className="text-blue-500" />
                    <span>检索到的实体</span>
                    <Badge count={entities.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
            ),
            children: (
                <div className="max-h-80 overflow-y-auto">
                    {entities.map(renderEntityCard)}
                </div>
            )
        })
    }

    // 文档片段面板
    if (textUnits.length > 0) {
        panelItems.push({
            key: 'textUnits',
            label: (
                <Space>
                    <FileTextOutlined className="text-purple-500" />
                    <span>检索到的文档</span>
                    <Badge count={textUnits.length} style={{ backgroundColor: '#722ed1' }} />
                </Space>
            ),
            children: (
                <div className="max-h-80 overflow-y-auto">
                    {textUnits.map(renderTextUnit)}
                </div>
            )
        })
    }

    return (
        <div className={`mt-4 ${className}`}>
            <div className="mb-3 flex items-center">
                <DatabaseOutlined className="text-gray-500 mr-2" />
                <Text strong className="text-gray-700">检索信息详情</Text>
                <Tooltip title="展开查看详细的实体、超边和文档信息">
                    <InfoCircleOutlined className="text-gray-400 ml-1" />
                </Tooltip>
            </div>

            <Collapse
                items={panelItems}
                activeKey={activeKey}
                onChange={setActiveKey}
                size="small"
                className="bg-gray-50"
            />
        </div>
    )
}

export default RetrievalInfo