# 🎨 HyperRAG 超图可视化

HyperRAG 现在支持强大的超图可视化功能！只需一行代码，即可启动一个美观的 Web 界面来探索和分析你的超图数据。

## ✨ 功能特性

- 🎨 **现代化界面设计** - 基于 React + Graphin 的美观可视化
- 🔍 **多数据库支持** - 自动发现并支持切换多个 .hgdb 文件
- 📊 **实时统计信息** - 显示顶点数量、超边数量等关键指标
- 🎯 **交互式探索** - 点击顶点查看邻居关系网络
- 🏷️ **智能颜色编码** - 根据实体类型自动分配不同颜色
- 💬 **详细信息提示** - 鼠标悬停显示实体的详细描述
- ⚡ **高性能渲染** - 基于 FastAPI + Graphin 的快速响应
- 🌐 **Web 访问** - 在任何现代浏览器中使用

## 🚀 快速开始

### 基本使用

```python
from hyperrag import draw

# 使用当前目录的超图数据
draw()

# 指定工作目录
draw('./caches')

# 自定义端口
draw('./caches', port=9000)
```

### 高级使用

```python
from hyperrag import draw_hypergraph

# 启动可视化服务器（不自动打开浏览器）
viewer = draw_hypergraph(
    working_dir='./my_hyperrag_data',
    port=8899,
    open_browser=False
)

# 手动访问
print("访问: http://localhost:8899")
```

## 📋 系统要求

- Python 3.7+
- 已安装 HyperRAG 及其依赖
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 🔧 安装依赖

可视化功能需要以下额外依赖：

```bash
pip install fastapi uvicorn
```

这些依赖通常随 HyperRAG 一起安装。

## 📁 数据要求

可视化功能会自动查找工作目录中的 `.hgdb` 文件：

```
your_project/
├── caches/
│   ├── database1.hgdb  ✅
│   └── database2.hgdb  ✅
├── results/
│   └── analysis.hgdb   ✅
└── other_files/
```

## 🎮 使用指南

### 1. 启动可视化

```python
from hyperrag import draw
draw('./caches')
```

### 2. 界面概览

启动后会自动打开浏览器，显示可视化界面：

- **左侧边栏**: 数据库选择和顶点列表
- **主界面**: 超图可视化画布
- **顶部**: 当前图的统计信息

### 3. 探索数据

1. **选择数据库**: 在左侧下拉菜单中选择要查看的数据库
2. **浏览顶点**: 在顶点列表中查看所有实体，按度数排序
3. **查看关系**: 点击任一顶点查看其邻居关系网络
4. **查看详情**: 鼠标悬停在节点上查看详细信息

### 4. 视觉编码

- **节点颜色**: 根据实体类型自动分配
  - 🔵 人物 (PERSON) - 青色
  - 🟣 概念 (CONCEPT) - 紫色
  - 🟠 组织 (ORGANIZATION) - 橙色
  - 🟢 地点 (LOCATION) - 绿色
  - 🔷 事件 (EVENT) - 蓝色
  - 🟨 产品 (PRODUCT) - 粉色
- **节点大小**: 固定大小，确保清晰可见
- **超边**: 用彩色气泡包围相关节点

## 🔧 高级配置

### 自定义端口

```python
# 避免端口冲突
draw('./caches', port=9999)
```

### 在 Jupyter Notebook 中使用

```python
import threading
from hyperrag import draw

def start_viewer():
    draw('./caches')

# 在后台启动
thread = threading.Thread(target=start_viewer, daemon=True)
thread.start()

# 显示链接
from IPython.display import HTML
HTML('<a href="http://localhost:8899" target="_blank">🚀 打开超图可视化</a>')
```

### 程序化访问数据

```python
from hyperrag.draw import HypergraphViewer

viewer = HypergraphViewer('./caches')

# 获取数据库列表
databases = await viewer.app.get("/api/databases")

# 获取顶点数据
vertices = await viewer.app.get("/api/vertices?database=mydb")

# 获取图数据
graph_data = await viewer.app.get("/api/graph/entity_name?database=mydb")
```

## 🐛 故障排除

### 常见问题

1. **找不到 .hgdb 文件**

   ```
   ❌ 未找到任何超图数据库文件 (.hgdb)
   ```

   **解决方案**: 确保工作目录包含 HyperRAG 生成的 .hgdb 文件

2. **端口被占用**

   ```
   Error: [Errno 48] Address already in use
   ```

   **解决方案**: 使用不同端口 `draw('./caches', port=9000)`

3. **浏览器无法打开**
   - 手动访问 `http://localhost:8899`
   - 检查防火墙设置

### 性能优化

- **大型数据集**: 可视化会自动限制显示的顶点数量
- **内存使用**: 每次查询只加载需要的邻居数据
- **响应速度**: 使用异步 FastAPI 确保快速响应

## 🎯 使用场景

### 数据探索

- 快速了解超图的整体结构
- 发现关键节点和密集连接区域
- 分析实体类型的分布情况

### 关系分析

- 查看特定实体的关系网络
- 理解复杂的多元关系
- 追踪信息传播路径

### 质量检查

- 验证知识图谱的完整性
- 发现异常或孤立的节点
- 检查实体分类的准确性

### 演示展示

- 向团队展示 HyperRAG 的效果
- 制作数据驱动的演讲
- 创建交互式的数据故事

## 🔗 相关资源

- [HyperRAG 主文档](./README.md)
- [Web UI 使用指南](./web-ui/README.md)
- [示例代码](./examples/draw_hypergraph_demo.py)

## 💡 提示和技巧

1. **快速访问**: 可以直接调用 `draw()` 使用默认设置
2. **多窗口**: 可以同时启动多个端口查看不同数据库
3. **分享链接**: 可以将 `http://localhost:8899` 分享给同网络的其他用户
4. **截图保存**: 使用浏览器的截图功能保存可视化结果
5. **全屏模式**: 按 F11 进入全屏模式获得更好的查看体验

---

🎉 享受探索你的超图数据之旅！如有问题或建议，欢迎提出 Issue。
