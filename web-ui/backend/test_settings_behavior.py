#!/usr/bin/env python3
"""
设置接口行为测试：
 - 未登录：读写全局 settings.json（apiKey 返回为 ***）
 - 已登录：读写用户级设置存入 SQLite 表（apiKey 返回为 ***，数据库中保留明文）

运行：python3 test_settings_behavior.py
"""

import os
import time
import json
import requests
from typing import Optional
from sqlmodel import SQLModel, Field, Session, create_engine, select

BASE_URL = "http://localhost:8000"
DB_ABS_PATH = "/Users/yuxizhe/Hyper-RAG/web-ui/backend/auth.db"


class UserSetting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    data_json: str = "{}"


def pretty(obj):
    try:
        return json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:
        return str(obj)


def get(url, **kwargs):
    return requests.get(f"{BASE_URL}{url}", timeout=15, **kwargs)


def post(url, **kwargs):
    return requests.post(f"{BASE_URL}{url}", timeout=30, **kwargs)


def register_and_login() -> str:
    username = f"user_settings_{int(time.time())}"
    password = "pwd_123456"
    r = post("/auth/register", json={"username": username, "password": password})
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
    assert r.ok, r.text
    token = r.json()["access_token"]
    return username, token


def test_global_settings_roundtrip():
    print("\n=== 未登录：全局设置保存/读取 ===")
    # 保存全局设置
    payload = {
        "apiKey": "GLOBAL_KEY_123",
        "modelProvider": "openai",
        "modelName": "gpt-4o-mini",
        "baseUrl": "https://api.openai.com/v1",
        "selectedDatabase": "",
        "maxTokens": 2048,
        "temperature": 0.1,
        "embeddingModel": "text-embedding-3-small",
        "embeddingDim": 1536,
    }
    r = post("/settings", json=payload)
    print("POST /settings (global) →", r.status_code)
    assert r.ok, r.text

    # 读取全局设置
    r = get("/settings")
    print("GET /settings (global) →", r.status_code)
    assert r.ok
    data = r.json()
    print(pretty(data))
    assert data["apiKey"] == "***"
    assert data["temperature"] == 0.1


def test_user_settings_roundtrip():
    print("\n=== 已登录：用户级设置保存/读取 ===")
    username, token = register_and_login()
    headers = {"Authorization": f"Bearer {token}"}

    # 读取（初次应回退为全局设置，至少 apiKey 为 ***）
    r = get("/settings", headers=headers)
    print("GET /settings (user initial) →", r.status_code)
    assert r.ok
    print(pretty(r.json()))

    # 保存用户级设置
    user_payload = {
        "apiKey": "USER_KEY_999",
        "modelProvider": "openai",
        "modelName": "gpt-4o-mini",
        "baseUrl": "https://api.openai.com/v1",
        "selectedDatabase": "",
        "maxTokens": 3072,
        "temperature": 0.5,
        "embeddingModel": "text-embedding-3-small",
        "embeddingDim": 1536,
    }
    r = post("/settings", headers=headers, json=user_payload)
    print("POST /settings (user) →", r.status_code)
    assert r.ok, r.text

    # 再次读取，应该返回用户级设置（apiKey 为 ***）
    r = get("/settings", headers=headers)
    print("GET /settings (user after save) →", r.status_code)
    assert r.ok
    data = r.json()
    print(pretty(data))
    assert data["apiKey"] == "***"
    assert data["temperature"] == 0.5

    # 直接读取数据库验证 apiKey 明文保留
    if os.path.exists(DB_ABS_PATH):
        engine = create_engine(f"sqlite:///{DB_ABS_PATH}")
        with Session(engine) as session:
            row = session.exec(select(UserSetting).where(UserSetting.username == username)).first()
            assert row is not None
            stored = json.loads(row.data_json or "{}")
            assert stored.get("apiKey") == "USER_KEY_999"
            assert stored.get("temperature") == 0.5

    # 提交占位 ***，应保留旧 apiKey
    r = post("/settings", headers=headers, json={
        "apiKey": "***",
        "temperature": 0.6,
        "modelProvider": "openai",
        "modelName": "gpt-4o-mini",
        "baseUrl": "https://api.openai.com/v1",
        "selectedDatabase": "",
        "maxTokens": 3072,
        "embeddingModel": "text-embedding-3-small",
        "embeddingDim": 1536,
    })
    assert r.ok
    if os.path.exists(DB_ABS_PATH):
        engine = create_engine(f"sqlite:///{DB_ABS_PATH}")
        with Session(engine) as session:
            row = session.exec(select(UserSetting).where(UserSetting.username == username)).first()
            stored = json.loads(row.data_json or "{}")
            assert stored.get("apiKey") == "USER_KEY_999"  # 仍保留旧值
            assert stored.get("temperature") == 0.6


def main():
    test_global_settings_roundtrip()
    test_user_settings_roundtrip()
    print("\n设置接口测试完成 ✅")


if __name__ == "__main__":
    main()


