import React, { useState } from 'react';
import { Edit3, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { streamAIRewrite } from '../../services/sseService';
import { Button } from '../../components/Button';

interface AIRewriteTabProps {
  chapterId: string | null;
  onReplaceProse: (prose: string) => void | Promise<void>;
}

export const AIRewriteTab: React.FC<AIRewriteTabProps> = ({ chapterId, onReplaceProse }) => {
  const [instruction, setInstruction] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [wasApplied, setWasApplied] = useState(false);
  const [rewrittenText, setRewrittenText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterId) {
      setError('Please select an active chapter first.');
      return;
    }
    if (!instruction.trim()) return;

    setIsRewriting(true);
    setError(null);
    setWasApplied(false);
    setRewrittenText('');

    if (useStreaming) {
      // SSE Token-by-Token Streaming Mode
      streamAIRewrite(
        chapterId,
        instruction,
        (chunk) => {
          setRewrittenText((prev) => (prev || '') + chunk);
        },
        () => {
          setIsRewriting(false);
        },
        (errMsg) => {
          setError(errMsg);
          setIsRewriting(false);
        }
      );
    } else {
      // Standard HTTP Response Mode
      try {
        const res = await apiClient.post('/ai/rewrite', {
          chapter_id: chapterId,
          user_instruction: instruction,
          stream: false,
        });
        setRewrittenText(res.data.content);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Chapter rewrite failed.');
      } finally {
        setIsRewriting(false);
      }
    }
  };

  const handleReplaceCanvas = async () => {
    if (!rewrittenText?.trim()) return;

    setIsApplying(true);
    setError(null);
    try {
      await onReplaceProse(rewrittenText);
      setWasApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace the chapter canvas.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      <form onSubmit={handleRewrite} className="flex flex-col gap-2.5">
        <label className="font-semibold text-vscode-text flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-vscode-accent" />
            Rewrite Instruction
          </span>
          <label className="flex items-center gap-1.5 text-[11px] text-vscode-muted font-normal cursor-pointer">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded accent-vscode-accent"
            />
            <Zap className={`w-3 h-3 ${useStreaming ? 'text-amber-400' : 'text-vscode-muted'}`} />
            <span>SSE Stream</span>
          </label>
        </label>

        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Make the tone more suspenseful and add vivid sensory details..."
          className="bg-vscode-input border border-vscode-border text-vscode-text rounded-lg p-2.5 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isRewriting}
          disabled={!chapterId || !instruction.trim()}
          className="w-full gap-2 shadow"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {useStreaming ? 'Stream Rewrite Tokens' : 'Rewrite Active Chapter'}
        </Button>
      </form>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      {rewrittenText !== null && (
        <div className="space-y-3 pt-2 border-t border-vscode-border animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-vscode-text flex items-center gap-1.5">
              {isRewriting ? (
                <>
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                  Streaming Real-Time Tokens...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Rewritten Content
                </>
              )}
            </span>

            {!isRewriting && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleReplaceCanvas}
                isLoading={isApplying}
                disabled={!rewrittenText.trim()}
                className="gap-1 text-[11px]"
              >
                {wasApplied ? 'Canvas Replaced' : 'Replace Canvas'}
                {!wasApplied && <ArrowRight className="w-3 h-3" />}
              </Button>
            )}
          </div>

          <div className="bg-vscode-bg border border-vscode-border rounded-lg p-3 max-h-48 overflow-y-auto text-vscode-text font-mono leading-relaxed text-[11px] relative">
            {rewrittenText}
            {isRewriting && (
              <span className="inline-block w-1.5 h-3 bg-vscode-accent ml-1 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
