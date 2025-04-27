




from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_hypergraph, getFrequentVertices, get_hyperedges, get_vertice, get_vertice_neighbor, get_hyperedge_neighbor_server

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
    data = getFrequentVertices()
    return data

@app.get("/db/hyperedges")
async def get_hypergraph_function():
    """
    获取hyperedges列表
    """
    data = get_hyperedges()
    return data

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