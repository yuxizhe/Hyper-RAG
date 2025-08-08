## 开发
pip install -r requirements.txt

fastapi dev main.py

Server started at http://127.0.0.1:8000

Documentation at http://127.0.0.1:8000/docs

source .venv/bin/activate
nohup fastapi run main.py > server.log 2>&1 &

## 测试
服务启动后，执行以下脚本：

```bash
# 认证相关接口测试（注册/登录/获取当前用户）
python3 test_auth_api.py

# HyperRAG 相关接口测试
python3 test_hyperrag_api.py

# 文件名生成数据库名的测试
python3 test_database_name.py
```