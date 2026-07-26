import pytest
from app.agents import (
    PlannerAgent,
    RetrievalAgent,
    WriterAgent,
    EditorAgent,
    ConsistencyAgent,
    MemoryAgent,
    RevisionAgent
)
from app.schemas.context_package import ContextPackage
from app.graph import novel_workflow_app


def test_individual_agents():
    # 1. Planner
    planner = PlannerAgent()
    plan = planner.execute("Write chapter 1", "GENERATE_CHAPTER")
    assert plan["request_type"] == "GENERATE_CHAPTER"

    # 2. Retrieval
    retrieval = RetrievalAgent()
    package = retrieval.execute("Write chapter 1", {"novel": {"title": "Test Novel"}})
    assert isinstance(package, ContextPackage)
    assert package.novel["title"] == "Test Novel"

    # 3. Writer
    writer = WriterAgent()
    draft = writer.execute(package)
    assert "draft_content" in draft
    assert draft["word_count"] > 0

    # 4. Consistency
    consistency = ConsistencyAgent()
    audit = consistency.execute(draft["draft_content"], package)
    assert audit["passed"] is True

    # 5. Editor
    editor = EditorAgent()
    edited = editor.execute(draft["draft_content"])
    assert "edited_content" in edited

    # 6. Memory
    memory = MemoryAgent()
    mem_res = memory.execute(edited["edited_content"], "novel-uuid-123")
    assert len(mem_res["extracted_facts"]) > 0

    # 7. Revision
    revision = RevisionAgent()
    rev_res = revision.execute("Make protagonist braver", ["chap-1", "chap-2"])
    assert rev_res["status"] == "revision_planned"


@pytest.mark.asyncio
async def test_langgraph_workflow_execution():
    initial_state = {
        "user_instruction": "Write Chapter 1: The Outbreak",
        "request_type": "GENERATE_CHAPTER",
        "novel_id": "test-novel-123",
        "raw_context": {
            "novel": {"title": "Zombie Chronicles", "genre": "Horror"},
            "chapter": {"title": "The Outbreak"},
            "characters": [{"name": "Dr. Sarah", "role": "protagonist"}]
        }
    }

    final_state = await novel_workflow_app.ainvoke(initial_state)

    assert "plan" in final_state
    assert "context_package" in final_state
    assert "draft_content" in final_state
    assert "consistency_results" in final_state
    assert "edited_content" in final_state
    assert "memory_results" in final_state
    assert len(final_state["logs"]) == 6
    assert "Planner: Formulated plan for GENERATE_CHAPTER" in final_state["logs"][0]
