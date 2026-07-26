from typing import Optional, Dict, Any

import httpx

from app.config.settings import settings
from app.utils.logging import logger


class LLMService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL or "gpt-4.1"
        self.base_url = "https://api.openai.com/v1/chat/completions"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_completion_tokens"] = max_tokens

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        logger.info("[LLMService] Requesting OpenAI model: %s", self.model)
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)

        if response.status_code != 200:
            logger.error(
                "[LLMService] OpenAI returned status %s: %s",
                response.status_code,
                response.text,
            )
            response.raise_for_status()

        body = response.json()
        choices = body.get("choices", [])
        content = choices[0].get("message", {}).get("content", "") if choices else ""
        if not content:
            raise RuntimeError("OpenAI returned an empty response.")
        return content
