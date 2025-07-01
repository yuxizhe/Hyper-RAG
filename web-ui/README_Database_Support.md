# 前端页面Database参数支持

## 概述
为前端各个页面的接口调用添加了database参数支持，实现多数据库切换功能。

## 全局状态管理

### 修改文件: `src/store/globalUser.ts`
- 添加了`selectedDatabase`和`availableDatabases`状态
- 添加了数据库管理方法：
  - `setSelectedDatabase()` - 设置当前数据库
  - `setAvailableDatabases()` - 设置可用数据库列表
  - `restoreSelectedDatabase()` - 从localStorage恢复数据库选择
  - `loadDatabases()` - 从后端获取数据库列表
- 支持localStorage持久化存储

## 页面修改

### 1. Home页面 (`src/pages/Home/index.jsx`)
**修改内容：**
- 引入全局状态管理：`storeGlobalUser`
- 替换硬编码的数据库按钮为动态数据库选择器
- 在`process_message`接口调用中添加database参数
- 初始化时加载数据库列表

**接口调用修改：**
```javascript
// 原来
body: JSON.stringify({ message: nextContent })

// 现在  
body: JSON.stringify({ 
  message: nextContent,
  database: storeGlobalUser.selectedDatabase 
})
```

### 2. Graph页面 (`src/pages/Hyper/Graph/index.jsx`)
**修改内容：**
- 使用全局状态管理获取当前数据库
- 所有接口调用添加database参数
- 响应数据库切换时自动重新加载数据
- 显示当前数据库信息

**接口调用修改：**
```javascript
// vertices接口
const url = `${SERVER_URL}/db/vertices?database=${encodeURIComponent(storeGlobalUser.selectedDatabase)}`;

// vertices_neighbor接口  
const url = `${SERVER_URL}/db/vertices_neighbor/${encodeURIComponent(key)}?database=${encodeURIComponent(storeGlobalUser.selectedDatabase)}`;
```

### 3. DB页面 (`src/pages/Hyper/DB/index.jsx`)
**修改内容：**
- 移除本地数据库状态管理，使用全局状态
- 所有CRUD操作添加database参数支持
- 包装为observer组件以响应状态变化

**接口调用修改：**
```javascript
// 查询接口
const verticesUrl = `${SERVER_URL}/db/vertices?database=${encodeURIComponent(database)}`;
const hyperedgesUrl = `${SERVER_URL}/db/hyperedges?database=${encodeURIComponent(database)}`;

// 创建接口
const submitData = {
  ...values,
  database: storeGlobalUser.selectedDatabase
};

// 删除接口
const url = `${SERVER_URL}/db/vertices/${encodeURIComponent(vertexId)}?database=${encodeURIComponent(storeGlobalUser.selectedDatabase)}`;
```

### 4. Files页面 (`src/pages/Hyper/Files/index.jsx`)
**状态：** 无需修改，该页面为静态文件上传功能

### 5. Setting页面 (`src/pages/Setting/index.jsx`)
**状态：** 已完整支持数据库管理功能，无需修改

## 支持的接口

### 查询接口 (GET)
- `/db/vertices?database=xxx`
- `/db/hyperedges?database=xxx`
- `/db/vertices/{id}?database=xxx`
- `/db/vertices_neighbor/{id}?database=xxx`
- `/db/hyperedges/{id}?database=xxx`
- `/db/hyperedge_neighbor/{id}?database=xxx`

### 创建/更新接口 (POST/PUT)
请求体中包含database字段：
```json
{
  "vertex_id": "example",
  "entity_name": "example",
  "database": "hypergraph_wukong.hgdb"
}
```

### 删除接口 (DELETE)
- `/db/vertices/{id}?database=xxx`
- `/db/hyperedges/{id}?database=xxx`

### 其他接口
- `/process_message` - 消息处理(包含database参数)
- `/databases` - 获取数据库列表
- `/test-database` - 测试数据库连接

## 用户体验改进

1. **统一的数据库选择**：所有页面使用同一个全局数据库状态
2. **自动数据刷新**：切换数据库时自动重新加载相关数据
3. **状态持久化**：数据库选择自动保存到localStorage
4. **友好的错误处理**：网络请求失败时显示详细错误信息
5. **加载状态**：数据加载时显示加载指示器

## 技术实现

- **状态管理**：使用MobX进行全局状态管理
- **响应式更新**：使用observer包装组件，自动响应状态变化  
- **参数传递**：通过URL参数或请求体传递database参数
- **错误处理**：统一的异常处理和用户提示
- **持久化**：localStorage保存用户选择

## 使用方式

1. 用户在任意页面选择数据库
2. 选择自动同步到全局状态并持久化
3. 其他页面自动使用选中的数据库
4. 所有数据操作基于当前选中的数据库执行

这样实现了完整的多数据库支持，用户可以在不同的知识图谱数据库之间无缝切换。 