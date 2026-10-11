#!/usr/bin/env node
/**
 * 统一 MCP 协议服务器 (Unified Model Context Protocol Server)
 * 协议版本: 2024-11-05 (JSON-RPC 2.0 over STDIO)
 * 聚合本机全部 17 个生态项目能力，AI Agent 接入本服务即可获得全套工具面。
 */
import readline from 'node:readline';
import { PROJECTS, isOnline, startProject, stopProject, getProjectTools, invokeTool, getProjectBaseUrl } from './registry.mjs';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = {
  name: 'unified-agent-mcp',
  version: '1.0.0',
  description: '统一多项目 MCP 协议中枢：聚合音视频处理、图形海报排版、媒体下载、趋势分析、系统维护与多智能体工程编排能力。'
};

const log = (...args) => process.stderr.write(`[unified-mcp] ${args.join(' ')}\n`);

const META_TOOLS = [
  {
    name: 'hub_list_projects',
    description: '查看本机全部 17 个软件项目的名称、分类、实时在线状态、端口与能力概况。',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'hub_search_tools',
    description: '按关键词全文检索全部 17 个项目中的可用工具与能力（如“视频”、“补帧”、“混音”、“海报”、“素材”、“下载”、“维护”、“编排”）。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        category: { type: 'string', description: '可选分类: video/audio/design/downloader/system/orchestration/browser/workflow/geo/trend' }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'hub_start_project',
    description: '按需显式拉起指定项目的本地后台服务（若离线）。',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目唯一标识，例如 frameboost, agentaudio, sucai' }
      },
      required: ['project_id'],
      additionalProperties: false
    }
  },
  {
    name: 'hub_stop_project',
    description: '停止指定项目的本地后台服务进程。',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目唯一标识' }
      },
      required: ['project_id'],
      additionalProperties: false
    }
  },
  {
    name: 'hub_invoke',
    description: '通用工具调用路由器：根据工具名称与参数，自动寻址项目、按需启动并执行。',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string', description: '完整工具名，如 agentaudio.fit 或 frameboost.probe_video' },
        input: { type: 'object', description: '传递给工具的参数对象' }
      },
      required: ['tool'],
      additionalProperties: false
    }
  }
];

async function collectAllTools() {
  const tools = [...META_TOOLS];
  for (const p of PROJECTS) {
    const pTools = await getProjectTools(p);
    for (const t of pTools) {
      tools.push({
        name: t.name,
        description: `[${p.name}] ${t.description || ''}`,
        inputSchema: t.input_schema || { type: 'object', properties: {} }
      });
    }
  }
  return tools;
}

function makeResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function makeError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleRequest(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return makeResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
        resources: {},
        prompts: {}
      },
      serverInfo: SERVER_INFO,
      instructions: '统一 MCP 服务已连接。可通过 hub_list_projects 查看所有项目状态，直接调用任意项目的工具（支持离线服务按需自启）。'
    });
  }

  if (method === 'notifications/initialized' || method === 'initialized') {
    log('Agent 客户端初始化完成');
    return null;
  }

  if (method === 'ping') {
    return makeResult(id, {});
  }

  if (method === 'tools/list') {
    const tools = await collectAllTools();
    return makeResult(id, { tools });
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};
    try {
      if (name === 'hub_list_projects') {
        const statuses = await Promise.all(
          PROJECTS.map(async (p) => {
            const online = await isOnline(p, 800);
            return {
              id: p.id,
              name: p.name,
              category: p.category,
              online,
              port: p.port,
              base_url: getProjectBaseUrl(p),
              summary: p.summary
            };
          })
        );
        return makeResult(id, {
          content: [{ type: 'text', text: JSON.stringify({ total: statuses.length, projects: statuses }, null, 2) }],
          isError: false
        });
      }

      if (name === 'hub_search_tools') {
        const q = String(args.query || '').toLowerCase();
        const cat = args.category;
        const all = await collectAllTools();
        const matches = all.filter((t) => {
          const matchQ = t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
          if (cat) {
            const p = PROJECTS.find((proj) => t.name.startsWith(proj.id));
            return matchQ && p && p.category === cat;
          }
          return matchQ;
        });
        return makeResult(id, {
          content: [{ type: 'text', text: JSON.stringify({ query: q, matched_count: matches.length, tools: matches }, null, 2) }],
          isError: false
        });
      }

      if (name === 'hub_start_project') {
        const p = PROJECTS.find((item) => item.id === args.project_id);
        if (!p) throw new Error(`未找到项目 ID: ${args.project_id}`);
        const res = await startProject(p);
        return makeResult(id, {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok
        });
      }

      if (name === 'hub_stop_project') {
        const p = PROJECTS.find((item) => item.id === args.project_id);
        if (!p) throw new Error(`未找到项目 ID: ${args.project_id}`);
        const res = stopProject(p);
        return makeResult(id, {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: false
        });
      }

      if (name === 'hub_invoke') {
        const result = await invokeTool(args.tool, args.input || {}, true);
        return makeResult(id, {
          content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
          isError: false
        });
      }

      // 直接调用项目工具
      const result = await invokeTool(name, args, true);
      return makeResult(id, {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
        isError: false
      });
    } catch (err) {
      log(`调用工具 [${name}] 出错: ${err.message}`);
      return makeResult(id, {
        content: [{ type: 'text', text: `调用失败: ${err.message}` }],
        isError: true
      });
    }
  }

  return makeError(id, -32601, `不支持的方法: ${method}`);
}

async function main() {
  log('统一 MCP 服务已启动 (STDIO 模式)，等待 Agent 连接...');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const msg = JSON.parse(trimmed);
      const resp = await handleRequest(msg);
      if (resp) {
        process.stdout.write(JSON.stringify(resp) + '\n');
      }
    } catch (err) {
      log('解析消息出错:', err.message);
      const resp = makeError(null, -32700, 'Parse error');
      process.stdout.write(JSON.stringify(resp) + '\n');
    }
  });

  process.on('SIGINT', () => {
    log('服务正在关闭...');
    process.exit(0);
  });
}

main();
