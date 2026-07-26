import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token


# 1. Security Unit Tests
def test_password_hashing():
    raw_pwd = "SecretPassword123!"
    hashed = hash_password(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    data = {"sub": "12345678-1234-5678-1234-567812345678", "email": "test@example.com"}
    token = create_access_token(data)
    assert isinstance(token, str)

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == data["sub"]
    assert decoded["email"] == data["email"]


# 2. Integration API Tests
@pytest.mark.asyncio
async def test_full_auth_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # a. Register user
        register_payload = {
            "email": "author@example.com",
            "password": "Password123!",
            "full_name": "Jane Author"
        }
        res_reg = await client.post("/api/v1/auth/register", json=register_payload)
        assert res_reg.status_code == 201, res_reg.text
        reg_json = res_reg.json()
        assert reg_json["email"] == "author@example.com"
        assert reg_json["full_name"] == "Jane Author"
        assert "id" in reg_json

        # b. Duplicate registration attempt
        res_dup = await client.post("/api/v1/auth/register", json=register_payload)
        assert res_dup.status_code == 400

        # c. Login with wrong password
        res_bad_login = await client.post("/api/v1/auth/login", json={
            "email": "author@example.com",
            "password": "WrongPassword!"
        })
        assert res_bad_login.status_code == 401

        # d. Login with correct password
        res_login = await client.post("/api/v1/auth/login", json={
            "email": "author@example.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200
        token_data = res_login.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        access_token = token_data["access_token"]

        # e. Access protected route without token -> 403 / 401
        res_unauth = await client.get("/api/v1/auth/me")
        assert res_unauth.status_code in (401, 403)

        # f. Access protected route with valid token -> 200 OK
        headers = {"Authorization": f"Bearer {access_token}"}
        res_me = await client.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == 200
        me_data = res_me.json()
        assert me_data["email"] == "author@example.com"
        assert me_data["full_name"] == "Jane Author"

        # g. Logout
        res_logout = await client.post("/api/v1/auth/logout", headers=headers)
        assert res_logout.status_code == 200
        assert res_logout.json()["message"] == "Successfully logged out"
