#!/usr/bin/env python3
"""
Auth API 测试脚本

运行前提：后端已启动 (默认 http://localhost:8000)

运行方式：
  python3 test_auth_api.py
"""

import json
import time
from typing import Optional

import requests

BASE_URL = "http://localhost:8000"


def pretty(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


def check_server() -> bool:
    try:
        r = requests.get(f"{BASE_URL}/")
        return r.ok
    except Exception:
        return False


def register(username: str, password: str) -> Optional[dict]:
    print("=== 注册用户 ===")
    payload = {"username": username, "password": password}
    r = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print("Status:", r.status_code)
    try:
        print(pretty(r.json()))
    except Exception:
        print(r.text)
    return r.json() if r.ok else None


def login(username: str, password: str) -> Optional[str]:
    print("=== 登录 ===")
    data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "scope": "",
        "client_id": "",
        "client_secret": "",
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    r = requests.post(f"{BASE_URL}/auth/login", data=data, headers=headers)
    print("Status:", r.status_code)
    try:
        print(pretty(r.json()))
    except Exception:
        print(r.text)
    if not r.ok:
        return None
    return r.json().get("access_token")


def me(token: str) -> Optional[dict]:
    print("=== 获取当前用户 ===")
    r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("Status:", r.status_code)
    try:
        print(pretty(r.json()))
    except Exception:
        print(r.text)
    return r.json() if r.ok else None


def main():
    print("开始测试 Auth API...\n")
    if not check_server():
        print("后端服务未启动，请先运行：uvicorn main:app --reload --port 8000 (目录 web-ui/backend)")
        return

    username = f"testuser_{int(time.time())}"
    password = "test_password_123"

    reg = register(username, password)
    if not reg:
        print("注册失败，退出")
        return

    token = login(username, password)
    if not token:
        print("登录失败，退出")
        return

    user = me(token)
    if not user:
        print("获取当前用户失败，退出")
        return

    assert user.get("username") == username, "返回的用户名与登录用户不一致"
    print("\n全部测试通过！")


if __name__ == "__main__":
    main()


