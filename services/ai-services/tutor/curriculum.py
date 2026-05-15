"""
Minimal filesystem curriculum loader for the tutor service.

The Node backend has its own copy (services/backend-api/src/curriculum/);
duplicating the loader here lets the tutor service stand alone and inject
lesson content as cached system context without an extra network hop.

If this duplication grows beyond reading three files per topic, move to a
shared curriculum HTTP endpoint that both services consume.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


@dataclass(frozen=True)
class Topic:
    topic_id: str
    title: str
    grade: int
    caps_reference: str
    learning_outcomes: list[str]
    lesson_markdown: str


def _curriculum_root() -> Path:
    override = os.environ.get("CURRICULUM_ROOT")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[3] / "curriculum-data"


def _walk(dir_: Path) -> Iterator[Path]:
    for entry in dir_.iterdir():
        if not entry.is_dir():
            continue
        metadata = entry / "metadata.json"
        if metadata.exists():
            yield entry
        else:
            yield from _walk(entry)


def load_all() -> dict[str, Topic]:
    """Load every topic from disk into a dict keyed by topicId."""
    root = _curriculum_root()
    topics: dict[str, Topic] = {}
    if not root.exists():
        return topics

    for topic_dir in _walk(root):
        meta = json.loads((topic_dir / "metadata.json").read_text())
        lesson = (topic_dir / "lesson.md").read_text()
        topic = Topic(
            topic_id=meta["topicId"],
            title=meta["title"],
            grade=meta["grade"],
            caps_reference=meta["capsReference"],
            learning_outcomes=meta.get("learningOutcomes", []),
            lesson_markdown=lesson,
        )
        topics[topic.topic_id] = topic
    return topics


def context_for_prompt(topic: Topic) -> str:
    """Render a topic into a compact block suitable for the system prompt."""
    outcomes = "\n".join(f"  - {o}" for o in topic.learning_outcomes)
    return (
        f"Topic: {topic.title} (Grade {topic.grade}, {topic.caps_reference})\n"
        f"Learning outcomes:\n{outcomes}\n\n"
        f"Lesson content:\n{topic.lesson_markdown}"
    )
