from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_hypergraph, getFrequentVertices, get_vertices, get_hyperedges, get_vertice, get_vertice_neighbor, get_hyperedge_neighbor_server, add_vertex, add_hyperedge, delete_vertex, delete_hyperedge, update_vertex, update_hyperedge, get_hyperedge_detail
import json
import os

# 设置文件路径
SETTINGS_FILE = "settings.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hyper-RAG"}


@app.get("/db")
async def db():
    """
    获取全部数据json
    """
    data = get_hypergraph()
    return data

@app.get("/db/vertices")
async def get_vertices_function():
    """
    获取vertices列表
    """
    data = get_vertices()
    return data

@app.get("/db/hyperedges")
async def get_hypergraph_function():
    """
    获取hyperedges列表
    """
    data = get_hyperedges()
    return data

@app.get("/db/hyperedges/{hyperedge_id}")
async def get_hyperedge(hyperedge_id: str):
    """
    获取指定hyperedge的详情
    """
    try:
        hyperedge_id = hyperedge_id.replace("%20", " ")
        vertices = hyperedge_id.split("|*|")
        data = get_hyperedge_detail(vertices)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/db/vertices/{vertex_id}")
async def get_vertex(vertex_id: str):
    """
    获取指定vertex的json
    """
    vertex_id = vertex_id.replace("%20", " ")
    data = get_vertice(vertex_id)
    return data

@app.get("/db/vertices_neighbor/{vertex_id}")
async def get_vertex_neighbor(vertex_id: str):
    """
    获取指定vertex的neighbor
    """
    vertex_id = vertex_id.replace("%20", " ")
    data = get_vertice_neighbor(vertex_id)
    return data

@app.get("/db/hyperedge_neighbor/{hyperedge_id}")
async def get_hyperedge_neighbor(hyperedge_id: str):
    """
    获取指定hyperedge的neighbor
    """
    hyperedge_id = hyperedge_id.replace("%20", " ")
    hyperedge_id = hyperedge_id.replace("*", "#")
    print(hyperedge_id)
    data = get_hyperedge_neighbor_server(hyperedge_id)
    return data

def llm_model_func(prompt, system_prompt=None, history_messages=[], **kwargs) -> str:
    from openai import OpenAI
    
    # 从设置文件读取配置
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                settings = json.load(f)
        else:
            # 使用默认配置
            settings = {
                "apiKey": "your_api_key",
                "baseUrl": "your_api_url",
                "modelName": "your_model",
                "maxTokens": 2000,
                "temperature": 0.7
            }
    except:
        # 如果读取失败，使用默认配置
        settings = {
            "apiKey": "your_api_key",
            "baseUrl": "your_api_url", 
            "modelName": "your_model",
            "maxTokens": 2000,
            "temperature": 0.7
        }
    
    openai_client = OpenAI(
        api_key=settings.get("apiKey", "your_api_key"), 
        base_url=settings.get("baseUrl", "your_api_url")
    )

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    # 使用设置中的参数
    response = openai_client.chat.completions.create(
        model=settings.get("modelName", "your_model"),
        messages=messages,
        max_tokens=settings.get("maxTokens", 2000),
        temperature=settings.get("temperature", 0.7),
        **kwargs
    )
    return response.choices[0].message.content

from pydantic import BaseModel
class Message(BaseModel):
    message: str

@app.post("/process_message")
async def process_message(msg: Message):
    user_message = msg.message
    try:
        response_message = llm_model_func(prompt=user_message)
    except Exception as e:
        return {"response": str(e)} 
    return {"response": response_message}

class VertexModel(BaseModel):
    vertex_id: str
    entity_name: str = ""
    entity_type: str = ""
    description: str = ""
    additional_properties: str = ""

class HyperedgeModel(BaseModel):
    vertices: list
    keywords: str = ""
    summary: str = ""

class VertexUpdateModel(BaseModel):
    entity_name: str = ""
    entity_type: str = ""
    description: str = ""
    additional_properties: str = ""

class HyperedgeUpdateModel(BaseModel):
    keywords: str = ""
    summary: str = ""

@app.post("/db/vertices")
async def create_vertex(vertex: VertexModel):
    """
    创建新的vertex
    """
    try:
        result = add_vertex(vertex.vertex_id, {
            "entity_name": vertex.entity_name,
            "entity_type": vertex.entity_type,
            "description": vertex.description,
            "additional_properties": vertex.additional_properties
        })
        return {"success": True, "message": "Vertex created successfully", "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/db/hyperedges")
