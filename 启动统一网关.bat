@echo off
chcp 65001 >nul
title 统一 Agent 开放 API 网关 & MCP 中枢
cd /d "%~dp0"
echo ===================================================
echo   统一 Agent 开放 API 网关 & MCP 中枢服务
echo   - 访问地址: http://127.0.0.1:8888
echo   - 纳管项目: 17 个全量软件工程能力面
echo   - MCP 服务: node mcp-server.mjs
echo ===================================================
node gateway.mjs
pause
