#!/usr/bin/env node
/**
 * 统一开放 API 网关 (Unified Open API Gateway)
 * 端口: 8888 (支持 PORT 环境变量覆盖)
 * 职责:
 *  1. 聚合 17 个软件项目的能力，提供统一的 HTTP REST 入口；
 *  2. 提供兼容 OpenAI / Claude / Gemini 函数调用 (Function Calling) 的统一工具 Schema；
 *  3. 支持 MCP over HTTP / SSE 协议传输；
 *  4. 提供可视化 Web 控制台与在线调试界面。
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS, isOnline, startProject, stopProject, getProjectTools, invokeTool, getProjectBaseUrl, getProject } from './registry.mjs';

const PORT = Number(process.env.PORT || 8888);
const HOST = '127.0.0.1';
const START_TIME = Date.now();

function json(res, status, data, headers = {}) {
  const body = Buffer.from(JSON.stringify(data, null, 2));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': body.length,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-agent-token',
    ...headers
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 10 * 1024 * 1024) {
        req.destroy();
        return reject(new Error('请求体过大 (超过 10MB)'));
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('请求体非合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function getAllTools() {
  const result = [];
  for (const p of PROJECTS) {
    const tools = await getProjectTools(p);
    for (const t of tools) {
      result.push({
        project_id: p.id,
        project_name: p.name,
        category: p.category,
        name: t.name,
        description: t.description || '',
        risk: t.risk || 'read',
        input_schema: t.input_schema || { type: 'object', properties: {} }
      });
    }
  }
  return result;
}

function toOpenAIFunctions(tools) {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
      description: `[${t.project_name}] ${t.description}`,
      parameters: t.input_schema
    }
  }));
}

function renderHtmlDashboard(projectStatuses, toolsCount) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>统一开放 API 网关 & MCP 中枢</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --success: #22c55e;
      --danger: #ef4444;
      --warning: #f59e0b;
      --badge-bg: #0369a1;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
    }
    .title h1 { font-size: 24px; font-weight: 700; color: var(--primary); }
    .title p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .metrics { display: flex; gap: 16px; }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 18px;
      text-align: center;
    }
    .metric-card .val { font-size: 20px; font-weight: bold; color: var(--primary); }
    .metric-card .lbl { font-size: 12px; color: var(--text-muted); }

    .nav-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tab-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover { background: var(--badge-bg); color: #fff; border-color: var(--primary); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .card-title { font-size: 16px; font-weight: 600; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-online { background: rgba(34, 197, 94, 0.2); color: var(--success); border: 1px solid var(--success); }
    .badge-offline { background: rgba(148, 163, 184, 0.1); color: var(--text-muted); border: 1px solid var(--card-border); }
    .card-cat { font-size: 11px; text-transform: uppercase; color: var(--primary); margin-bottom: 6px; }
    .card-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; flex-grow: 1; }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: var(--text-muted);
    }
    .btn {
      background: var(--badge-bg);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-stop { background: #7f1d1d; }
    .btn-stop:hover { background: var(--danger); }

    .test-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 20px;
      margin-top: 24px;
    }
    .test-box h2 { font-size: 18px; margin-bottom: 12px; color: var(--primary); }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
    input, select, textarea {
      width: 100%;
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
      font-family: inherit;
      font-size: 13px;
    }
    textarea { font-family: monospace; height: 100px; resize: vertical; }
    pre {
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-size: 13px;
      color: #38bdf8;
      max-height: 280px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <h1>统一 Agent 开放 API 网关 & MCP 中枢</h1>
      <p>本机 17 个软件工程能力聚合面 · HTTP REST 端口 :${PORT} · MCP JSON-RPC 协议就绪</p>
    </div>
    <div class="metrics">
      <div class="metric-card">
        <div class="val">${projectStatuses.length}</div>
        <div class="lbl">纳管项目</div>
      </div>
      <div class="metric-card">
        <div class="val">${toolsCount}</div>
        <div class="lbl">可用工具</div>
      </div>
      <div class="metric-card">
        <div class="val" id="online-count">${projectStatuses.filter(p => p.online).length}</div>
        <div class="lbl">实时在线</div>
      </div>
    </div>
  </div>

  <div class="nav-tabs">
    <button class="tab-btn active" onclick="showTab('projects')">项目矩阵与服务状态</button>
    <button class="tab-btn" onclick="showTab('api-docs')">接口契约 & Agent 配置指南</button>
    <button class="tab-btn" onclick="showTab('debugger')">在线交互式调试</button>
  </div>

  <!-- 项目列表 -->
  <div id="tab-projects" class="tab-pane">
    <div class="grid">
      ${projectStatuses.map(p => `
        <div class="card">
          <div>
            <div class="card-cat">${p.category} · 端口 :${p.port}</div>
            <div class="card-top">
              <div class="card-title">${p.name}</div>
              <span class="badge ${p.online ? 'badge-online' : 'badge-offline'}">${p.online ? '● 在线就绪' : '○ 待机 (按需自启)'}</span>
            </div>
            <div class="card-desc">${p.summary}</div>
          </div>
          <div class="card-footer">
            <span>前缀: <code>${p.id}.*</code></span>
            <div>
              <button class="btn" onclick="toggleProject('${p.id}', ${!p.online})">${p.online ? '停止服务' : '立即拉起'}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 接口文档与配置指南 -->
  <div id="tab-api-docs" class="tab-pane" style="display:none;">
    <div class="test-box">
      <h2>1. Claude Desktop / Cursor / Antigravity MCP 配置</h2>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">在客户端配置中添加以下单条记录即可挂载全部 17 个项目能力：</p>
      <pre>{
  "mcpServers": {
    "unified-agent-hub": {
      "command": "node",
      "args": ["${path.resolve('mcp-server.mjs').replace(/\\/g, '\\\\')}"]
    }
  }
}</pre>

      <h2 style="margin-top:24px;">2. 统一 HTTP REST 开放接口</h2>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">任意 LLM 或 Agent 脚本可直接通过单个端点调用全套工具（服务离线时自动拉起）：</p>
      <pre>POST http://127.0.0.1:${PORT}/api/invoke
Content-Type: application/json

{
  "tool": "agentaudio.fit",
  "input": {
    "in": "sample.mp3",
    "out": "output.wav",
    "dur": 30
  }
}</pre>

      <h2 style="margin-top:24px;">3. 获取全量 Function Calling Schema (OpenAI / Claude / Gemini 兼容)</h2>
      <pre>GET http://127.0.0.1:${PORT}/api/tools?format=openai</pre>
    </div>
  </div>

  <!-- 在线调试控制台 -->
  <div id="tab-debugger" class="tab-pane" style="display:none;">
    <div class="test-box">
      <h2>在线工具调用调试台</h2>
      <div class="form-group">
        <label>选择目标工具：</label>
        <input type="text" id="dbg-tool" value="agentaudio.caps" placeholder="输入工具名，如 frameboost.capability_probe, agentaudio.caps, sucai.sources.list">
      </div>
      <div class="form-group">
        <label>输入参数 (JSON 对象)：</label>
        <textarea id="dbg-input">{}</textarea>
      </div>
      <button class="btn" style="padding:8px 20px;" onclick="runDebug()">执行调用</button>

      <div class="form-group" style="margin-top:16px;">
        <label>执行回执：</label>
        <pre id="dbg-output">// 等待调用...</pre>
      </div>
    </div>
  </div>

  <script>
    function showTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      document.getElementById('tab-' + tab).style.display = 'block';
    }

    async function toggleProject(id, start) {
      const url = '/api/projects/' + id + '/' + (start ? 'start' : 'stop');
      try {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        alert(start ? '服务启动就绪！' : '服务已停止');
        location.reload();
      } catch (e) {
        alert('操作失败: ' + e.message);
      }
    }

    async function runDebug() {
      const tool = document.getElementById('dbg-tool').value.trim();
      let input = {};
      try { input = JSON.parse(document.getElementById('dbg-input').value); }
      catch (e) { return alert('JSON 参数格式错误: ' + e.message); }
      const out = document.getElementById('dbg-output');
      out.textContent = '// 正在调用 ' + tool + ' ...';
      try {
        const res = await fetch('/api/invoke', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tool, input })
        });
        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = '请求异常: ' + e.message;
      }
    }
  </script>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || HOST}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization, x-agent-token'
    });
    res.end();
    return;
  }

  // 1. 根目录与文档控制台
  if ((pathname === '/' || pathname === '/docs') && method === 'GET') {
    const statuses = await Promise.all(
      PROJECTS.map(async (p) => ({
        ...p,
        online: await isOnline(p, 600),
        base_url: getProjectBaseUrl(p)
      }))
    );
    const tools = await getAllTools();
    const html = renderHtmlDashboard(statuses, tools.length);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 2. 健康检查
  if (pathname === '/api/health' && method === 'GET') {
    const onlineList = (await Promise.all(PROJECTS.map(async (p) => ({ id: p.id, online: await isOnline(p, 400) })))).filter(p => p.online);
    json(res, 200, {
      ok: true,
      data: {
        gateway: 'unified-agent-gateway',
        version: '1.0.0',
        uptime_ms: Date.now() - START_TIME,
        total_projects: PROJECTS.length,
        online_projects: onlineList.length,
        port: PORT
      }
    });
    return;
  }

  // 3. 项目列表
  if (pathname === '/api/projects' && method === 'GET') {
    const statuses = await Promise.all(
      PROJECTS.map(async (p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        summary: p.summary,
        port: p.port,
        base_url: getProjectBaseUrl(p),
        online: await isOnline(p, 600)
      }))
    );
    json(res, 200, { ok: true, data: statuses });
    return;
  }

  // 4. 项目启停
  const startMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/start$/);
  if (startMatch && method === 'POST') {
    const p = getProject(startMatch[1]);
    if (!p) return json(res, 404, { ok: false, error: '未找到该项目' });
    const result = await startProject(p);
    return json(res, result.ok ? 200 : 500, result);
  }

  const stopMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/stop$/);
  if (stopMatch && method === 'POST') {
    const p = getProject(stopMatch[1]);
    if (!p) return json(res, 404, { ok: false, error: '未找到该项目' });
    const result = stopProject(p);
    return json(res, 200, result);
  }

  // 5. 工具清单 (包含 OpenAI / Anthropic 兼容 schema)
  if (pathname === '/api/tools' && method === 'GET') {
    const tools = await getAllTools();
    const format = url.searchParams.get('format');
    if (format === 'openai') {
      return json(res, 200, { ok: true, tools: toOpenAIFunctions(tools) });
    }
    return json(res, 200, {
      ok: true,
      total: tools.length,
      tools,
      openai_functions: toOpenAIFunctions(tools)
    });
  }

  // 6. 统一调用网关 (POST /api/invoke 或 POST /api/agent/tool)
  if ((pathname === '/api/invoke' || pathname === '/api/agent/tool') && method === 'POST') {
    const t0 = Date.now();
    try {
      const body = await readBody(req);
      const toolName = body.tool;
      const input = body.input || {};
      const autoStart = body.auto_start !== false;

      if (!toolName) {
        return json(res, 400, { ok: false, error: { code: 'bad_input', message: '缺少参数 tool' } });
      }

      const result = await invokeTool(toolName, input, autoStart);
      return json(res, 200, {
        ok: true,
        data: result,
        tool: toolName,
        ms: Date.now() - t0
      });
    } catch (err) {
      return json(res, 500, {
        ok: false,
        error: { code: 'invoke_failed', message: err.message },
        ms: Date.now() - t0
      });
    }
  }

  // 7. MCP JSON-RPC over HTTP
  if (pathname === '/mcp' && method === 'POST') {
    try {
      const body = await readBody(req);
      const { id, method: mcpMethod, params } = body;
      if (mcpMethod === 'initialize') {
        return json(res, 200, {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'unified-gateway-mcp', version: '1.0.0' }
          }
        });
      }
      if (mcpMethod === 'tools/list') {
        const tools = (await getAllTools()).map((t) => ({
          name: t.name,
          description: `[${t.project_name}] ${t.description}`,
          inputSchema: t.input_schema
        }));
        return json(res, 200, { jsonrpc: '2.0', id, result: { tools } });
      }
      if (mcpMethod === 'tools/call') {
        const { name, arguments: args } = params || {};
        const result = await invokeTool(name, args || {}, true);
        return json(res, 200, {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
            isError: false
          }
        });
      }
      return json(res, 200, { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
    } catch (err) {
      return json(res, 500, { jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } });
    }
  }

  // 兜底 404
  json(res, 404, { ok: false, error: '未找到路由: ' + pathname });
});

server.listen(PORT, HOST, () => {
  console.log(`[gateway] 统一开放 API 网关已启动: http://${HOST}:${PORT}`);
  console.log(`[gateway] 在线控制台: http://${HOST}:${PORT}/`);
  console.log(`[gateway] 工具与 Schema: http://${HOST}:${PORT}/api/tools`);
  console.log(`[gateway] 统一调用入口: POST http://${HOST}:${PORT}/api/invoke`);
});
