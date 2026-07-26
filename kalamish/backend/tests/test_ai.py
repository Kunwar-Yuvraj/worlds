import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_auth_header(client: AsyncClient, email: str = "ai_tester@example.com") -> tuple[dict, str]:
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "AI Tester"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


@pytest.mark.asyncio
async def test_ai_endpoints_suite():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers, _ = await get_auth_header(client)

        # 1. Setup Novel and Chapter
        novel_res = await client.post("/api/v1/novels", headers=headers, json={"title": "AI Odyssey", "genre": "Sci-Fi"})
        assert novel_res.status_code == 201
        novel_id = novel_res.json()["id"]

        chap_res = await client.post(f"/api/v1/novels/{novel_id}/chapters", headers=headers, json={
            "chapter_number": 1,
            "title": "Initial Scene",
            "content": "The starship hovered over the crimson sands."
        })
        assert chap_res.status_code == 201
        chap_id = chap_res.json()["id"]

        # 2. Test /ai/generate
        gen_res = await client.post("/api/v1/ai/generate", headers=headers, json={
            "novel_id": novel_id,
            "chapter_id": chap_id,
            "user_instruction": "Describe the descent onto the alien planet."
        })
        assert gen_res.status_code == 200
        gen_data = gen_res.json()
        assert "edited_content" in gen_data
        assert len(gen_data["logs"]) > 0

        # 3. Test /ai/rewrite (standard)
        rewrite_res = await client.post("/api/v1/ai/rewrite", headers=headers, json={
            "chapter_id": chap_id,
            "user_instruction": "Add more sensory details to the rain.",
            "stream": False
        })
        assert rewrite_res.status_code == 200
        assert "content" in rewrite_res.json()

        # 4. Test /ai/rewrite (streaming SSE)
        stream_res = await client.post("/api/v1/ai/rewrite", headers=headers, json={
            "chapter_id": chap_id,
            "user_instruction": "Stream scene addition.",
            "stream": True
        })
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers["content-type"]
        body_text = stream_res.text
        assert "data:" in body_text

        # 5. Test /ai/revise-story
        revise_res = await client.post("/api/v1/ai/revise-story", headers=headers, json={
            "novel_id": novel_id,
            "revision_instruction": "Change ship name to Prometheus.",
            "target_chapter_ids": [chap_id]
        })
        assert revise_res.status_code == 200
        rev_data = revise_res.json()
        assert rev_data["revised_chapters_count"] == 1

        # 6. Test /chat
        chat_res = await client.post("/api/v1/ai/chat", headers=headers, json={
            "novel_id": novel_id,
            "message": "What is a good plot twist for chapter 2?"
        })
        assert chat_res.status_code == 200
        assert "reply" in chat_res.json()

        # 7. Test /search
        search_res = await client.post("/api/v1/search", headers=headers, json={
            "novel_id": novel_id,
            "query": "crimson sands",
            "limit": 3
        })
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["query"] == "crimson sands"
        assert isinstance(search_data["results"], list)
