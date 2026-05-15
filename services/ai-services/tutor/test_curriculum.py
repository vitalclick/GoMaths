"""Tests for the tutor service's curriculum loader."""

from tutor.curriculum import context_for_prompt, load_all


def test_loads_grade_9_topics() -> None:
    topics = load_all()
    assert "g9.alg.linear-eq" in topics
    assert "g9.alg.exponents" in topics


def test_topic_has_lesson_content() -> None:
    topics = load_all()
    t = topics["g9.alg.linear-eq"]
    assert t.title == "Solving Linear Equations"
    assert t.grade == 9
    assert "linear equation" in t.lesson_markdown.lower()


def test_context_for_prompt_includes_outcomes_and_lesson() -> None:
    topics = load_all()
    block = context_for_prompt(topics["g9.alg.linear-eq"])
    assert "Solving Linear Equations" in block
    assert "Grade 9" in block
    assert "Lesson content" in block
    assert "Solve linear equations" in block
