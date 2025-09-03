import os
import webbrowser
import threading
import json
from pathlib import Path
from typing import Dict, Any
import http.server
import socketserver
from urllib.parse import urlparse

from .hypergraph import HypergraphDB


class HypergraphViewer:
    """超图可视化工具"""
    
    def __init__(self, hypergraph_db: HypergraphDB, port: int = 8899):
        self.hypergraph_db = hypergraph_db
        self.port = port
        self.html_content = self._generate_html_with_data()
        
    def _generate_html_with_data(self):
        """生成包含数据的HTML内容"""
        # 获取所有数据
        database_info = {
            "name": "current_hypergraph",
            "vertices": self.hypergraph_db.num_v,
            "edges": self.hypergraph_db.num_e
        }
        
        # 获取顶点列表
        vertices = list(self.hypergraph_db.all_v)[:100]
        vertex_data = []
        
        for v_id in vertices:
            v_data = self.hypergraph_db.v(v_id, {})
            vertex_data.append({
                "id": v_id,
                "degree": self.hypergraph_db.degree_v(v_id),
                "entity_type": v_data.get("entity_type", ""),
                "description": v_data.get("description", "")[:100] + "..." if len(v_data.get("description", "")) > 100 else v_data.get("description", "")
            })
        
        # 按度数排序
        vertex_data.sort(key=lambda x: x["degree"], reverse=True)
        
        # 获取所有顶点的图数据
        graph_data = {}
        for vertex in vertex_data:
            vertex_id = vertex["id"]
            graph_data[vertex_id] = self._get_vertex_neighbor_data(self.hypergraph_db, vertex_id)
        
        # 嵌入数据到HTML
        return self._get_html_template(database_info, vertex_data, graph_data)
    

    def _get_vertex_neighbor_data(self, hypergraph_db: HypergraphDB, vertex_id: str) -> Dict[str, Any]:
        """获取顶点邻居数据"""
        hg = hypergraph_db
        
        if not hg.has_v(vertex_id):
            raise ValueError(f"Vertex {vertex_id} not found")
        
        # 获取顶点的所有邻居超边
        neighbor_edges = hg.nbr_e_of_v(vertex_id)
        
        # 收集所有相关的顶点
        all_vertices = {vertex_id}
        edges_data = {}
        
        for edge_tuple in neighbor_edges:
            # 添加超边中的所有顶点
            all_vertices.update(edge_tuple)
            
            # 获取超边数据
            edge_data = hg.e(edge_tuple, {})
            edge_key = "|#|".join(str(item) for item in edge_tuple)
            edges_data[edge_key] = {
                "keywords": edge_data.get("keywords", ""),
                "summary": edge_data.get("summary", ""),
                "weight": len(edge_tuple)  # 超边的权重等于包含的顶点数
            }
        
        # 获取所有顶点的数据
        vertices_data = {}
        for v_id in all_vertices:
            v_data = hg.v(v_id, {})
            vertices_data[v_id] = {
                "entity_name": v_data.get("entity_name", v_id),
                "entity_type": v_data.get("entity_type", ""),
                "description": v_data.get("description", ""),
                "additional_properties": v_data.get("additional_properties", "")
            }
        
        return {
            "vertices": vertices_data,
            "edges": edges_data
        }
    
    def _get_html_template(self, database_info: Dict, vertex_data: list, graph_data: Dict) -> str:
        """获取包含数据的HTML模板"""
        # 将数据序列化为JSON字符串
        embedded_data = {
            "database": database_info,
            "vertices": vertex_data,
            "graphs": graph_data
        }
        data_json = json.dumps(embedded_data, ensure_ascii=False)
        
        return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperRAG 超图可视化</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/antv-x6/1.1.1/x6.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            padding: 20px;
            overflow-y: auto;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }
        
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
        }
        
        .header {
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .graph-container {
            flex: 1;
            position: relative;
            background: rgba(255, 255, 255, 0.9);
            margin: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            font-size: 18px;
            color: #666;
        }
        
        .vertex-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: white;
        }
        
        .vertex-item {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .vertex-item:hover {
            background-color: #f8f9fa;
        }
        
        .vertex-item.selected {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        
        .vertex-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
        }
        
        .vertex-meta {
            font-size: 12px;
            color: #666;
        }
        
        select, button {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
        }
        
        button {
            background: #2196f3;
            color: white;
            border: none;
        }
        
        button:hover {
            background: #1976d2;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #333;
            border-bottom: 2px solid #2196f3;
            padding-bottom: 5px;
        }
        
        .database-info {
            background: #e8f5e8;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 10px;
            border-radius: 5px;
            margin: 10px;
            border-left: 4px solid #f44336;
        }
        
        .graph-stats {
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 15px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo } = React;
        const { Graphin } = window.Graphin;

        // 嵌入的数据
        const embeddedData = """ + data_json + """;

        // 颜色配置
        const colors = [
            '#F6BD16', '#00C9C9', '#F08F56', '#D580FF', '#FF3D00',
            '#16f69c', '#004ac9', '#f056d1', '#a680ff', '#c8ff00'
        ];

        const entityTypeColors = {
            'PERSON': '#00C9C9',
            'CONCEPT': '#a68fff',
            'ORGANIZATION': '#F08F56',
            'LOCATION': '#16f69c',
            'EVENT': '#004ac9',
            'PRODUCT': '#f056d1'
        };

        function HyperGraphViewer() {
            const [databases, setDatabases] = useState([embeddedData.database]);
            const [vertices, setVertices] = useState(embeddedData.vertices);
            const [selectedVertex, setSelectedVertex] = useState(embeddedData.vertices.length > 0 ? embeddedData.vertices[0].id : '');
            const [graphData, setGraphData] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');

            // 数据已经嵌入，不需要加载
            // useEffect 留空以保持结构

                        // 顶点数据已经嵌入，不需要加载
            // useEffect 留空以保持结构

                        // 加载图数据（从嵌入数据获取）
            useEffect(() => {
                if (selectedVertex) {
                    setLoading(true);
                    setError('');
                    
                    // 从嵌入数据获取图数据
                    const data = embeddedData.graphs[selectedVertex];
                    if (data) {
                        setGraphData(data);
                    } else {
                        setError('未找到该顶点的图数据');
                    }
                    setLoading(false);
                }
            }, [selectedVertex]);

            // 转换数据为 Graphin 格式
            const graphinOptions = useMemo(() => {
                if (!graphData) return null;

                const hyperData = { nodes: [], edges: [] };
                const plugins = [];

                // 添加顶点
                for (const [key, value] of Object.entries(graphData.vertices)) {
                    hyperData.nodes.push({
                        id: key,
                        label: key,
                        ...value
                    });
                }

                // 创建样式函数
                const createStyle = (baseColor) => ({
                    fill: baseColor,
                    stroke: baseColor,
                    maxRoutingIterations: 100,
                    maxMarchingIterations: 20,
                    pixelGroup: 4,
                    edgeR0: 10,
                    edgeR1: 60,
                    nodeR0: 15,
                    nodeR1: 50,
                    morphBuffer: 10,
                    threshold: 4,
                    memberInfluenceFactor: 1,
                    edgeInfluenceFactor: 4,
                    nonMemberInfluenceFactor: -0.8,
                    virtualEdges: true,
                });

                // 添加超边
                const edgeKeys = Object.keys(graphData.edges);
                for (let i = 0; i < edgeKeys.length; i++) {
                    const key = edgeKeys[i];
                    const edge = graphData.edges[key];
                    const nodes = key.split('|#|');

                    plugins.push({
                        key: `bubble-sets-${key}`,
                        type: 'bubble-sets',
                        members: nodes,
                        ...createStyle(colors[i % colors.length]),
                    });
                }

                // 添加tooltip插件
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
                                const desc = item.description.split('<SEP>').slice(0, 2).join('；');
                                result += `<p><strong>描述:</strong> ${desc}</p>`;
                            }
                        });
                        return result;
                    },
                });

                return {
                    autoResize: true,
                    data: hyperData,
                    node: {
                        palette: { field: 'cluster' },
                        style: {
                            size: 25,
                            labelText: d => d.id,
                            fill: d => {
                                if (d.id === selectedVertex) {
                                    return 'black';
                                }
                                if (d.entity_type) {
                                    return entityTypeColors[d.entity_type] || '#8566CC';
                                }
                                return '#8566CC';
                            },
                        }
                    },
                    edge: {
                        style: {
                            size: 2,
                        }
                    },
                    animate: false,
                    behaviors: ['zoom-canvas', 'drag-canvas', 'drag-element'],
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
            }, [graphData, selectedVertex]);

            return (
                <div className="container">
                    <div className="sidebar">
                        <h2 style={{margin: '0 0 20px 0', color: '#333'}}>🕸️ HyperRAG</h2>
                        
                        <div className="section-title">数据库信息</div>
                        <div className="database-info">
                            <strong>顶点数量:</strong> {embeddedData.database.vertices}<br/>
                            <strong>超边数量:</strong> {embeddedData.database.edges}<br/>
                            <strong>显示顶点:</strong> {vertices.length}
                        </div>

                        <div className="section-title">顶点列表</div>
                        <div className="vertex-list">
                            {vertices.map(vertex => (
                                <div 
                                    key={vertex.id}
                                    className={`vertex-item ${selectedVertex === vertex.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedVertex(vertex.id)}
                                >
                                    <div className="vertex-name">{vertex.id}</div>
                                    <div className="vertex-meta">
                                        类型: {vertex.entity_type || '未知'} | 度数: {vertex.degree}
                                        {vertex.description && (
                                            <div style={{marginTop: '4px', fontSize: '11px', color: '#888'}}>
                                                {vertex.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="header">
                            <h3 style={{margin: 0}}>
                                超图可视化 {selectedVertex && `- ${selectedVertex}`}
                            </h3>
                            {graphData && (
                                <div className="graph-stats">
                                    顶点: {Object.keys(graphData.vertices).length} | 
                                    超边: {Object.keys(graphData.edges).length}
                                </div>
                            )}
                        </div>

                        <div className="graph-container">
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                            
                            {loading && (
                                <div className="loading">
                                    <div>
                                        <div>🔄 加载超图数据中...</div>
                                        <div style={{fontSize: '14px', marginTop: '10px', textAlign: 'center'}}>
                                            这可能需要几秒钟
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!loading && !error && graphinOptions && (
                                <Graphin
                                    options={graphinOptions}
                                    style={{width: '100%', height: '100%'}}
                                />
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<HyperGraphViewer />, document.getElementById('root'));
    </script>
</body>
</html>"""

    def start_server(self, open_browser: bool = True):
        """启动简单HTTP服务器"""
        
        class CustomHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
            def __init__(self, html_content, *args, **kwargs):
                self.html_content = html_content
                super().__init__(*args, **kwargs)
                
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(self.html_content.encode('utf-8'))
                
            def log_message(self, format, *args):
                # 禁止输出日志
                pass
        
        def run_server():
            handler = lambda *args, **kwargs: CustomHTTPRequestHandler(self.html_content, *args, **kwargs)
            with socketserver.TCPServer(("127.0.0.1", self.port), handler) as httpd:
                httpd.serve_forever()
        
        # 在新线程中启动服务器
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        if open_browser:
            # 等待服务器启动
            import time
            time.sleep(1)
            
            # 打开浏览器
            url = f"http://127.0.0.1:{self.port}"
            print(f"🚀 超图可视化服务器已启动: {url}")
            webbrowser.open(url)
        
        return server_thread


def draw_hypergraph(hypergraph_db: HypergraphDB, port: int = 8899, open_browser: bool = True):
    """
    绘制超图的主函数
    
    Args:
        hypergraph_db: HypergraphDB 实例
        port: 服务器端口
        open_browser: 是否自动打开浏览器
    
    Returns:
        HypergraphViewer 实例
    """
    print("🎨 正在启动超图可视化...")
    print(f"📁 顶点数: {hypergraph_db.num_v}, 超边数: {hypergraph_db.num_e}")
    
    viewer = HypergraphViewer(hypergraph_db=hypergraph_db, port=port)
    
    # 启动服务器
    server_thread = viewer.start_server(open_browser=open_browser)
    
    try:
        print("⌨️  按 Ctrl+C 停止服务器")
        # 保持主线程运行
        server_thread.join()
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    
    return viewer


# 便捷函数
def draw(hypergraph_db: HypergraphDB, port: int = 8899):
    """
    便捷的超图绘制函数
    
    Args:
        hypergraph_db: HypergraphDB 实例
        port: 服务器端口
    """
    return draw_hypergraph(hypergraph_db, port, True)
