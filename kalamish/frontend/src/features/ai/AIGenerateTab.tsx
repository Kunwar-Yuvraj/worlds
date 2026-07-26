import React, { useState } from 'react';
import { Sparkles, CheckCircle, Activity } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { GenerateResponse } from '../../types';
import { Button } from '../../components/Button';

interface AIGenerateTabProps {
  novelId: string;
  chapterId: string | null;
  onApplyProse: (prose: string) => void | Promise<void>;
}

export const AIGenerateTab: React.FC<AIGenerateTabProps> = ({
  novelId,
  chapterId,
  onApplyProse,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await apiClient.post('/ai/generate', {
        novel_id: novelId,
        chapter_id: chapterId || undefined,
        user_instruction: instruction,
        request_type: 'GENERATE_CHAPTER',
      });
      setResponse(res.data);

      // Directly write generated prose into active chapter canvas
      const generatedProse = res.data.edited_content || res.data.draft_content;
      if (generatedProse) {
        await onApplyProse(generatedProse);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'LangGraph AI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* Input Prompt Form */}
      <form onSubmit={handleGenerate} className="flex flex-col gap-2.5">
        <label className="font-semibold text-vscode-text flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-vscode-accent" />
          Generation Prompt
        </label>
        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Write an exciting opening scene where Captain Leo navigates an asteroid storm..."
          className="bg-vscode-input border border-vscode-border text-vscode-text rounded-lg p-2.5 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isGenerating}
          disabled={!instruction.trim()}
          className="w-full gap-2 shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Trigger LangGraph AI Workflow
        </Button>
      </form>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Output View: Directly written status + Agent Execution Logs ONLY */}
      {response && (
        <div className="space-y-3 pt-2 border-t border-vscode-border animate-fade-in">
          {/* Status Header */}
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-[11px]">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Story Written to Chapter ({response.word_count} words)</span>
          </div>

          {/* Workflow Execution Logs */}
          {response.logs && response.logs.length > 0 && (
            <div className="bg-vscode-bg border border-vscode-border rounded-lg p-3 space-y-2">
              <span className="font-semibold text-vscode-accent text-[11px] uppercase flex items-center gap-1.5 border-b border-vscode-border pb-1.5">
                <Activity className="w-3.5 h-3.5" /> LangGraph Agent Execution Logs
              </span>
              <ul className="space-y-1.5 text-[11px] text-vscode-muted font-mono leading-relaxed">
                {response.logs.map((log, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-vscode-accent shrink-0">•</span>
                    <span>{log}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
