"""从项目根目录 config.jsonc 同步端口配置到各处。"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PORTS_PATH = ROOT / "config.jsonc"


def strip_json_comments(text: str) -> str:
    text = re.sub(r"//.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*[\s\S]*?\*/", "", text)
    return text


def load_ports() -> dict:
    raw = PORTS_PATH.read_text(encoding="utf-8")
    return json.loads(strip_json_comments(raw))


def sync_env_development(ports: dict) -> None:
    env_path = ROOT / "frontend" / ".env.development"
    content = (
        f"# 端口号来源于项目根目录 config.jsonc，修改端口请编辑该文件后运行 uv run scripts/sync_ports.py\n"
        f"NEXT_PUBLIC_SSE_BASE=http://localhost:{ports['backend']}/api\n"
    )
    env_path.write_text(content, encoding="utf-8")
    print(f"synced {env_path}")


def main() -> None:
    ports = load_ports()
    sync_env_development(ports)
    print(f"ports synced: frontend={ports['frontend']}, backend={ports['backend']}")


if __name__ == "__main__":
    main()
