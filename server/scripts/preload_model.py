"""从 HuggingFace 下载 Kronos 模型与 Tokenizer 到本地 models/ 目录。"""

import sys
from pathlib import Path

# 将项目根目录加入 sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.model import Kronos, KronosTokenizer

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
KRONOS_MODEL_DIR = MODEL_DIR / "kronos-model"
KRONOS_TOKENIZER_DIR = MODEL_DIR / "kronos-tokenizer"

# HuggingFace 模型仓库标识
MODEL_NAME = "NeoQuasar/Kronos-base"
TOKENIZER_NAME = "NeoQuasar/Kronos-Tokenizer-base"


def main():
    """下载并保存模型与 Tokenizer 到本地目录。"""
    KRONOS_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    KRONOS_TOKENIZER_DIR.mkdir(parents=True, exist_ok=True)

    print(f"正在下载 Kronos Tokenizer ({TOKENIZER_NAME})...")
    tokenizer = KronosTokenizer.from_pretrained(TOKENIZER_NAME)
    tokenizer.save_pretrained(str(KRONOS_TOKENIZER_DIR))
    print(f"Tokenizer 已保存到 {KRONOS_TOKENIZER_DIR}")

    print(f"正在下载 Kronos Model ({MODEL_NAME})...")
    model = Kronos.from_pretrained(MODEL_NAME)
    model.save_pretrained(str(KRONOS_MODEL_DIR))
    print(f"模型已保存到 {KRONOS_MODEL_DIR}")


if __name__ == "__main__":
    main()