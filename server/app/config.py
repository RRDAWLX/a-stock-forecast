"""全局配置常量，从项目根目录 config.jsonc 读取并定义路径与预测参数。"""

import json
import re
from pathlib import Path

_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "config.jsonc"


def _strip_json_comments(text: str) -> str:
    text = re.sub(r"//.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*[\s\S]*?\*/", "", text)
    return text


def _load_config() -> dict:
    raw = _CONFIG_PATH.read_text(encoding="utf-8")
    return json.loads(_strip_json_comments(raw))


_config = _load_config()

FRONTEND_PORT: int = _config["frontend"]
BACKEND_PORT: int = _config["backend"]
REAL_DATA_DAYS: int = _config["realDataDays"]
PRED_OUTPUT_DAYS: int = _config["predOutputDays"]
OVERLAP_DAYS: int = _config["overlapDays"]

# 项目根目录（server/）
BASE_DIR = Path(__file__).resolve().parent.parent

# 模型权重存放目录
MODEL_DIR = BASE_DIR / "models"
# 数据目录（搜索历史等）
DATA_DIR = BASE_DIR / "data"
# 搜索历史 JSON 文件路径
SEARCH_HISTORY_FILE = DATA_DIR / "search_history.json"

