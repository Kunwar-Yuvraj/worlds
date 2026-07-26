import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_auth_header(client: AsyncClient, email: str = "author@example.com") -> dict:
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Author Test"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_full_crud_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = await get_auth_header(client)

        # 1. Create Novel
        novel_resp = await client.post("/api/v1/novels", headers=headers, json={
            "title": "The Cyberpunk Odyssey",
            "genre": "Sci-Fi",
            "tone": "Dark",
            "style": "Fast-paced",
            "pov": "First Person"
        })
        assert novel_resp.status_code == 201
        novel = novel_resp.json()
        novel_id = novel["id"]
        assert novel["title"] == "The Cyberpunk Odyssey"

        # List Novels
        list_resp = await client.get("/api/v1/novels", headers=headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        # 2. Create Chapter
        chap_resp = await client.post(f"/api/v1/novels/{novel_id}/chapters", headers=headers, json={
            "chapter_number": 1,
            "title": "Neon Shadows",
            "content": "Rain washed over the neon streets of District 9.",
            "summary": "Introduction to the main character in District 9."
        })
        assert chap_resp.status_code == 201
        chap = chap_resp.json()
        chap_id = chap["id"]
        assert chap["word_count"] == 9

        # Update Chapter
        chap_up = await client.put(f"/api/v1/chapters/{chap_id}", headers=headers, json={
            "content": "Rain washed over the glowing neon streets of District 9."
        })
        assert chap_up.status_code == 200
        assert chap_up.json()["word_count"] == 10

        # 3. Create Character
        char_resp = await client.post(f"/api/v1/novels/{novel_id}/characters", headers=headers, json={
            "name": "Kaelen Vane",
            "role": "protagonist",
            "description": "Cybernetic hacker",
            "personality_traits": {"cunning": True, "loyal": False}
        })
        assert char_resp.status_code == 201
        char_id = char_resp.json()["id"]

        # 4. Create Location
        loc_resp = await client.post(f"/api/v1/novels/{novel_id}/locations", headers=headers, json={
            "name": "District 9 Spire",
            "description": "A 100-story mega tower",
            "significance": "HQ of the syndicate"
        })
        assert loc_resp.status_code == 201
        loc_id = loc_resp.json()["id"]

        # 5. Create Timeline Event
        time_resp = await client.post(f"/api/v1/novels/{novel_id}/timeline", headers=headers, json={
            "event_order": 1,
            "title": "Hack at District 9",
            "description": "Kaelen breaches the server core.",
            "chapter_id": chap_id
        })
        assert time_resp.status_code == 201
        time_id = time_resp.json()["id"]

        # 6. Create Outline
        out_resp = await client.post(f"/api/v1/novels/{novel_id}/outlines", headers=headers, json={
            "chapter_number": 1,
            "title": "Breaching District 9",
            "synopsis": "Kaelen infiltrates District 9 spire.",
            "target_word_count": 2500
        })
        assert out_resp.status_code == 201
        out_id = out_resp.json()["id"]

        # 7. Create World Rule
        rule_resp = await client.post(f"/api/v1/novels/{novel_id}/world-rules", headers=headers, json={
            "rule_name": "Net-Link Limit",
            "category": "technology",
            "description": "Direct neural link exceeds 30 minutes without heatsink."
        })
        assert rule_resp.status_code == 201
        rule_id = rule_resp.json()["id"]

        # Verify List Endpoints
        assert len((await client.get(f"/api/v1/novels/{novel_id}/chapters", headers=headers)).json()) == 1
        assert len((await client.get(f"/api/v1/novels/{novel_id}/characters", headers=headers)).json()) == 1
        assert len((await client.get(f"/api/v1/novels/{novel_id}/locations", headers=headers)).json()) == 1
        assert len((await client.get(f"/api/v1/novels/{novel_id}/timeline", headers=headers)).json()) == 1
        assert len((await client.get(f"/api/v1/novels/{novel_id}/outlines", headers=headers)).json()) == 1
        assert len((await client.get(f"/api/v1/novels/{novel_id}/world-rules", headers=headers)).json()) == 1

        # Delete Novel (Cascades all)
        del_resp = await client.delete(f"/api/v1/novels/{novel_id}", headers=headers)
        assert del_resp.status_code == 204

        # Confirm deleted
        get_del = await client.get(f"/api/v1/novels/{novel_id}", headers=headers)
        assert get_del.status_code == 404


@pytest.mark.asyncio
async def test_user_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers_user_a = await get_auth_header(client, "user_a@example.com")
        headers_user_b = await get_auth_header(client, "user_b@example.com")

        # User A creates a novel
        res_a = await client.post("/api/v1/novels", headers=headers_user_a, json={"title": "User A Novel"})
        novel_id_a = res_a.json()["id"]

        # User B attempts to view User A's novel -> 404
        res_b_get = await client.get(f"/api/v1/novels/{novel_id_a}", headers=headers_user_b)
        assert res_b_get.status_code == 404

        # User B attempts to add a chapter to User A's novel -> 404
        res_b_post = await client.post(f"/api/v1/novels/{novel_id_a}/chapters", headers=headers_user_b, json={
            "chapter_number": 1,
            "title": "Unauthorized Chapter"
        })
        assert res_b_post.status_code == 404
