# DatabaseSelector 组件文档

## 概述

`DatabaseSelector` 是一个通用的数据库选择组件，用于在前端页面中提供数据库选择功能。该组件封装了数据库选择的核心逻辑，支持多种显示模式和配置选项。

## 功能特性

- **多种显示模式**：支持选择器、按钮组、紧凑模式
- **全局状态管理**：与 MobX store 集成
- **自动初始化**：自动加载数据库列表和恢复用户选择
- **刷新功能**：支持手动刷新数据库列表
- **加载状态**：显示加载和错误状态
- **响应式更新**：使用 observer 包装，自动响应状态变化

## 导入使用

```jsx
import DatabaseSelector from '../../../components/DatabaseSelector';
```

## 基本用法

### 选择器模式（默认）
```jsx
<DatabaseSelector 
  mode="select"
  showRefresh={true}
  onChange={(database) => console.log('数据库已切换：', database)}
/>
```

### 按钮组模式
```jsx
<DatabaseSelector 
  mode="buttons"
  showRefresh={true}
  size="small"
/>
```

### 紧凑模式
```jsx
<DatabaseSelector 
  mode="compact"
  showRefresh={false}
  size="middle"
/>
```

## Props 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'select' \| 'buttons' \| 'compact'` | `'select'` | 显示模式 |
| `showCurrent` | `boolean` | `true` | 是否显示当前数据库信息 |
| `showRefresh` | `boolean` | `false` | 是否显示刷新按钮 |
| `placeholder` | `string` | `'请选择数据库'` | 选择器占位文本 |
| `style` | `Object` | `{}` | 自定义样式 |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` | 组件大小 |
| `onChange` | `Function` | `undefined` | 数据库变更回调 |
| `disabled` | `boolean` | `false` | 是否禁用 |

## 显示模式详解

### 1. Select 模式 (`mode="select"`)
- 下拉选择器形式
- 显示数据库名称和描述
- 支持搜索功能
- 适用于需要详细信息的场景

### 2. Buttons 模式 (`mode="buttons"`)
- 按钮组形式
- 紧凑的数据库名称显示
- 支持鼠标悬停查看描述
- 适用于横向布局和快速切换

### 3. Compact 模式 (`mode="compact"`)
- 最紧凑的显示形式
- 无边框选择器
- 简化的数据库名称
- 适用于空间受限的场景

## 在各页面中的应用

### Home 页面
```jsx
<DatabaseSelector 
  mode="buttons"
  showRefresh={true}
  size="small"
  style={{ flex: 1 }}
/>
```

### Graph 页面
```jsx
<DatabaseSelector 
  mode="compact"
  showRefresh={false}
  size="middle"
  onChange={onDatabaseChange}
/>
```

### DB 页面
```jsx
<DatabaseSelector 
  mode="select"
  showRefresh={true}
  size="middle"
  onChange={onDatabaseChange}
/>
```

## 状态管理

组件使用全局 MobX store (`storeGlobalUser`) 管理状态：

- `selectedDatabase`: 当前选中的数据库
- `availableDatabases`: 可用数据库列表
- `setSelectedDatabase(database)`: 设置选中数据库
- `loadDatabases()`: 加载数据库列表

## 自动功能

1. **自动初始化**：组件挂载时自动执行
   - 恢复用户上次选择的数据库
   - 加载可用数据库列表

2. **自动状态同步**：使用 MobX observer
   - 全局状态变化时自动更新UI
   - 跨页面状态同步

3. **持久化存储**：
   - 用户选择自动保存到 localStorage
   - 页面刷新后自动恢复选择

## 错误处理

- 网络错误：显示错误提示
- 加载状态：显示加载指示器
- 空状态：显示友好的空状态提示

## 样式定制

组件支持通过 `style` prop 进行样式定制：

```jsx
<DatabaseSelector 
  style={{ 
    width: '100%',
    maxWidth: 400,
    margin: '10px 0'
  }}
/>
```

## 注意事项

1. 组件必须在 MobX Provider 内使用
2. 需要确保 storeGlobalUser 已正确初始化
3. observer 包装确保响应式更新
4. 建议在应用根级别进行数据库状态初始化

## 扩展开发

如需扩展功能，可以：

1. 添加新的显示模式
2. 增加更多配置选项
3. 添加自定义样式主题
4. 集成更多数据库操作功能

## 维护更新

组件位于 `src/components/DatabaseSelector/index.jsx`，更新时需要：

1. 保持向后兼容性
2. 更新类型定义
3. 更新文档说明
4. 测试所有使用场景 