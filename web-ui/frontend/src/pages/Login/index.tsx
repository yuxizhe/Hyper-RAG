import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Tabs } from 'antd'
import { storeGlobalUser } from '@/store/globalUser'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onLogin = async (values: any) => {
    setLoading(true)
    try {
      await storeGlobalUser.login(values.username, values.password)
      message.success('登录成功')
      navigate('/Hyper/chat', { replace: true })
    } catch (e: any) {
      message.error(e?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (values: any) => {
    setLoading(true)
    try {
      await storeGlobalUser.register(values.username, values.password)
      message.success('注册成功，请登录')
    } catch (e: any) {
      message.error(e?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Card title="Hyper-RAG" style={{ width: 380 }}>
        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form layout="vertical" onFinish={onLogin}>
                  <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                    <Input placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                    <Input.Password placeholder="密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    登录
                  </Button>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form layout="vertical" onFinish={onRegister}>
                  <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                    <Input placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                    <Input.Password placeholder="密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    注册
                  </Button>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default LoginPage


