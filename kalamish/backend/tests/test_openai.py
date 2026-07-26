import pytest
from app.services.llm_service import LLMService
from app.agents.writer import WriterAgent
from app.schemas.context_package import ContextPackage
from app.graph import novel_workflow_app


@pytest.mark.asyncio
async def test_llm_service_live_generation():
    llm = LLMService()
    prompt = "Write a 2-sentence description of a futuristic neon cybernetic city."
    response = await llm.generate_text(prompt=prompt, temperature=0.7)

    assert isinstance(response, str)
    assert len(response) > 10
    print(f"\n[OPENAI LLM TEST OUTPUT]:\n{response}")


@pytest.mark.asyncio
async def test_writer_agent_openai_integration():
    writer = WriterAgent()
    context_package = ContextPackage(
        novel={"title": "Neo Tokyo 2099", "genre": "Cyberpunk", "tone": "Gripping", "pov": "Third Person"},
        chapter={"title": "Shadows in the Grid", "chapter_number": 1},
        outline={"synopsis": "Protagonist Kael breaches a high-security neural vault."},
        user_instruction="Make the scene tense and atmospheric."
    )

    result = await writer.execute_async(context_package)
    assert "draft_content" in result
    assert result["word_count"] > 15
    print(f"\n[WRITER AGENT GENERATED PROSE]:\n{result['draft_content'][:300]}...")


@pytest.mark.asyncio
async def test_langgraph_workflow_with_openai():
    initial_state = {
        "user_instruction": "Generate chapter 1 where detective Vance investigates an AI crime scene.",
        "request_type": "GENERATE_CHAPTER",
        "novel_id": "cyber-novel-99",
        "raw_context": {
            "novel": {"title": "Synthetic Murder", "genre": "Sci-Fi Noir"},
            "chapter": {"title": "The Glass Room", "chapter_number": 1}
        }
    }

    final_state = await novel_workflow_app.ainvoke(initial_state)

    assert "draft_content" in final_state
    assert len(final_state["draft_content"]) > 20
    assert any("Writer: Generated draft" in log for log in final_state["logs"])
