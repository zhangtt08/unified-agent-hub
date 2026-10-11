# 统一 Agent 开放 API 网关 & MCP 协议中枢

本中枢将本机 `C:\Users\Administrator\Desktop\项目` 下全部 **17 个软件工程能力面** 聚合为**单一 MCP (Model Context Protocol) 协议服务器**与**统一 HTTP 开放 API 网关**，供任意 AI Agent（如 Claude Desktop、Cursor、Antigravity、Codex、Cline、自定义 LLM 脚本）即插即用调用。

---

## 🌟 核心特性

1. **统一 MCP 协议服务器 (`mcp-server.mjs`)**：
   - 遵循 MCP 规范（JSON-RPC 2.0 over STDIO）。
   - 单一进程挂载，立即获取全部 100+ 个专业工具。
   - **离线自启**：调用未运行项目的工具时，中枢自动按需拉起对应服务并完成调用。
2. **统一开放 HTTP API 网关 (`gateway.mjs`)**：
   - 监听 `http://127.0.0.1:8888`，提供单点路由分发。
   - 提供 OpenAI / Claude / Gemini 原生兼容的 Function Calling Schema。
   - 内置可视化 Web 控制台与在线接口调试器。
3. **各项目全量开放 API 接口**：
   - 全部 17 个项目均已具备标准的 Agent API v1 契约（`GET /api/health`、`GET /api/agent/tools`、`GET /api/agent/manifest`、`POST /api/agent/tool`）。
   - 本机回环防护守卫，阻断 DNS Rebinding 与非法跨源请求。

---

## 📋 17 个纳管项目全景矩阵

| 项目 ID | 项目名称 | 领域分类 | 独立服务端口 | 工具前缀 | 核心能力描述 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frameboost` | FrameBoost 视频补帧 | 视频工程 | 8791 | `frameboost.*` | FFmpeg 光流/混合补帧 (30→60/90/120fps)，保留 HDR/10-bit |
| `agentaudio` | AgentAudio 音频工作室 | 音频工程 | 8788 | `agentaudio.*` | 音频时长精准拟合(fit)、多轨混音闪避、人声分离与质检 |
| `agentcanvas` | AgentCanvas 画布排版 | 图形设计 | 8899 | `agentcanvas.*` | 一键海报生成(poster)、语义排版求解、图片批量滤镜与导出 |
| `agentcut` | AgentCut 视频剪辑 | 视频工程 | 8780 | `agentcut.*` | 多轨时间线剪辑、转场特效、曲线关键帧动画与母带渲染 |
| `sucai` | Sucai 素材下载器 | 资源采集 | 8792 | `sucai.*` | 跨 9 个免费高清素材源批量检索与下载无版权素材 |
| `qingying` | 清影音视频下载器 | 资源采集 | 8793 | `qingying.*` | yt-dlp + gallery-dl 双引擎驱动，全网音视频多媒体解析下载 |
| `vocal` | 声析 Vocal Separator | 音频工程 | 8000 | `vocal.*` | Demucs 离线 AI 音频分离，输出四条纯净 WAV 音轨 |
| `workflowhub` | WorkflowHub 工作流中枢 | 系统编排 | 8794 | `workflowhub.*` | 本机可执行程序、脚本与已安装应用统一注册与调用 |
| `ra` | 录放台 Recorded Automation | 浏览器自动化 | 8795 | `ra.*` | 浏览器操作录制为工作流并在无头环境下确定性回放 |
| `jingjie` | 竞界 JingJie 深度维护 | 系统维护 | 8796 | `jingjie.*` | Windows 已装软件与开机项扫描、深度清理计划预览与执行 |
| `afa` | 网申表单助手 AFA | 自动化填表 | 8797 | `afa.*` | 招聘 ATS 网申页面表单解析、简历字段映射与智能填报 |
| `commander` | AI Project Commander | 项目中枢 | 8787 | `commander.*` | 本机工程全景清单、单测门禁扫描、风险指标与下一步行动 |
| `trendscope` | TrendScope 趋势分析 | 爆款选题 | 5184 | `trendscope.*` | 多渠道热点采集、动量评分、聚类主题与选题方案生成 |
| `geo` | ZTT GEO 品牌事实源 | 品牌事实 | 3000 | `geo.*` | 个人品牌事实源维护、高意图搜索提问挖掘与可发布包构建 |
| `acb` | Agent Context Bridge | 任务交接 | 5174 | `acb.*` | 跨机器项目交接记录封存、任务迁移与目标工作区恢复 |
| `personal_agent_hub` | Personal Agent Hub | 知识记忆 | 8778 | `hub.*` | 个人 RAG 知识库检索、长期偏好记忆、文件安全检索 |
| `mao` | Multi-Agent Orchestrator | 多智能体 | 8766 | `mao.*` | 多角色软件工程协同运行时（架构师/程序员/评审员调度） |

---

## 🚀 方式一：在 AI Agent 中挂载统一 MCP 协议

无论你使用 **Claude Desktop**、**Cursor**、**Antigravity** 还是 **VS Code Cline**，只需配置单个 MCP 服务条目：

### 1. 配置文件路径
- **Claude Desktop**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor**: 项目根目录 `.cursor/mcp.json`
- **Antigravity / Cline**: 对应全局或工作区设置中的 `mcpServers`

### 2. 配置内容 (JSON)
```json
{
  "mcpServers": {
    "unified-agent-hub": {
      "command": "node",
      "args": [
        "C:\\Users\\Administrator\\Desktop\\项目\\unified-agent-hub\\mcp-server.mjs"
      ]
    }
  }
}
```

挂载完成后，Agent 将自动拥有：
- `hub_list_projects`: 查看所有 17 个软件的运行状态与能力
- `hub_search_tools`: 智能检索任意能力（如输入 `"视频"`、`"混音"`、`"清理"`）
- `hub_invoke`: 统一工具调用路由器
- `frameboost.*`、`agentaudio.*`、`agentcanvas.*`、`agentcut.*`、`sucai.*` 等全套原生工具。

---

## 🌐 方式二：使用统一 HTTP 开放 API 网关

双击运行根目录下的 `启动统一网关.bat`，或在命令行运行：
```bash
node gateway.mjs
```
网关将在 `http://127.0.0.1:8888` 启动。

