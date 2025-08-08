import { makeAutoObservable } from 'mobx'

type Role = {
  id?: number
  name?: string
  description?: string
  adminCount?: number
  status?: number
  sort?: number
}

type UserEntity = {
  username?: string
  icon?: string
  roles?: Role[]
  menus?: any[]
}

class GlobalUser {
  userInfo: Partial<UserEntity> = {}
  token: string = ''
  selectedDatabase: string = ''
  availableDatabases: Array<{ name: string; description: string }> = []

  constructor() {
    makeAutoObservable(this)
    // restore token and selected db
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      this.token = savedToken
    }
    const savedDb = localStorage.getItem('selectedDatabase')
    if (savedDb) {
      this.selectedDatabase = savedDb
    }
  }

  async getUserDetail() {
    if (!this.token) {
      return
    }
    try {
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
      const res = await fetch(`${SERVER_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        this.userInfo = data
      }
    } catch (e) {
      // ignore
    }
  }

  setUserInfo(user: Partial<UserEntity>) {
    this.userInfo = user
  }

  setToken(token: string) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  async login(username: string, password: string) {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)
    body.append('grant_type', 'password')
    body.append('scope', '')
    body.append('client_id', '')
    body.append('client_secret', '')
    const res = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
    if (!res.ok) {
      throw new Error('登录失败')
    }
    const data = await res.json()
    this.setToken(data?.access_token)
    await this.getUserDetail()
    return true
  }

  async register(username: string, password: string) {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
    const res = await fetch(`${SERVER_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      throw new Error('注册失败')
    }
    return true
  }

  logout() {
    this.setToken('')
    this.userInfo = {}
  }

  // 设置当前选中的数据库
  setSelectedDatabase(database: string) {
    this.selectedDatabase = database
    // 保存到localStorage
    localStorage.setItem('selectedDatabase', database)
  }

  // 设置可用数据库列表
  setAvailableDatabases(databases: Array<{ name: string; description: string }>) {
    this.availableDatabases = databases
    // 如果还没有选中数据库且有可用数据库，选择第一个
    if (!this.selectedDatabase && databases.length > 0) {
      this.setSelectedDatabase(databases[0].name)
    }
    // 如果数据库列表中不包含 this.selectedDatabase，则选择第一个
    if (!databases.some(db => db.name === this.selectedDatabase)) {
      this.setSelectedDatabase(databases[0].name)
    }
  }

  // 从localStorage恢复选中的数据库
  restoreSelectedDatabase() {
    const saved = localStorage.getItem('selectedDatabase')
    if (saved) {
      this.selectedDatabase = saved
    }
  }

  // 获取数据库列表
  async loadDatabases() {
    try {
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
      const response = await fetch(`${SERVER_URL}/databases`)
      if (response.ok) {
        const databases = await response.json()
        this.setAvailableDatabases(databases)
        return databases
      }
    } catch (error) {
      console.error('加载数据库列表失败:', error)
    }
    return []
  }
}

export const storeGlobalUser = new GlobalUser()
