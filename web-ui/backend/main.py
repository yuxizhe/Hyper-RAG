from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_hypergraph, getFrequentVertices, get_vertices, get_hyperedges, get_vertice, get_vertice_neighbor, get_hyperedge_neighbor_server, add_vertex, add_hyperedge, delete_vertex, delete_hyperedge, update_vertex, update_hyperedge, get_hyperedge_detail

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
    openai_client = OpenAI(api_key="your_api_key", base_url="your_api_url")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    response = openai_client.chat.completions.create(
        model="your_model", messages=messages, **kwargs
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