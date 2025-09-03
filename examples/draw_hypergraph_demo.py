#!/usr/bin/env python3
"""
HyperRAG 超图可视化演示

这个示例展示如何使用新的 draw_hypergraph 功能来可视化超图数据。
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from hyperrag import draw_hypergraph, draw


def demo_basic_usage():
    """基本使用示例"""
    print("=" * 60)
    print("🎨 HyperRAG 超图可视化演示")
    print("=" * 60)
    
    # 方法1：使用完整函数名
    print("\n📖 方法1: 使用 draw_hypergraph() 函数")
    print("代码示例:")
    print("    from hyperrag import draw_hypergraph")
    print("    viewer = draw_hypergraph(working_dir='./caches', port=8899)")
    
    # 方法2：使用简化函数名
    print("\n📖 方法2: 使用简化的 draw() 函数")
    print("代码示例:")
    print("    from hyperrag import draw")
    print("    draw('./caches')")
    
    print("\n🔍 查找可用的数据库文件...")
    
    # 查找项目中的 .hgdb 文件
    possible_dirs = [
        project_root / "caches",
        project_root / "web-ui" / "backend" / "hyperrag_cache",
        project_root,  # 当前目录
    ]
    
    found_files = []
    for dir_path in possible_dirs:
        if dir_path.exists():
            hgdb_files = list(dir_path.rglob("*.hgdb"))
            for hgdb_file in hgdb_files:
                found_files.append(hgdb_file)
    
    if found_files:
        print(f"✅ 找到 {len(found_files)} 个超图数据库文件:")
        for hgdb_file in found_files:
            size = hgdb_file.stat().st_size / 1024
            rel_path = hgdb_file.relative_to(project_root)
            print(f"  - {rel_path} ({size:.1f}KB)")
        
        print("\n🚀 启动可视化服务器...")
        print("选择第一个找到的数据库目录进行演示")
        
        # 使用第一个找到的文件的目录
        demo_dir = found_files[0].parent
        print(f"📁 使用目录: {demo_dir}")
        
        # 启动可视化
        try:
            draw_hypergraph(working_dir=str(demo_dir), port=8899)
        except KeyboardInterrupt:
            print("\n✅ 演示结束")
    else:
        print("❌ 未找到任何 .hgdb 文件")
        print("\n💡 提示:")
        print("  1. 请先运行 HyperRAG 来生成超图数据")
        print("  2. 或者使用 web-ui 上传文档并进行嵌入")
        print("  3. 确保工作目录中包含 .hgdb 文件")
        
        print("\n📝 手动创建示例超图数据:")
        create_example_data()


def create_example_data():
    """创建示例超图数据"""
    print("\n正在创建示例超图数据...")
    
    try:
        from hyperrag.storage import HypergraphStorage
        
        # 创建示例目录
        example_dir = project_root / "examples" / "example_hypergraph"
        example_dir.mkdir(exist_ok=True, parents=True)
        
        # 创建超图存储
        hg_storage = HypergraphStorage(
            namespace="example",
            global_config={
                "working_dir": str(example_dir),
                "embedding_func": None,
                "storage_file": str(example_dir / "example.hgdb")
            }
        )
        
        # 添加示例顶点
        entities = [
            ("张三", {"entity_type": "PERSON", "description": "一个示例人物"}),
            ("李四", {"entity_type": "PERSON", "description": "另一个示例人物"}),
            ("北京", {"entity_type": "LOCATION", "description": "中国的首都"}),
            ("上海", {"entity_type": "LOCATION", "description": "中国的经济中心"}),
            ("会议", {"entity_type": "EVENT", "description": "一个重要的会议"}),
            ("项目", {"entity_type": "CONCEPT", "description": "一个重要项目"}),
        ]
        
        for entity_id, entity_data in entities:
            hg_storage.hg.add_v(entity_id, entity_data)
        
        # 添加示例超边
        hyperedges = [
            (["张三", "李四", "会议"], {"keywords": "参与会议", "summary": "张三和李四参与了会议"}),
            (["张三", "北京", "项目"], {"keywords": "在北京工作", "summary": "张三在北京进行项目工作"}),
            (["李四", "上海", "项目"], {"keywords": "在上海工作", "summary": "李四在上海进行项目工作"}),
            (["会议", "项目", "北京"], {"keywords": "项目会议", "summary": "在北京举行的项目会议"}),
        ]
        
        for vertices, edge_data in hyperedges:
            hg_storage.hg.add_e(vertices, edge_data)
        
        # 保存数据
        hg_storage.hg.save(hg_storage.hg.storage_file)
        
        print(f"✅ 示例数据已创建: {example_dir / 'example.hgdb'}")
        print(f"  - 顶点数: {len(entities)}")
        print(f"  - 超边数: {len(hyperedges)}")
        
        print("\n🚀 现在可以使用以下命令查看示例:")
        print(f"    draw_hypergraph('{example_dir}')")
        
        # 启动可视化
        print("\n正在启动可视化...")
        draw_hypergraph(working_dir=str(example_dir), port=8899)
        
    except Exception as e:
        print(f"❌ 创建示例数据失败: {e}")
        print("请检查 HyperRAG 模块是否正确安装")


def show_usage_examples():
    """显示使用示例"""
    print("\n" + "=" * 60)
    print("📚 使用方法和示例")
    print("=" * 60)
    
    examples = [
        {
            "title": "基本使用",
            "code": """
from hyperrag import draw

# 使用当前目录
draw()

# 指定工作目录
draw('./caches')

# 指定端口
draw('./caches', port=9000)
""",
        },
        {
            "title": "高级使用",
            "code": """
from hyperrag import draw_hypergraph

# 启动可视化服务器，不自动打开浏览器
viewer = draw_hypergraph(
    working_dir='./caches', 
    port=8899, 
    open_browser=False
)

# 手动获取服务器 URL
print(f"访问: http://localhost:8899")
""",
        },
        {
            "title": "在 Jupyter Notebook 中使用",
            "code": """
from hyperrag import draw
import threading

# 在后台启动服务器
def start_viewer():
    draw('./caches')

thread = threading.Thread(target=start_viewer, daemon=True)
thread.start()

# 在 notebook 中显示链接
from IPython.display import HTML
HTML('<a href="http://localhost:8899" target="_blank">打开超图可视化</a>')
""",
        },
    ]
    
    for example in examples:
        print(f"\n🔹 {example['title']}:")
        print(example['code'])
    
    print("\n💡 功能特性:")
    features = [
        "🎨 美观的现代化界面设计",
        "🔍 支持多数据库切换",
        "📊 实时显示超图统计信息", 
        "🎯 点击顶点查看邻居关系",
        "🏷️ 智能的实体类型颜色编码",
        "💬 鼠标悬停显示详细信息",
        "🔧 基于 Graphin 的强大图形渲染",
        "⚡ FastAPI 后端，响应快速",
    ]
    
    for feature in features:
        print(f"  {feature}")


if __name__ == "__main__":
    try:
        show_usage_examples()
        demo_basic_usage()
    except KeyboardInterrupt:
        print("\n👋 再见！")
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        print("请确保已正确安装 HyperRAG 及其依赖")
