# 🚀 HyperRAG 超图可视化快速指南

## ⚡ 超快速开始 (3 行代码)

```python
from hyperrag import HyperRAG
hg = HyperRAG(working_dir="./caches")  # 指定数据目录
hg.draw()  # 启动可视化！
```

## 🎯 新方法详解

### 1. 创建实例并绘图

```python
from hyperrag import HyperRAG

# 创建 HyperRAG 实例
hg = HyperRAG(working_dir="./caches")

# 直接绘图 - 就这么简单！
hg.draw()
```

### 2. 自定义参数

```python
# 自定义端口
hg.draw(port=9000)

# 不自动打开浏览器
hg.draw(open_browser=False)

# 组合使用
hg.draw(port=8888, open_browser=False)
```

### 3. 完整示例

```python
from hyperrag import HyperRAG

# 创建实例并插入数据
hg = HyperRAG(working_dir="./my_data")
hg.insert("这是一段包含知识的文本...")

# 一行代码启动可视化
hg.draw()
```

## 📚 传统方法 (仍然支持)

### 1. 导入并使用

```python
from hyperrag import draw

# 一行代码启动超图可视化
draw()
```

### 2. 指定数据目录

```python
# 如果你的 .hgdb 文件在特定目录
draw('./caches')
draw('./web-ui/backend/hyperrag_cache')
```

### 3. 自定义端口

```python
# 避免端口冲突
draw('./caches', port=9000)
```

## 方法对比

### 🟢 新方法 - 实例绘图 (推荐)

```python
from hyperrag import HyperRAG

# 创建实例
hg = HyperRAG(working_dir="./caches")

# 直接绘图 - 简单直接！
hg.draw()
```

**优势:**

- 🎯 更直观：实例化时已确定数据源
- 🔧 更简洁：一行代码完成绘图
- 🛠️ 更一致：与 HyperRAG 的其他方法风格统一
- 📦 更封装：内部自动处理工作目录

### 🔴 传统方法 (仍然支持)

```python
from hyperrag import draw_hypergraph

viewer = draw_hypergraph(
    working_dir='./caches',    # 需要手动指定目录
    port=8899,
    open_browser=True
)
```

## 界面使用说明

### 左侧面板

- **数据库选择**: 下拉菜单切换不同的 .hgdb 文件
- **顶点列表**: 显示所有实体，按连接度排序
- **统计信息**: 当前数据库的顶点和超边数量

### 主视图

- **图形画布**: 显示超图网络
- **节点**: 代表实体，颜色表示类型
- **超边**: 用彩色气泡包围相关节点

### 交互操作

- **点击顶点**: 查看该顶点的邻居网络
- **鼠标悬停**: 显示实体详细信息
- **拖拽**: 移动节点调整布局
- **滚轮**: 缩放画布

## 颜色含义

| 实体类型     | 颜色    | 说明       |
| ------------ | ------- | ---------- |
| PERSON       | 🔵 青色 | 人物实体   |
| CONCEPT      | 🟣 紫色 | 概念实体   |
| ORGANIZATION | 🟠 橙色 | 组织机构   |
| LOCATION     | 🟢 绿色 | 地理位置   |
| EVENT        | 🔷 蓝色 | 事件实体   |
| PRODUCT      | 🟨 粉色 | 产品实体   |
| 其他         | ⚪ 灰色 | 未分类实体 |

## 故障排除

### 问题 1: 找不到数据库文件

```
❌ 未找到任何超图数据库文件 (.hgdb)
```

**解决方案**:

- 检查目录是否包含 .hgdb 文件
- 尝试运行 HyperRAG 生成数据
- 使用绝对路径指定目录

### 问题 2: 端口被占用

```
Error: [Errno 48] Address already in use
```

**解决方案**:

```python
draw('./caches', port=9000)  # 使用不同端口
```

### 问题 3: 浏览器未自动打开

**解决方案**:
手动访问 `http://localhost:8899`

## 高级用法

### 在 Jupyter 中使用 (新方法)

```python
from hyperrag import HyperRAG
import threading

# 创建实例
hg = HyperRAG(working_dir="./caches")

# 后台启动绘图
def start_viewer():
    hg.draw()

thread = threading.Thread(target=start_viewer, daemon=True)
thread.start()

# 显示链接
from IPython.display import HTML
HTML('<a href="http://localhost:8899" target="_blank">打开超图可视化</a>')
```

### 在 Jupyter 中使用 (传统方法)

```python
import threading
from hyperrag import draw

def start_server():
    draw('./caches')

# 后台启动
thread = threading.Thread(target=start_server, daemon=True)
thread.start()

# 显示链接
from IPython.display import HTML
HTML('<a href="http://localhost:8899" target="_blank">打开可视化</a>')
```

### 程序化访问

```python
from hyperrag.draw import HypergraphViewer

viewer = HypergraphViewer('./caches')

# 不自动打开浏览器
server_thread = viewer.start_server(open_browser=False)

print("服务器启动在: http://localhost:8899")
# 继续其他操作...
```

### 批量查看多个数据库

```python
import threading

databases = [
    ('./cache1', 8901),
    ('./cache2', 8902),
    ('./cache3', 8903)
]

for db_path, port in databases:
    thread = threading.Thread(
        target=lambda: draw_hypergraph(db_path, port=port),
        daemon=True
    )
    thread.start()
    print(f"数据库 {db_path} 可视化: http://localhost:{port}")
```

## 性能提示

- 🚀 **响应速度**: 每次只加载选中顶点的邻居数据
- 💾 **内存使用**: 大型图会自动限制显示节点数量
- 🔄 **实时更新**: 切换顶点时动态加载新数据
- 📱 **移动友好**: 支持触摸屏操作

## 使用场景

### 📊 数据探索

探索知识图谱的整体结构和关键节点

### 🔍 关系分析

深入理解实体间的复杂多元关系

### ✅ 质量检查

验证数据完整性，发现异常连接

### 🎯 演示展示

向同事展示 HyperRAG 的强大能力

---

## 💡 快速使用提示

**新用户推荐流程:**

1. **最简单的方式** - 如果你已经有数据：

   ```python
   from hyperrag import HyperRAG
   hg = HyperRAG(working_dir="./your_data_dir")
   hg.draw()  # 就这么简单！
   ```

2. **从零开始**：

   ```python
   from hyperrag import HyperRAG
   hg = HyperRAG()
   hg.insert("你的文档内容...")
   hg.draw()
   ```

3. **查看完整演示**：运行 `python simple_draw_example.py`

**记住：现在只需要 `hg.draw()` 一行代码就能启动可视化！** 🚀
