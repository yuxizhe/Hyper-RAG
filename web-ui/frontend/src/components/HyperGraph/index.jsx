import React, { useEffect, useMemo, useState } from 'react';
import { Graphin } from '@antv/graphin';
import { Spin, message } from 'antd';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const colors = [
    '#F6BD16',
    '#00C9C9',
    '#F08F56',
    '#D580FF',
    '#FF3D00',
    '#16f69c',
    '#004ac9',
    '#f056d1',
    '#a680ff',
    '#c8ff00',
];

const HyperGraph = ({
    vertexId,
    height = '400px',
    width = '100%',
    showTooltip = true,
    containerStyle = {},
    graphId = 'hypergraph-viewer'
}) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(false);

    // 获取vertex邻居数据
    const fetchVertexNeighbor = async (vId) => {
        if (!vId) return;

        setLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/db/vertices_neighbor/${encodeURIComponent(vId)}`);
            if (!response.ok) {
                throw new Error(`API failed: ${response.status}`);
            }
            const neighborData = await response.json();
            setData(neighborData);
        } catch (error) {
            console.error('Failed to fetch vertex neighbor:', error);
            message.error(`获取图数据失败: ${error.message}`);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (vertexId) {
            fetchVertexNeighbor(vertexId);
        }
    }, [vertexId]);

    const options = useMemo(() => {
        let hyperData = {
            nodes: [],
            edges: [],
        };
        let plugins = [];

        if (data) {
            // 添加顶点
            for (const key in data.vertices) {
                hyperData.nodes.push({
                    id: key,
                    label: key,
                    ...data.vertices[key],
                });
            }

            // 创建样式函数
            const createStyle = (baseColor) => ({
                fill: baseColor,
                stroke: baseColor,
                labelFill: '#fff',
                labelPadding: 2,
                labelBackgroundFill: baseColor,
                labelBackgroundRadius: 5,
                labelPlacement: 'center',
                labelAutoRotate: false,
                // bubblesets配置
                maxRoutingIterations: 100,
                maxMarchingIterations: 20,
                pixelGroup: 4,
                edgeR0: 10,
                edgeR1: 60,
                nodeR0: 15,
                nodeR1: 50,
                morphBuffer: 10,
                threshold: 1,
                memberInfluenceFactor: 1,
                edgeInfluenceFactor: 1,
                nonMemberInfluenceFactor: -0.8,
                virtualEdges: true,
            });

            // 添加超边
            const edgeKeys = Object.keys(data.edges);
            for (let i = 0; i < edgeKeys.length; i++) {
                const key = edgeKeys[i];
                const edge = data.edges[key];
                const nodes = key.split('|#|');

                plugins.push({
                    key: `bubble-sets-${key}`,
                    type: 'bubble-sets',
                    members: nodes,
                    labelText: edge.keywords || '',
                    ...createStyle(colors[i % colors.length]),
                });
            }

            // 添加tooltip插件
            if (showTooltip) {
                plugins.push({
                    type: 'tooltip',
                    getContent: (e, items) => {
                        let result = '';
                        items.forEach((item) => {
                            result += `<h4>${item.id}</h4>`;
                            if (item.entity_type) {
                                result += `<p><strong>类型:</strong> ${item.entity_type}</p>`;
                            }
                            if (item.description) {
                                result += `<p><strong>描述:</strong> ${item.description.split('<SEP>').slice(0, 2).join('；')}</p>`;
                            }
                        });
                        return result;
                    },
                });
            }
        }

        return {
            autoResize: true,
            data: hyperData,
            node: {
                palette: { field: 'cluster' },
                style: {
                    labelText: d => d.id,
                    fill: d => d.id === vertexId ? '#ff4d4f' : undefined, // 高亮当前查看的顶点
                    stroke: d => d.id === vertexId ? '#ff4d4f' : undefined,
                }
            },
            animate: false,
            behaviors: [
                'zoom-canvas',
                'drag-canvas',
                'drag-element',
            ],
            autoFit: 'center',
            layout: {
                type: 'force',
                clustering: true,
                preventOverlap: true,
                nodeClusterBy: 'entity_type',
                gravity: 20,
                linkDistance: 150,
            },
            plugins,
        };
    }, [data, vertexId, showTooltip]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height,
                ...containerStyle
            }}>
                <Spin size="large" tip="加载超图数据中..." />
            </div>
        );
    }

    if (!data || !vertexId) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height,
                color: '#999',
                ...containerStyle
            }}>
                {!vertexId ? '请选择一个顶点' : '暂无图数据'}
            </div>
        );
    }

    return (
        <div style={{ height, width, ...containerStyle }}>
            <Graphin
                options={options}
                id={graphId}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default HyperGraph; 