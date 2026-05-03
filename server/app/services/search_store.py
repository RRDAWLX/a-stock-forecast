"""搜索历史的文件存储与增删查操作。"""

import json
from datetime import datetime

from app.config import SEARCH_HISTORY_FILE
from app.schemas.response import SearchHistoryItem


def _ensure_file() -> None:
    """确保搜索历史文件及其父目录存在，若不存在则创建空列表文件。"""
    SEARCH_HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not SEARCH_HISTORY_FILE.exists():
        SEARCH_HISTORY_FILE.write_text("[]", encoding="utf-8")


def load_history() -> list[SearchHistoryItem]:
    """从磁盘加载搜索历史列表。"""
    _ensure_file()
    try:
        data = json.loads(SEARCH_HISTORY_FILE.read_text(encoding="utf-8"))
        items = []
        for item in data:
            if "realDataDays" not in item:
                item["realDataDays"] = 120
            if "predOutputDays" not in item:
                item["predOutputDays"] = 30
            if "overlapDays" not in item:
                item["overlapDays"] = 20
            items.append(SearchHistoryItem(**item))
        return items
    except (json.JSONDecodeError, Exception):
        return []


def save_history(items: list[SearchHistoryItem]) -> None:
    """将搜索历史列表持久化到磁盘。"""
    _ensure_file()
    data = [item.model_dump() for item in items]
    SEARCH_HISTORY_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def add_search_record(
    code: str, name: str, real_data_days: int, pred_output_days: int, overlap_days: int
) -> list[SearchHistoryItem]:
    """添加一条搜索记录（若已存在则移至首位），返回更新后的列表。"""
    items = load_history()
    items = [
        item
        for item in items
        if not (
            item.code == code
            and item.realDataDays == real_data_days
            and item.predOutputDays == pred_output_days
            and item.overlapDays == overlap_days
        )
    ]
    items.insert(
        0,
        SearchHistoryItem(
            code=code,
            name=name,
            time=datetime.now().isoformat(timespec="seconds"),
            realDataDays=real_data_days,
            predOutputDays=pred_output_days,
            overlapDays=overlap_days,
        ),
    )
    save_history(items)
    return items
