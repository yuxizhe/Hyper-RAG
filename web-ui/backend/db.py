from hyperdb import HypergraphDB

hg = HypergraphDB(storage_file="hypergraph_wukong.hgdb")

# 声明函数
def get_hypergraph():
    # 声明变量 赋值 hg.all_v
    all_v = hg.all_v
    # 声明变量 赋值 hg.all_e
    all_e = hg.all_e

    return get_all_detail(all_v, all_e)

def get_vertices():
    """
    获取vertices列表
    """
    all_v = hg.all_v
    return all_v

def getFrequentVertices():
    """
    获取频繁的vertices列表
    """
    all_v = hg.all_v

    frequent_vertices = []

    # 直接使用hg.all_e而不是调用get_hyperedges()
    all_e = hg.all_e
    for v in all_v:
        count = 0
        for e in all_e:
            if v in e:
                count += 1
        if count >= 2:
            frequent_vertices.append(v)

    return frequent_vertices

def get_vertice(vertex_id: str):
    """
    获取指定vertex的json
    """
    vertex = hg.v(vertex_id)
    return vertex

def get_hyperedges():
    """
    获取hyperedges列表（包含详细信息）
    """
    all_e = hg.all_e

    hyperedges = []
    for e in all_e:
        hyperedge_id = '|*|'.join(e)
        hyperedge_data = hg.e(e)
        
        # 构建返回数据
        edge_info = {
            'id': hyperedge_id,
            'vertices': list(e),
            'keywords': hyperedge_data.get('keywords', ''),
            'summary': hyperedge_data.get('summary', ''),
            'description': hyperedge_data.get('keywords', '')  # 使用keywords作为描述
        }
        hyperedges.append(edge_info)

    return hyperedges

def get_hyperedge(hyperedge_id: str):
    """
    获取指定hyperedge的json
    """
    hyperedge = hg.e(hyperedge_id)

    return hyperedge

def get_hyperedge_detail(vertices: list):
    """
    获取指定hyperedge的详细信息
    """
    try:
        # 转换为tuple
        edge_tuple = hg.encode_e(tuple(vertices))
        
        # 检查hyperedge是否存在
        if not hg.has_e(edge_tuple):
            raise Exception(f"Hyperedge does not exist")
        
        # 获取hyperedge数据
        hyperedge_data = hg.e(edge_tuple)
        
        return hyperedge_data
    except Exception as e:
        raise Exception(f"Failed to get hyperedge detail: {str(e)}")

def get_vertice_neighbor_inner(vertex_id: str):
    """
    获取指定vertex的neighbor

    todo: 查不到会报错 CLERGYMAN
    """
    try:
        n = hg.nbr_v(vertex_id)
    
        n.add(vertex_id)

        e = hg.nbr_e_of_v(vertex_id)
    except Exception:
        # 如果报错，返回空列表
        n = []
        e = []

    return (n,e)

def get_vertice_neighbor(vertex_id: str):
    """
    获取指定vertex的neighbor

    todo: 查不到会报错 CLERGYMAN
    """
    n, e = get_vertice_neighbor_inner(vertex_id)

    return get_all_detail(n, e)


def get_all_detail(all_v, all_e):
    """
    获取所有详情
    """
    # 循环遍历 all_v 每个元素 赋值为 hg.v
    nodes = {}
    for v in all_v:
        nodes[v] = hg.v(v)

    hyperedges = {}
    for e in all_e:
        data = hg.e(e)
        # data的 keywords 赋值
        data['keywords'] = data['keywords'].replace("<SEP>", ",")
        hyperedges['|#|'.join(e)] = data

    return { "vertices": nodes , "edges": hyperedges }

def get_hyperedge_neighbor_server(hyperedge_id: str):
    """
    获取指定hyperedge的neighbor
    """
    nodes = hyperedge_id.split("|#|")
    print(hyperedge_id)
    vertices = set()
    hyperedges = set()
    for node in nodes:
        n, e = get_vertice_neighbor_inner(node)
        # 这里的 n 是一个集合
        # 这里的 e 是一个集合
        # vertexs 增加n
        # hyperedges 增加e
        vertices.update(n)
        hyperedges.update(e)

    return get_all_detail(vertices, hyperedges)

