import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT_PROJECTS = path.resolve('C:\\Users\\Administrator\\Desktop\\项目');
const PY = 'C:\\Program Files\\Python312\\python.exe';

export const PROJECTS = [
  {
    id: 'frameboost',
    name: 'FrameBoost 视频补帧',
    category: 'video',
    summary: '本地视频补帧引擎：FFmpeg 光流/混合将 30fps 补至 60/90/120fps，保留 10-bit 与 HDR。',
    port: 8791,
    env: 'FRAMEBOOST_BASE_URL',
    dir: 'frameboost',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'agentaudio',
    name: 'AgentAudio 音频工作室',
    category: 'audio',
    summary: '本地音频智能处理引擎：音频时长精准拟合对齐、多轨混音闪避、人声伴奏分离、音效处理与质检。',
    port: 8788,
    env: 'AGENTAUDIO_BASE_URL',
    dir: 'agentaudio',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'agentcanvas',
    name: 'AgentCanvas 画布排版',
    category: 'design',
    summary: '本地图形设计与海报排版引擎：一句话海报生成、语义约束排版、图片批量算子处理、结构化检查与真文件导出。',
    port: 8899,
    env: 'AGENTCANVAS_BASE_URL',
    dir: 'agentcanvas',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'agentcut',
    name: 'AgentCut 视频剪辑',
    category: 'video',
    summary: '本地视频剪辑与时间线引擎：多轨剪辑、转场特效、关键帧动画、文字字幕、调色混音与批量渲染交付。',
    port: 8780,
    env: 'AGENTCUT_BASE_URL',
    dir: 'agentcut',
    launch: { command: path.join(ROOT_PROJECTS, 'agentcut', '.venv', 'Scripts', 'python.exe'), args: ['agent/server.py'] }
  },
  {
    id: 'sucai',
    name: 'Sucai 素材下载器',
    category: 'downloader',
    summary: '一次查询跨 9 个免费版权素材源聚合检索并批量下载高质量图片、视频与音效。',
    port: 8792,
    env: 'SUCAI_BASE_URL',
    dir: 'sucai',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'qingying',
    name: '清影音视频下载器',
    category: 'downloader',
    summary: '全网音视频多媒体下载工作台：yt-dlp + gallery-dl 双引擎驱动，支持会话登录与高清格式解析。',
    port: 8793,
    env: 'QINGYING_BASE_URL',
    dir: 'QingYingDownloader',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'vocal',
    name: '声析 Vocal Separator',
    category: 'audio',
    summary: '本地人声伴奏智能分离引擎：集成 Demucs 离线 AI 分离，生成四条纯净 WAV 音轨。',
    port: 8000,
    env: 'VOCAL_BASE_URL',
    dir: 'vocal-separator',
    launch: { command: PY, args: ['backend/main.py'] }
  },
  {
    id: 'workflowhub',
    name: 'WorkflowHub 工作流中枢',
    category: 'workflow',
    summary: '本机工具与工作流编排中心：PATH可执行文件、脚本与已安装应用统一注册，带契约搜索与调用。',
    port: 8794,
    env: 'WORKFLOWHUB_BASE',
    dir: 'workflowhub',
    launch: { command: PY, args: ['-m', 'workflowhub', 'serve', '--port', '8794'], cwd: 'backend' }
  },
  {
    id: 'ra',
    name: '录放台 Recorded Automation',
    category: 'browser',
    summary: '确定性浏览器自动化回放引擎：操作录制为可审阅工作流，支持无头环境精确回放与留痕。',
    port: 8795,
    env: 'RA_BASE_URL',
    dir: 'recorded-automation',
    launch: { command: PY, args: ['agent/server.py'] }
  },
  {
    id: 'jingjie',
    name: '竞界 JingJie 深度维护',
    category: 'system',
    summary: 'Windows 深度清洁与维护工作台：已装软件与开机项全量盘点、空间清理计划预览与安全隔离。',
    port: 8796,
    env: 'JINGJIE_BASE_URL',
    dir: 'JingJie',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'afa',
    name: '网申表单助手 AFA',
    category: 'browser',
    summary: 'ATS 网申职位申请表自动填写能力面：表单要素解析、主观题库匹配与填报映射规划。',
    port: 8797,
    env: 'AFA_BASE_URL',
    dir: 'application-form-assistant',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'commander',
    name: 'AI Project Commander',
    category: 'orchestration',
    summary: '本地项目综合管理中枢：项目全景清单、自动化构建与单测门禁扫描、风险指标与下一步行动。',
    port: 8787,
    env: 'COMMANDER_BASE_URL',
    dir: 'AI-Project-Commander',
    launch: { command: 'node', args: ['src/server/cli.js', 'start'] }
  },
  {
    id: 'trendscope',
    name: 'TrendScope 趋势分析',
    category: 'trend',
    summary: '全网内容趋势与爆款选题工作台：多渠道热点采集、动量评分、聚类主题与 Studio 内容规划。',
    port: 5184,
    env: 'TRENDSCOPE_BASE_URL',
    dir: 'trendscope',
    launch: { command: 'node', args: ['dist-server/index.js'] }
  },
  {
    id: 'geo',
    name: 'ZTT GEO 事实源',
    category: 'geo',
    summary: '个人品牌事实源与 AEO/GEO 内容工坊：实体事实维护、高意图提问家族挖掘与可发布内容包构建。',
    port: 3000,
    env: 'GEO_BASE_URL',
    dir: 'geo',
    launch: { command: 'npm', args: ['run', 'dev'], shell: true }
  },
  {
    id: 'acb',
    name: 'Agent Context Bridge',
    category: 'orchestration',
    summary: '跨机器项目交接中枢：Git 状态封存、任务与交接记录管理、目标工作区恢复报告。',
    port: 5174,
    env: 'ACB_BASE_URL',
    dir: 'acb-ui',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'personal_agent_hub',
    name: 'Personal Agent Hub (Tcode)',
    category: 'orchestration',
    summary: '个人智能体知识库中枢：RAG 语义检索、个人画像、长期记忆、安全文件读写与命令执行。',
    port: 8778,
    env: 'PERSONAL_AGENT_HUB_BASE_URL',
    dir: 'personal-agent-hub',
    launch: { command: 'node', args: ['agent/server.mjs'] }
  },
  {
    id: 'mao',
    name: 'Multi-Agent Orchestrator',
    category: 'orchestration',
    summary: '多智能体软件工程协同编排运行时：多角色分工（架构/编码/评审）、调度器与闭环交付判定。',
    port: 8766,
    env: 'MAO_BASE_URL',
    dir: 'multi-agent-orchestrator',
    launch: { command: PY, args: ['agent/server.py'] }
  }
];

