import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_full_system_end_to_end():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. System Health Checks
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert "Welcome" in root_res.json()["message"]

        # 2. Auth Flow: Register & Login
        email = "e2e_author@example.com"
        password = "Password123!"
        reg_res = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "E2E Author"
        })
        assert reg_res.status_code == 201

        login_res = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Profile check
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email

        # 3. CRUD Suite: Create Novel & Entities
        novel_res = await client.post("/api/v1/novels", headers=headers, json={
            "title": "E2E Masterpiece",
            "genre": "Cyberpunk Thriller",
            "tone": "Dark",
            "style": "Fast-Paced"
        })
        assert novel_res.status_code == 201
        novel_id = novel_res.json()["id"]

        chap_res = await client.post(f"/api/v1/novels/{novel_id}/chapters", headers=headers, json={
            "chapter_number": 1,
            "title": "The Awakening",
            "content": "Kaiden opened his eyes in the dimly lit rain-soaked alleyway."
        })
        assert chap_res.status_code == 201
        chap_id = chap_res.json()["id"]

        char_res = await client.post(f"/api/v1/novels/{novel_id}/characters", headers=headers, json={
            "name": "Kaiden Vance",
            "role": "protagonist",
            "description": "Cybernetically enhanced detective."
        })
        assert char_res.status_code == 201

        loc_res = await client.post(f"/api/v1/novels/{novel_id}/locations", headers=headers, json={
            "name": "District 9 Spire",
            "description": "Mega-corporation headquarters."
        })
        assert loc_res.status_code == 201

        out_res = await client.post(f"/api/v1/novels/{novel_id}/outlines", headers=headers, json={
            "chapter_number": 1,
            "title": "The Awakening",
            "synopsis": "Kaiden wakes up with missing memory fragments."
        })
        assert out_res.status_code == 201

        rule_res = await client.post(f"/api/v1/novels/{novel_id}/world-rules", headers=headers, json={
            "rule_name": "Neural Overheat",
            "category": "cybernetics",
            "description": "Using level 4 hacks causes 30-second system freeze."
        })
        assert rule_res.status_code == 201

        time_res = await client.post(f"/api/v1/novels/{novel_id}/timeline", headers=headers, json={
            "event_order": 1,
            "title": "Alley Awakening",
            "description": "Kaiden regains consciousness.",
            "chapter_id": chap_id
        })
        assert time_res.status_code == 201

        # 4. AI Generation via LangGraph & OpenAI
        gen_res = await client.post("/api/v1/ai/generate", headers=headers, json={
            "novel_id": novel_id,
            "chapter_id": chap_id,
            "user_instruction": "Write the moment Kaiden activates his optical scanner."
        })
        assert gen_res.status_code == 200
        gen_data = gen_res.json()
        assert "edited_content" in gen_data
        assert len(gen_data["logs"]) == 6

        # 5. Chapter Rewriting (Standard & Streaming)
        rewrite_res = await client.post("/api/v1/ai/rewrite", headers=headers, json={
            "chapter_id": chap_id,
            "user_instruction": "Enhance the neon aesthetic.",
            "stream": False
        })
        assert rewrite_res.status_code == 200

        stream_res = await client.post("/api/v1/ai/rewrite", headers=headers, json={
            "chapter_id": chap_id,
            "user_instruction": "Stream chapter rewrite.",
            "stream": True
        })
        assert stream_res.status_code == 200
        assert "data:" in stream_res.text

        # 6. Story-Wide Revision
        rev_res = await client.post("/api/v1/ai/revise-story", headers=headers, json={
            "novel_id": novel_id,
            "revision_instruction": "Adjust protagonist age to 32.",
            "target_chapter_ids": [chap_id]
        })
        assert rev_res.status_code == 200
        assert rev_res.json()["revised_chapters_count"] == 1

        # 7. Semantic Vector Search
        search_res = await client.post("/api/v1/search", headers=headers, json={
            "novel_id": novel_id,
            "query": "Neural Overheat",
            "limit": 5
        })
        assert search_res.status_code == 200

        # 8. Author Chat Assistant
        chat_res = await client.post("/api/v1/ai/chat", headers=headers, json={
            "novel_id": novel_id,
            "message": "Give me 3 villain names for District 9."
        })
        assert chat_res.status_code == 200
        assert len(chat_res.json()["reply"]) > 5