def add_vertex(vertex_id: str, vertex_data: dict):
    """
    添加新的vertex
    """
    try:
        # 如果vertex已存在，抛出异常
        if hg.has_v(vertex_id):
            raise Exception(f"Vertex '{vertex_id}' already exists")
        
        # 添加vertex
        hg.add_v(vertex_id, vertex_data)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return hg.v(vertex_id)
    except Exception as e:
        raise Exception(f"Failed to add vertex: {str(e)}")

def add_hyperedge(vertices: list, hyperedge_data: dict):
    """
    添加新的hyperedge
    """
    try:
        # 检查所有vertices是否存在
        for vertex in vertices:
            if not hg.has_v(vertex):
                raise Exception(f"Vertex '{vertex}' does not exist")
        
        # 转换为tuple
        edge_tuple = hg.encode_e(tuple(vertices))
        
        # 如果hyperedge已存在，抛出异常
        if hg.has_e(edge_tuple):
            raise Exception(f"Hyperedge already exists")
        
        # 添加hyperedge
        hg.add_e(edge_tuple, hyperedge_data)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return hg.e(edge_tuple)
    except Exception as e:
        raise Exception(f"Failed to add hyperedge: {str(e)}")

def update_vertex(vertex_id: str, vertex_data: dict):
    """
    更新vertex信息
    """
    try:
        # 检查vertex是否存在
        if not hg.has_v(vertex_id):
            raise Exception(f"Vertex '{vertex_id}' does not exist")
        
        # 获取现有数据
        existing_data = hg.v(vertex_id)
        
        # 更新数据（只更新非空字段）
        for key, value in vertex_data.items():
            if value:  # 只更新非空值
                existing_data[key] = value
        
        # 移除旧的vertex并添加新的
        hg.remove_v(vertex_id)
        hg.add_v(vertex_id, existing_data)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return hg.v(vertex_id)
    except Exception as e:
        raise Exception(f"Failed to update vertex: {str(e)}")

def update_hyperedge(vertices: list, hyperedge_data: dict):
    """
    更新hyperedge信息
    """
    try:
        # 转换为tuple
        edge_tuple = hg.encode_e(tuple(vertices))
        
        # 检查hyperedge是否存在
        if not hg.has_e(edge_tuple):
            raise Exception(f"Hyperedge does not exist")
        
        # 获取现有数据
        existing_data = hg.e(edge_tuple)
        
        # 更新数据（只更新非空字段）
        for key, value in hyperedge_data.items():
            if value:  # 只更新非空值
                existing_data[key] = value
        
        # 移除旧的hyperedge并添加新的
        hg.remove_e(edge_tuple)
        hg.add_e(edge_tuple, existing_data)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return hg.e(edge_tuple)
    except Exception as e:
        raise Exception(f"Failed to update hyperedge: {str(e)}")

def delete_vertex(vertex_id: str):
    """
    删除vertex
    """
    try:
        # 检查vertex是否存在
        if not hg.has_v(vertex_id):
            raise Exception(f"Vertex '{vertex_id}' does not exist")
        
        # 删除vertex
        hg.remove_v(vertex_id)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return True
    except Exception as e:
        raise Exception(f"Failed to delete vertex: {str(e)}")

def delete_hyperedge(vertices: list):
    """
    删除hyperedge
    """
    try:
        # 转换为tuple
        edge_tuple = hg.encode_e(tuple(vertices))
        
        # 检查hyperedge是否存在
        if not hg.has_e(edge_tuple):
            raise Exception(f"Hyperedge does not exist")
        
        # 删除hyperedge
        hg.remove_e(edge_tuple)
        
        # 保存到文件
        hg.save(hg.storage_file)
        
        # 清除缓存
        hg._clear_cache()
        
        return True
    except Exception as e:
        raise Exception(f"Failed to delete hyperedge: {str(e)}")