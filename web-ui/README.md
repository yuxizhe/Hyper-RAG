# Hyper-RAG Web UI

## 功能介绍

### HyperDB 数据库管理页面

HyperDB页面提供了完整的超图数据库管理功能，包括：

#### Vertices 管理
- **查看所有vertices**：以表格形式展示所有顶点
- **添加vertex**：创建新的顶点，包含实体名称、类型、描述和附加属性
- **编辑vertex**：修改现有顶点的信息
- **删除vertex**：删除指定的顶点（会同时删除相关的hyperedges）
- **查看vertex详情**：查看顶点的完整信息

#### Hyperedges 管理
- **查看所有hyperedges**：以可视化标签形式展示所有超边
- **添加hyperedge**：创建新的超边，连接多个顶点
- **编辑hyperedge**：修改超边的关键词和摘要信息
- **删除hyperedge**：删除指定的超边

#### 数据统计
- 显示当前数据库中vertices和hyperedges的总数
- 实时更新统计信息

## API 接口

### Vertices 接口
- `GET /db/vertices` - 获取所有vertices列表
- `GET /db/vertices/{vertex_id}` - 获取指定vertex的详细信息
- `POST /db/vertices` - 创建新的vertex
- `PUT /db/vertices/{vertex_id}` - 更新vertex信息
- `DELETE /db/vertices/{vertex_id}` - 删除vertex

### Hyperedges 接口
- `GET /db/hyperedges` - 获取所有hyperedges列表
- `POST /db/hyperedges` - 创建新的hyperedge
- `PUT /db/hyperedges/{hyperedge_id}` - 更新hyperedge信息
- `DELETE /db/hyperedges/{hyperedge_id}` - 删除hyperedge

## 启动说明

### 后端启动
```bash
cd web-ui/backend
pip install -r requirements.txt
fastapi dev main.py
```

### 前端启动
```bash
cd web-ui/frontend
npm install
npm run dev
```

## 使用说明

1. **访问页面**：启动前后端服务后，访问 `http://localhost:5173/Hyper/DB`

2. **管理Vertices**：
   - 点击"添加Vertex"按钮创建新顶点
   - 填写必要的信息：Vertex ID（唯一标识）、实体名称、类型、描述等
   - 使用操作按钮进行查看、编辑、删除操作

3. **管理Hyperedges**：
   - 点击"添加Hyperedge"按钮创建新超边
   - 输入要连接的vertices（用逗号分隔）
   - 添加关键词和摘要信息

4. **数据格式说明**：
   - 描述和附加属性支持多个值，使用`<SEP>`分隔
   - Vertices在hyperedge中用逗号分隔输入

## 注意事项

- 删除vertex时会同时删除所有包含该vertex的hyperedges
- Vertex ID必须唯一，不能重复
- 创建hyperedge时，所有相关的vertices必须已存在
- 数据会自动保存到`.hgdb`文件中

## 技术栈

- **前端**：React + Ant Design + Vite
- **后端**：FastAPI + HypergraphDB
- **数据库**：自定义超图数据库存储格式
