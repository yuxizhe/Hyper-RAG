# Hyper-RAG 设置功能说明

## 功能概述

设置页面提供了完整的系统配置功能，包括：
- ✅ API Key 设置和管理
- ✅ 多种模型提供商选择 (OpenAI, Azure, Anthropic, 自定义)
- ✅ 灵活的模型名称配置 (支持预设选择和自定义输入)
- ✅ 数据库选择和连接测试
- ✅ 模型参数配置 (Temperature, Max Tokens)
- ✅ 连接测试功能

## 访问设置页面

在 Hyper-RAG Web UI 中，点击左侧菜单的 "key设置" 即可进入设置页面。

## 功能详情

### 1. API 配置

#### 模型提供商
支持以下模型提供商：
- **OpenAI**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`, `gpt-4o`
- **Azure OpenAI**: `gpt-35-turbo`, `gpt-4`, `gpt-4-32k`
- **Anthropic**: `claude-3-haiku`, `claude-3-sonnet`, `claude-3-opus`
- **自定义API**: 支持兼容 OpenAI API 格式的其他服务

#### 配置项说明
- **模型提供商**: 选择您要使用的AI服务提供商
- **模型名称**: 支持从预设列表选择或直接输入自定义模型名称（如 gpt-4o、claude-3-sonnet、qwen-plus 等）
- **API Base URL**: API服务的基础URL地址
- **API Key**: 您的API密钥（输入后会被安全存储）
- **最大Token数**: 单次对话的最大token限制 (1-8000)
- **Temperature**: 模型创造性参数 (0-2, 0更保守，2更创造性)

#### 自定义模型名称
模型名称字段支持两种使用方式：
1. **从预设列表选择**: 根据选择的模型提供商，自动显示常用模型选项
2. **自定义输入**: 直接输入任何模型名称，支持各种AI服务的模型，例如：
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
   - Anthropic: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`
   - 国产模型: `qwen-plus`, `glm-4`, `deepseek-chat`
   - 其他兼容模型: 任何支持OpenAI API格式的模型

#### API 连接测试
点击"测试API连接"按钮验证配置是否正确。系统会发送一个简单的测试请求来验证连接。

### 2. 数据库配置

#### 数据库选择
- 系统自动扫描后端目录中的 `.hgdb` 文件
- 显示数据库名称和描述信息
- 支持选择不同的知识图谱数据库

#### 预置数据库
- `hypergraph_wukong.hgdb`: 西游记知识图谱
- `hypergraph_A_Christmas_Carol.hgdb`: 圣诞颂歌知识图谱

#### 数据库连接测试
点击"测试数据库连接"按钮验证所选数据库是否可用。

### 3. 设置管理

#### 保存设置
- 点击"保存设置"按钮将配置保存到服务器
- 配置同时保存到本地存储作为备份
- 保存成功后会显示确认消息

#### 重置设置
- 点击"重置为默认"按钮恢复默认配置
- 重置后需要重新保存才会生效

## API 接口说明

### 后端新增接口

1. **获取设置** - `GET /settings`
   - 返回当前系统设置（API Key 会被脱敏处理）

2. **保存设置** - `POST /settings`
   - 保存系统设置到 `settings.json` 文件

3. **获取数据库列表** - `GET /databases`
   - 返回可用的数据库文件列表及描述

4. **测试API连接** - `POST /test-api`
   - 验证API配置是否正确

5. **测试数据库连接** - `POST /test-database`
   - 验证数据库文件是否可用

### 配置文件

设置保存在后端的 `settings.json` 文件中，包含以下字段：
```json
{
  "apiKey": "your-api-key",
  "modelProvider": "openai",
  "modelName": "gpt-3.5-turbo", 
  "baseUrl": "https://api.openai.com/v1",
  "selectedDatabase": "hypergraph_wukong.hgdb",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

## 使用流程

1. **首次配置**:
   - 进入设置页面
   - 选择模型提供商
   - 输入API Key和相关配置
   - 选择要使用的数据库
   - 测试连接确保配置正确
   - 保存设置

2. **修改配置**:
   - 进入设置页面会自动加载当前配置
   - 修改需要更改的项目
   - 测试连接验证新配置
   - 保存更新后的设置

3. **使用配置**:
   - 保存后的配置会自动应用到对话功能
   - 系统会使用配置的API和数据库进行问答

## 安全说明

- API Key 在前端显示时会被脱敏处理
- 配置文件存储在服务器端，确保安全
- 连接测试仅发送简单请求，不会泄露敏感信息
- 支持本地存储备份，防止配置丢失

## 故障排除

### API 连接失败
1. 检查API Key是否正确
2. 确认Base URL格式正确
3. 验证模型名称是否支持
4. 检查网络连接

### 数据库连接失败
1. 确认数据库文件存在
2. 检查文件权限
3. 验证文件格式正确

### 配置保存失败
1. 检查服务器写入权限
2. 确认磁盘空间充足
3. 验证配置项格式正确

## 开发说明

### 前端组件
- 位置: `web-ui/frontend/src/pages/Setting/index.jsx`
- 使用 Ant Design 组件库
- 支持表单验证和状态管理

### 后端接口
- 位置: `web-ui/backend/main.py`
- 使用 FastAPI 框架
- 支持配置文件管理和连接测试

### 路由配置
- 路由: `/Setting`
- 组件: `Setting`
- 图标: `SettingOutlined` 