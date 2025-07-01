import { makeAutoObservable } from 'mobx'

class GlobalUser {
  userInfo: Partial<User.UserEntity> = {}
  selectedDatabase: string = ''
  availableDatabases: Array<{ name: string; description: string }> = []

  constructor() {
    makeAutoObservable(this)
  }

  async getUserDetail() {
    // const res = await getCurrentUserInfo()
    // this.userInfo = res?.data
    // new WebSee(res?.data?.username)
    this.userInfo = {
      roles: [
        {
          id: 5,
          name: '超级管理员',
          description: '拥有所有查看和操作功能',
          adminCount: 0,
          status: 1,
          sort: 5
        }
      ],
      icon: 'http://jinpika-1308276765.cos.ap-shanghai.myqcloud.com/bootdemo-file/20221220/src=http___desk-fd.zol-img.com.cn_t_s960x600c5_g2_M00_00_0B_ChMlWl6yKqyILFoCACn-5rom2uIAAO4DgEODxAAKf7-298.jpg&refer=http___desk-fd.zol-img.com.png',
      username: 'admin'
    }
  }

  setUserInfo(user: Partial<User.UserEntity>) {
    this.userInfo = user
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
