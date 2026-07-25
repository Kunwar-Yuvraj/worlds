export function safeJSONParse<T>(raw: string): T | null { try { return JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()) as T; } catch { return null; } }
