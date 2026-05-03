"""启动后端服务，端口从项目根目录 config.jsonc 读取。

用法：cd server && uv run scripts/run_dev.py
"""

import uvicorn
from app.config import BACKEND_PORT, FRONTEND_PORT

if __name__ == "__main__":
    print(f"frontend port: {FRONTEND_PORT}, backend port: {BACKEND_PORT}")
    uvicorn.run("app.main:app", host="127.0.0.1", port=BACKEND_PORT, reload=True)
