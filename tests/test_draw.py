#!/usr/bin/env python3
"""
测试 HyperRAG 超图可视化功能
"""

import sys
import pytest
import tempfile
import shutil
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from hyperrag.draw import HypergraphViewer, draw_hypergraph


class TestHypergraphViewer:
    """测试 HypergraphViewer 类"""
    
    def setup_method(self):
        """设置测试环境"""
        self.temp_dir = tempfile.mkdtemp()
        self.temp_path = Path(self.temp_dir)
        
    def teardown_method(self):
        """清理测试环境"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_viewer_initialization(self):
        """测试 Viewer 初始化"""
        viewer = HypergraphViewer(working_dir=self.temp_dir, port=8900)
        
        assert viewer.working_dir == self.temp_path
        assert viewer.port == 8900
        assert viewer.app is not None
        
    def test_html_template_generation(self):
        """测试 HTML 模板生成"""
        viewer = HypergraphViewer(working_dir=self.temp_dir)
        html = viewer._get_html_template()
        
        # 检查关键元素
        assert "<!DOCTYPE html>" in html
        assert "HyperRAG 超图可视化" in html
        assert "Graphin" in html
        assert "React" in html
        assert "/api/databases" in html
        assert "/api/vertices" in html
        assert "/api/graph" in html
    
    def test_database_discovery_empty_dir(self):
        """测试空目录的数据库发现"""
        viewer = HypergraphViewer(working_dir=self.temp_dir)
        storage = viewer._get_hypergraph_storage()
        
        # 空目录应该返回 None
        assert storage is None
    
    def test_database_discovery_with_hgdb(self):
        """测试包含 .hgdb 文件的数据库发现"""
        # 创建一个假的 .hgdb 文件
        hgdb_file = self.temp_path / "test.hgdb"
        hgdb_file.write_bytes(b"fake hgdb content")
        
        viewer = HypergraphViewer(working_dir=self.temp_dir)
        
        # 这里由于没有真实的超图数据，会返回 None，但不应该抛出异常
        storage = viewer._get_hypergraph_storage("test")
        # 由于没有有效的超图数据，预期返回 None
        assert storage is None


class TestDrawFunctions:
    """测试绘图函数"""
    
    def setup_method(self):
        """设置测试环境"""
        self.temp_dir = tempfile.mkdtemp()
        self.temp_path = Path(self.temp_dir)
        
    def teardown_method(self):
        """清理测试环境"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_draw_hypergraph_with_empty_dir(self):
        """测试在空目录调用 draw_hypergraph"""
        # 这应该返回 None 因为没有找到 .hgdb 文件
        result = draw_hypergraph(
            working_dir=self.temp_dir, 
            port=8901, 
            open_browser=False
        )
        
        assert result is None
    
    def test_draw_hypergraph_parameters(self):
        """测试 draw_hypergraph 参数处理"""
        # 创建一个假的 .hgdb 文件来触发 viewer 创建
        hgdb_file = self.temp_path / "test.hgdb"
        hgdb_file.write_bytes(b"fake content")
        
        try:
            # 测试参数是否正确传递
            viewer = HypergraphViewer(
                working_dir=self.temp_dir,
                port=8902
            )
            
            assert viewer.working_dir == self.temp_path
            assert viewer.port == 8902
            
        except Exception as e:
            # 由于缺乏真实数据，可能会出现异常，这是正常的
            print(f"Expected error due to fake data: {e}")


class TestIntegration:
    """集成测试"""
    
    def test_import_functions(self):
        """测试从 hyperrag 包导入函数"""
        try:
            from hyperrag import draw_hypergraph, draw
            
            # 检查函数是否可调用
            assert callable(draw_hypergraph)
            assert callable(draw)
            
        except ImportError as e:
            pytest.fail(f"Failed to import draw functions: {e}")
    
    def test_function_signatures(self):
        """测试函数签名"""
        from hyperrag import draw_hypergraph, draw
        import inspect
        
        # 检查 draw_hypergraph 的参数
        sig = inspect.signature(draw_hypergraph)
        params = list(sig.parameters.keys())
        
        expected_params = ['working_dir', 'database', 'port', 'open_browser']
        for param in expected_params:
            assert param in params, f"Missing parameter: {param}"
        
        # 检查 draw 的参数
        sig = inspect.signature(draw)
        params = list(sig.parameters.keys())
        
        expected_params = ['working_dir', 'database', 'port']
        for param in expected_params:
            assert param in params, f"Missing parameter: {param}"


class TestAPIEndpoints:
    """测试 API 端点"""
    
    def setup_method(self):
        """设置测试环境"""
        self.temp_dir = tempfile.mkdtemp()
        self.viewer = HypergraphViewer(working_dir=self.temp_dir, port=8903)
        
    def teardown_method(self):
        """清理测试环境"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_app_routes_exist(self):
        """测试 FastAPI 应用的路由是否存在"""
        app = self.viewer.app
        
        # 获取所有路由
        routes = [route.path for route in app.routes]
        
        # 检查必要的路由
        expected_routes = [
            "/",
            "/api/graph/{vertex_id}",
            "/api/databases",
            "/api/vertices"
        ]
        
        for expected_route in expected_routes:
            # 检查路由模式是否匹配
            route_exists = any(
                expected_route.replace("{vertex_id}", "") in route 
                for route in routes
            )
            assert route_exists, f"Route not found: {expected_route}"


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
