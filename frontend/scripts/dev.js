/**
 * 用法：node scripts/dev.js
 * 从项目根目录 config.jsonc 读取前端端口，启动 next dev。
 */
const { resolve } = require("node:path");
const { execSync } = require("node:child_process");
const { readSync } = require("jsonc");

const ports = readSync(resolve(__dirname, "../../config.jsonc"));

execSync(`npx next dev --port ${ports.frontend}`, { stdio: "inherit" });