// 活跃子进程表
const RUNNING_PROCESSES = new Map();

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id || p.id === id.replace(/[-_]/g, ''));
}

export function getProjectDirectory(project) {
  return path.join(ROOT_PROJECTS, project.dir);
}

export function getProjectBaseUrl(project) {
  const envVal = process.env[project.env];
  if (envVal) return envVal.replace(/\/+$/, '');
  const epFile = path.join(getProjectDirectory(project), 'agent', '.endpoint');
  if (existsSync(epFile)) {
    try {
      const u = readFileSync(epFile, 'utf8').trim();
      if (u) return u.replace(/\/+$/, '');
    } catch { /* ignore */ }
  }
  return `http://127.0.0.1:${project.port}`;
}

export async function isOnline(project, timeoutMs = 1500) {
  const base = getProjectBaseUrl(project);
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function authFor(base, project) {
  try {
    const r = await fetch(`${base}/api/agent/manifest`, { signal: AbortSignal.timeout(3000) });
    const body = await r.json().catch(() => ({}));
    const api = body?.data?.api || {};
    const header = String(api.token_header || `x-${project.id}-token`).toLowerCase();
    let token = process.env.AGENT_API_TOKEN || process.env[`${project.id.toUpperCase()}_TOKEN`];
    if (!token && api.token_file && existsSync(api.token_file)) {
      token = readFileSync(api.token_file, 'utf8').trim();
    }
    if (!token) {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      for (const cand of [project.id, 'agent', project.name]) {
        const tf = path.join(appData, cand, 'agent-api.token');
        if (existsSync(tf)) {
          token = readFileSync(tf, 'utf8').trim();
          if (token) break;
        }
      }
    }
    return { header, token };
  } catch {
    return { header: `x-${project.id}-token` };
  }
}

export function readToken(project) {
  const envTok = process.env.AGENT_API_TOKEN || process.env[`${project.id.toUpperCase()}_TOKEN`];
  if (envTok) return envTok;
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  for (const cand of [project.id, 'agent', project.name]) {
    const tokenFile = path.join(appData, cand, 'agent-api.token');
    if (existsSync(tokenFile)) {
      try {
        const t = readFileSync(tokenFile, 'utf8').trim();
        if (t) return t;
      } catch { /* ignore */ }
    }
  }
  return null;
}


export async function startProject(project, maxWaitMs = 15000) {
  if (await isOnline(project)) {
    return { ok: true, status: 'already_running', base_url: getProjectBaseUrl(project) };
  }
  const projectDir = getProjectDirectory(project);
  const cwd = project.launch.cwd ? path.resolve(projectDir, project.launch.cwd) : projectDir;
  const launchFile = path.join(projectDir, 'agent', 'launch.json');
  let cmd = project.launch.command;
  let args = project.launch.args || [];
  if (existsSync(launchFile)) {
    try {
      const spec = JSON.parse(readFileSync(launchFile, 'utf8'));
      if (spec.command) cmd = spec.command;
      if (spec.args) args = spec.args;
      if (spec.cwd) cwd = path.resolve(projectDir, spec.cwd);
    } catch { /* use default */ }
  }

  const child = spawn(cmd, args, {
    cwd,
    stdio: 'ignore',
    detached: true,
    shell: project.launch.shell === true,
    env: { ...process.env, AGENT_PORT: String(project.port) }
  });
  child.unref();
  RUNNING_PROCESSES.set(project.id, child);

  const t0 = Date.now();
  while (Date.now() - t0 < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isOnline(project, 800)) {
      return { ok: true, status: 'started', base_url: getProjectBaseUrl(project) };
    }
  }
  return { ok: false, status: 'timeout', error: `服务启动超时 (${maxWaitMs}ms)` };
}

