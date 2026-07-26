/**
 * Server-Sent Events (SSE) Token-by-Token Stream Consumer
 * Connects to /api/v1/ai/rewrite with stream=true and reads chunks from fetch ReadableStream
 */
export const streamAIRewrite = async (
  chapterId: string,
  userInstruction: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) => {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch('/api/v1/ai/rewrite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        user_instruction: userInstruction,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Streaming failed');
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace('data: ', '').trim();
          try {
            const data = JSON.parse(jsonStr);
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.event === 'done') {
              onDone();
              return;
            }
          } catch (e) {
            // Ignore parse errors on partial trailing lines
          }
        }
      }
    }
    onDone();
  } catch (err: any) {
    onError(err.message || 'Stream connection error.');
  }
};