### 1. Web 可视化控制台
在浏览器中打开 `http://127.0.0.1:8888/` 即可查看项目矩阵状态看板、一键启停服务、并在界面中进行在线工具调试。

### 2. 统一调用接口 (`POST /api/invoke`)
任意 Agent 或脚本只需向此单点发送 POST 请求，网关将**自动寻址对应项目、并在项目离线时自动按需拉起后台进程**：

```bash
curl -X POST http://127.0.0.1:8888/api/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agentaudio.fit",
    "input": {
      "in": "sample.mp3",
      "out": "output.wav",
      "dur": 45
    }
  }'
```

**响应格式**：
```json
{
  "ok": true,
  "data": {
    "out": "output.wav",
    "dur": 45.0,
    "mode": "rate",
    "engine": "rubberband"
  },
  "tool": "agentaudio.fit",
  "ms": 320
}
```

### 3. 获取全量 Function Calling Schema
针对 OpenAI / Anthropic / Gemini 模型调用，请求以下端点即可直接获取符合规范的函数声明列表：
```bash
GET http://127.0.0.1:8888/api/tools?format=openai
```

---

## 🔌 方式三：直接调用各项目独立 API 接口

除统一网关外，所有 17 个项目自身的独立端口也完全遵循 **Agent API Standard v1**。如果外部 Agent 想要直连某个项目的专属端口，四端点完全一致：

```text
GET  http://127.0.0.1:<PORT>/api/health         # 健康检查与状态
GET  http://127.0.0.1:<PORT>/api/agent/tools    # 该项目的可用工具清单
GET  http://127.0.0.1:<PORT>/api/agent/manifest # 项目元信息与令牌要求
POST http://127.0.0.1:<PORT>/api/agent/tool     # 调用该项目工具，Body: {"tool":"...", "input":{...}}
```

---

## 🛡️ 本机守卫与安全设计

1. **严格绑定回环**：所有服务只监听 `127.0.0.1`，拒绝绑定 `0.0.0.0`。
2. **逐字 Host 校验**：严格校验 `Host: 127.0.0.1:<PORT>`，杜绝 DNS Rebinding 漏洞。
3. **禁止非授权跨源**：不发送 `Access-Control-Allow-Origin: *`，防止恶意网页在浏览器后台对本地服务进行越权写入。
4. **令牌自动流转**：写请求与高风险执行动作由私有令牌保护，MCP 桥与统一网关自动读取与传递令牌，无须人工手动配置。
