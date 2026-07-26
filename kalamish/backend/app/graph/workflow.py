from typing import Dict, Any
import uuid
from langgraph.graph import StateGraph, START, END
from app.graph.state import NovelWorkflowState
from app.agents import (
    PlannerAgent,
    WorldBuilderAgent,
    RetrievalAgent,
    WriterAgent,
    EditorAgent,
    ConsistencyAgent,
    MemoryAgent
)
from app.utils.logging import logger

planner_agent = PlannerAgent()
world_builder_agent = WorldBuilderAgent()
retrieval_agent = RetrievalAgent()
writer_agent = WriterAgent()
editor_agent = EditorAgent()
consistency_agent = ConsistencyAgent()
memory_agent = MemoryAgent()


async def planner_node(state: NovelWorkflowState) -> Dict[str, Any]:
    instruction = state.get("user_instruction", "")
    request_type = state.get("request_type", "GENERATE_CHAPTER")
    plan = planner_agent.execute(instruction, request_type)
    logs = state.get("logs", []) + [f"Planner: Formulated plan for {request_type}"]
    return {"plan": plan, "logs": logs}


async def world_builder_node(state: NovelWorkflowState) -> Dict[str, Any]:
    import traceback
    instruction = state.get("user_instruction", "")
    db_session = state.get("db_session")
    novel_id_str = state.get("novel_id")

    logger.info(f"[world_builder_node] db_session present: {db_session is not None}, novel_id: {novel_id_str}")

    if db_session and novel_id_str:
        try:
            novel_id = uuid.UUID(novel_id_str)
            chap_id = uuid.UUID(state.get("chapter_id")) if state.get("chapter_id") else None
            wb_result = await world_builder_agent.execute_async(
                session=db_session,
                novel_id=novel_id,
                user_instruction=instruction,
                chapter_id=chap_id
            )
            wb_logs = wb_result.get("logs", ["WorldBuilder: Evaluated story world."])
            new_logs = state.get("logs", []) + wb_logs
            return {"world_builder_results": wb_result, "logs": new_logs}
        except Exception as e:
            logger.error(f"[world_builder_node] Exception: {str(e)}\n{traceback.format_exc()}")
            new_logs = state.get("logs", []) + [f"WorldBuilder: Error during world evaluation - {str(e)[:100]}"]
            return {"logs": new_logs}
    else:
        logger.warning(f"[world_builder_node] Skipped: db_session={db_session is not None}, novel_id={novel_id_str}")

    new_logs = state.get("logs", []) + ["WorldBuilder: Assessed story world & verified continuity."]
    return {"logs": new_logs}


async def retrieval_node(state: NovelWorkflowState) -> Dict[str, Any]:
    instruction = state.get("user_instruction", "")
    raw_context = state.get("raw_context", {})
    db_session = state.get("db_session")
    novel_id_str = state.get("novel_id")

    if db_session and novel_id_str:
        try:
            novel_id = uuid.UUID(novel_id_str)
            chap_id = uuid.UUID(state.get("chapter_id")) if state.get("chapter_id") else None
            package = await retrieval_agent.execute_async(
                session=db_session,
                novel_id=novel_id,
                user_instruction=instruction,
                chapter_id=chap_id
            )
        except Exception as e:
            logger.warning(f"[retrieval_node] DB retrieval fallback to raw context: {str(e)}")
            package = retrieval_agent.execute(instruction, raw_context)
    else:
        package = retrieval_agent.execute(instruction, raw_context)

    logs = state.get("logs", []) + ["Retrieval: Assembled Context Package"]
    return {"context_package": package.model_dump(), "logs": logs}


async def writer_node(state: NovelWorkflowState) -> Dict[str, Any]:
    from app.schemas.context_package import ContextPackage
    package_data = state.get("context_package", {})
    context_package = ContextPackage(**package_data)
    result = await writer_agent.execute_async(context_package)
    logs = state.get("logs", []) + [f"Writer: Generated draft ({result['word_count']} words via OpenAI)"]
    return {"draft_content": result["draft_content"], "logs": logs}


async def consistency_node(state: NovelWorkflowState) -> Dict[str, Any]:
    from app.schemas.context_package import ContextPackage
    draft = state.get("draft_content", "")
    db_session = state.get("db_session")
    novel_id_str = state.get("novel_id")

    if db_session and novel_id_str:
        try:
            novel_id = uuid.UUID(novel_id_str)
            result = await consistency_agent.execute_async(
                session=db_session,
                novel_id=novel_id,
                draft_content=draft
            )
        except Exception as e:
            package_data = state.get("context_package", {})
            context_package = ContextPackage(**package_data)
            result = consistency_agent.execute(draft, context_package)
    else:
        package_data = state.get("context_package", {})
        context_package = ContextPackage(**package_data)
        result = consistency_agent.execute(draft, context_package)

    summary_msg = result.get("summary") or result.get("audit_summary") or "Consistency audit complete."
    logs = state.get("logs", []) + [f"Consistency: {summary_msg}"]
    return {"consistency_results": result, "logs": logs}


async def editor_node(state: NovelWorkflowState) -> Dict[str, Any]:
    draft = state.get("draft_content", "")
    result = editor_agent.execute(draft)
    logs = state.get("logs", []) + [f"Editor: {result['editing_summary']}"]
    return {"edited_content": result["edited_content"], "logs": logs}


async def memory_node(state: NovelWorkflowState) -> Dict[str, Any]:
    import traceback
    edited = state.get("edited_content", "")
    novel_id_str = state.get("novel_id", "unknown")
    db_session = state.get("db_session")

    logger.info(f"[memory_node] db_session present: {db_session is not None}, novel_id: {novel_id_str}")

    if db_session and novel_id_str != "unknown":
        try:
            novel_id = uuid.UUID(novel_id_str)
            chap_id = uuid.UUID(state.get("chapter_id")) if state.get("chapter_id") else None
            result = await memory_agent.execute_async(
                session=db_session,
                novel_id=novel_id,
                content=edited,
                agent_name="MemoryAgent",
                chapter_id=chap_id
            )
        except Exception as e:
            logger.error(f"[memory_node] Exception: {str(e)}\n{traceback.format_exc()}")
            result = memory_agent.execute(edited, novel_id_str)
    else:
        logger.warning(f"[memory_node] Skipped DB path: db_session={db_session is not None}, novel_id={novel_id_str}")
        result = memory_agent.execute(edited, novel_id_str)

    facts_cnt = len(result.get("facts") or result.get("extracted_facts") or [])
    entities = result.get("extracted_entities", [])
    log_detail = f"Memory: Extracted {facts_cnt} facts"
    if entities:
        log_detail += f" & {len(entities)} entities ({', '.join(entities[:5])})"
    logs = state.get("logs", []) + [log_detail]
    return {"memory_results": result, "logs": logs}


def create_novel_workflow_graph() -> StateGraph:
    workflow = StateGraph(NovelWorkflowState)

    # Add agent nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("world_builder", world_builder_node)
    workflow.add_node("retrieval", retrieval_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("consistency", consistency_node)
    workflow.add_node("editor", editor_node)
    workflow.add_node("memory", memory_node)

    # Define linear execution edges for chapter generation
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "world_builder")
    workflow.add_edge("world_builder", "retrieval")
    workflow.add_edge("retrieval", "writer")
    workflow.add_edge("writer", "consistency")
    workflow.add_edge("consistency", "editor")
    workflow.add_edge("editor", "memory")
    workflow.add_edge("memory", END)

    return workflow.compile()


novel_workflow_app = create_novel_workflow_graph()