export function stopProject(project) {
  const child = RUNNING_PROCESSES.get(project.id);
  if (child && child.pid) {
    try {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      RUNNING_PROCESSES.delete(project.id);
      return { ok: true, message: '进程已终止' };
    } catch {
      try { child.kill(); } catch { /* ignore */ }
    }
  }
  return { ok: true, message: '无常驻托管子进程' };
}

export async function getProjectTools(project) {
  const base = getProjectBaseUrl(project);
  if (await isOnline(project, 1000)) {
    try {
      const res = await fetch(`${base}/api/agent/tools`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const body = await res.json();
        if (body.ok && Array.isArray(body.data)) return body.data;
      }
    } catch { /* fallback to static */ }
  }
  return getStaticTools(project);
}

export function getStaticTools(project) {
  const projectDir = getProjectDirectory(project);
  const mjsPath = path.join(projectDir, 'agent', 'tools.mjs');
  const pyPath = path.join(projectDir, 'agent', 'tools.py');
  const tools = [];

  if (existsSync(mjsPath)) {
    try {
      const content = readFileSync(mjsPath, 'utf8');
      const matches = [...content.matchAll(/name:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]+)['"]/g)];
      for (const m of matches) {
        tools.push({
          name: m[1],
          description: m[2],
          risk: 'read',
          input_schema: { type: 'object', properties: {} }
        });
      }
    } catch { /* ignore */ }
  } else if (existsSync(pyPath)) {
    try {
      const content = readFileSync(pyPath, 'utf8');
      const matches = [...content.matchAll(/['"]name['"]:\s*['"]([^'"]+)['"],\s*['"]description['"]:\s*['"]([^'"]+)['"]/g)];
      for (const m of matches) {
        tools.push({
          name: m[1],
          description: m[2],
          risk: 'read',
          input_schema: { type: 'object', properties: {} }
        });
      }
    } catch { /* ignore */ }
  }
  return tools;
}

const PREFIX_MAP = {
  hub: 'personal_agent_hub',
  personal_agent_hub: 'personal_agent_hub',
  tcode: 'personal_agent_hub',
  frameboost: 'frameboost',
  agentaudio: 'agentaudio',
  agentcanvas: 'agentcanvas',
  agentcut: 'agentcut',
  sucai: 'sucai',
  qingying: 'qingying',
  vocal: 'vocal',
  workflowhub: 'workflowhub',
  ra: 'ra',
  jingjie: 'jingjie',
  afa: 'afa',
  commander: 'commander',
  trendscope: 'trendscope',
  geo: 'geo',
  acb: 'acb',
  mao: 'mao'
};

export async function invokeTool(toolName, input = {}, autoStart = true) {
  // 识别所属项目
  let targetProject = null;
  const prefix = toolName.split('.')[0].toLowerCase();
  if (PREFIX_MAP[prefix]) {
    targetProject = PROJECTS.find((p) => p.id === PREFIX_MAP[prefix]);
  }
  if (!targetProject) {
    targetProject = PROJECTS.find((p) => p.id === prefix || toolName.startsWith(p.id) || toolName.startsWith(`${p.id}.`));
  }
  if (!targetProject) {
    for (const p of PROJECTS) {
      if (toolName.toLowerCase().includes(p.id)) {
        targetProject = p;
        break;
      }
    }
  }

  if (!targetProject) {
    throw new Error(`无法识别工具 [${toolName}] 所属项目。可用前缀: ${PROJECTS.map(p => p.id).join(', ')}`);
  }

  // 检查是否在线，离线则自动拉起
  if (!(await isOnline(targetProject))) {
    if (!autoStart) {
      throw new Error(`项目 [${targetProject.name}] 服务未启动。`);
    }
    const startRes = await startProject(targetProject);
    if (!startRes.ok) {
      throw new Error(`自动启动 [${targetProject.name}] 服务失败: ${startRes.error}`);
    }
  }

  const base = getProjectBaseUrl(targetProject);
  const auth = await authFor(base, targetProject);
  const headers = { 'content-type': 'application/json' };
  if (auth.token) {
    headers[auth.header || `x-${targetProject.id}-token`] = auth.token;
    headers[`x-${targetProject.id}-token`] = auth.token;
    headers['x-agent-token'] = auth.token;
    headers['authorization'] = `Bearer ${auth.token}`;
  }

  const res = await fetch(`${base}/api/agent/tool`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tool: toolName, input }),
    signal: AbortSignal.timeout(120000)
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch { errBody = { message: await res.text() }; }
    throw new Error(`工具调用失败 (HTTP ${res.status}): ${JSON.stringify(errBody?.error || errBody)}`);
  }

  if (ct.includes('application/json')) {
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }
  return await res.text();
}
