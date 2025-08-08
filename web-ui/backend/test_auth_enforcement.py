#!/usr/bin/env python3
"""
鉴权要求测试：
 - 未登录：浏览类接口可访问；提问/上传/修改需 401
 - 登录后：提问/上传可访问

运行：python3 test_auth_enforcement.py
"""

import time
import json
import requests

BASE_URL = "http://localhost:8000"


def pretty(obj):
    try:
        return json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:
        return str(obj)


def get(url, **kwargs):
    return requests.get(f"{BASE_URL}{url}", timeout=10, **kwargs)


def post(url, **kwargs):
    return requests.post(f"{BASE_URL}{url}", timeout=30, **kwargs)


def test_public_endpoints():
    print("\n=== 公共接口（无需登录） ===")
    r = get("/databases")
    print("GET /databases →", r.status_code)
    assert r.ok

    r = get("/hyperrag/status")
    print("GET /hyperrag/status →", r.status_code)
    assert r.ok


def test_requires_auth():
    print("\n=== 需鉴权接口（未登录应 401） ===")
    r = post("/hyperrag/query", json={
        "question": "test",
        "mode": "hyper",
        "top_k": 1,
        "max_token_for_text_unit": 100,
        "max_token_for_entity_context": 50,
        "max_token_for_relation_context": 100,
        "only_need_context": False,
        "response_type": "Multiple Paragraphs",
        "database": None
    })
    print("POST /hyperrag/query (no token) →", r.status_code)
    assert r.status_code == 401

    files = {"files": ("hello.txt", b"hello world", "text/plain")}
    r = post("/files/upload", files=files)
    print("POST /files/upload (no token) →", r.status_code)
    assert r.status_code == 401


def register_and_login():
    username = f"auth_req_{int(time.time())}"
    password = "pwd123456"

    print("\n=== 注册并登录 ===")
    r = post("/auth/register", json={"username": username, "password": password})
    print("register →", r.status_code)
    assert r.ok, r.text

    data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "scope": "",
        "client_id": "",
        "client_secret": "",
    }
    r = post("/auth/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    print("login →", r.status_code)
    assert r.ok, r.text
    token = r.json().get("access_token")
    assert token
    return token


def test_protected_with_token(token: str):
    print("\n=== 携带 Token 访问受保护接口 ===")
    headers = {"Authorization": f"Bearer {token}"}
    # 选一个存在的数据库
    dbs = requests.get(f"{BASE_URL}/databases").json()
    database = dbs[0]['name'] if dbs else 'test'

    # 提问
    r = post("/hyperrag/query", headers=headers, json={
        "question": "测试问题",
        "mode": "hyper",
        "top_k": 1,
        "max_token_for_text_unit": 100,
        "max_token_for_entity_context": 50,
        "max_token_for_relation_context": 100,
        "only_need_context": False,
        "response_type": "Multiple Paragraphs",
        "database": database
    })
    print("POST /hyperrag/query (with token) →", r.status_code)
    # 允许 200（即便 success=False）
    assert r.status_code in (200, 500), r.text
    print(pretty(r.json() if r.headers.get('content-type','').startswith('application/json') else r.text))

    # 上传文件
    files = {"files": ("hello.txt", b"hello world", "text/plain")}
    r = post("/files/upload", headers=headers, files=files)
    print("POST /files/upload (with token) →", r.status_code)
    assert r.status_code in (200, 500), r.text
    if r.headers.get('content-type','').startswith('application/json'):
        print(pretty(r.json()))
    else:
        print(r.text)


def main():
    test_public_endpoints()
    test_requires_auth()
    token = register_and_login()
    test_protected_with_token(token)
    print("\n测试完成 ✅")


if __name__ == "__main__":
    main()