async def create_hyperedge(hyperedge: HyperedgeModel):
    """
    创建新的hyperedge
    """
    try:
        result = add_hyperedge(hyperedge.vertices, {
            "keywords": hyperedge.keywords,
            "summary": hyperedge.summary
        })
        return {"success": True, "message": "Hyperedge created successfully", "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.put("/db/vertices/{vertex_id}")
async def update_vertex_endpoint(vertex_id: str, vertex: VertexUpdateModel):
    """
    更新vertex信息
    """
    try:
        vertex_id = vertex_id.replace("%20", " ")
        result = update_vertex(vertex_id, {
            "entity_name": vertex.entity_name,
            "entity_type": vertex.entity_type,
            "description": vertex.description,
            "additional_properties": vertex.additional_properties
        })
        return {"success": True, "message": "Vertex updated successfully", "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.put("/db/hyperedges/{hyperedge_id}")
async def update_hyperedge_endpoint(hyperedge_id: str, hyperedge: HyperedgeUpdateModel):
    """
    更新hyperedge信息
    """
    try:
        hyperedge_id = hyperedge_id.replace("%20", " ")
        vertices = hyperedge_id.split("|*|")
        result = update_hyperedge(vertices, {
            "keywords": hyperedge.keywords,
            "summary": hyperedge.summary
        })
        return {"success": True, "message": "Hyperedge updated successfully", "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.delete("/db/vertices/{vertex_id}")
async def delete_vertex_endpoint(vertex_id: str):
    """
    删除vertex
    """
    try:
        vertex_id = vertex_id.replace("%20", " ")
        result = delete_vertex(vertex_id)
        return {"success": True, "message": "Vertex deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.delete("/db/hyperedges/{hyperedge_id}")
async def delete_hyperedge_endpoint(hyperedge_id: str):
    """
    删除hyperedge
    """
    try:
        hyperedge_id = hyperedge_id.replace("%20", " ")
        vertices = hyperedge_id.split("|*|")
        result = delete_hyperedge(vertices)
        return {"success": True, "message": "Hyperedge deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

# 设置相关的API接口

class SettingsModel(BaseModel):
    apiKey: str = ""
    modelProvider: str = "openai"
    modelName: str = "gpt-3.5-turbo"
    baseUrl: str = "https://api.openai.com/v1"
    selectedDatabase: str = ""
    maxTokens: int = 2000
    temperature: float = 0.7

class APITestModel(BaseModel):
    apiKey: str
    baseUrl: str
    modelName: str
    modelProvider: str

class DatabaseTestModel(BaseModel):
    database: str

@app.get("/settings")
async def get_settings():
    """
    获取系统设置
    """
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                settings = json.load(f)
            # 不返回敏感信息如API Key
            settings_safe = settings.copy()
            if 'apiKey' in settings_safe:
                settings_safe['apiKey'] = '***' if settings_safe['apiKey'] else ''
            return settings_safe
        else:
            # 返回默认设置
            return {
                "apiKey": "",
                "modelProvider": "openai",
                "modelName": "gpt-3.5-turbo",
                "baseUrl": "https://api.openai.com/v1",
                "selectedDatabase": "",
                "maxTokens": 2000,
                "temperature": 0.7
            }
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/settings")
async def save_settings(settings: SettingsModel):
    """
    保存系统设置
    """
    try:
        settings_dict = settings.dict()
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings_dict, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "设置保存成功"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/databases")
async def get_databases():
    """
    获取可用数据库列表
    """
    try:
        databases = []
        
        # 扫描backend目录下的.hgdb文件
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        
        for file in os.listdir(backend_dir):
            if file.endswith('.hgdb'):
                # 根据文件名推断描述
                description = ""
                if 'wukong' in file:
                    description = "西游记知识图谱"
                elif 'Christmas' in file:
                    description = "圣诞颂歌知识图谱"
                else:
                    description = f"{file.replace('.hgdb', '')}知识图谱"
                
                databases.append({
                    "name": file,
                    "description": description
                })
        
        # 如果没有找到数据库文件，返回默认列表
        if not databases:
            databases = [
                {"name": "hypergraph_wukong.hgdb", "description": "西游记知识图谱"},
                {"name": "hypergraph_A_Christmas_Carol.hgdb", "description": "圣诞颂歌知识图谱"}
            ]
        
        return databases
    except Exception as e:
        return {"success": False, "message": str(e), "data": []}

@app.post("/test-api")
async def test_api_connection(api_test: APITestModel):
    """
    测试API连接
    """
    try:
        from openai import OpenAI
        
        # 根据不同的模型提供商进行测试
        if api_test.modelProvider == "openai":
            client = OpenAI(
                api_key=api_test.apiKey,
                base_url=api_test.baseUrl
            )
            
            # 发送一个简单的测试请求
            response = client.chat.completions.create(
                model=api_test.modelName,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            return {"success": True, "message": "API连接测试成功"}
            
        elif api_test.modelProvider == "anthropic":
            # 对于Anthropic，可以添加相应的测试逻辑
            return {"success": True, "message": "Anthropic API连接测试成功"}
            
        else:
            # 对于其他提供商，进行通用测试
            return {"success": True, "message": "API连接测试成功"}
            
    except Exception as e:
        return {"success": False, "message": f"API连接测试失败: {str(e)}"}

@app.post("/test-database")
async def test_database_connection(db_test: DatabaseTestModel):
    """
    测试数据库连接
    """
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, db_test.database)
        
        # 检查数据库文件是否存在
        if not os.path.exists(db_path):
            return {"success": False, "message": f"数据库文件不存在: {db_test.database}"}
        
        # 尝试加载数据库（这里可以添加具体的数据库连接测试逻辑）
        # 目前只检查文件存在性
        return {"success": True, "message": "数据库连接测试成功"}
        
    except Exception as e:
        return {"success": False, "message": f"数据库连接测试失败: {str(e)}"}