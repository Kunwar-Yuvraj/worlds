import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Save, Maximize2, Minimize2, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { Chapter } from '../../types';
import { apiClient } from '../../app/apiClient';
import { formatChapterLabel } from '../../utils/proseCleaner';

interface MonacoProseEditorProps {
  chapter: Chapter | null;
  onChapterUpdate: (updatedChapter: Chapter) => void;
}

export const MonacoProseEditor: React.FC<MonacoProseEditorProps> = ({
  chapter,
  onChapterUpdate,
}) => {
  const [content, setContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(0);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync content when active chapter changes or updates externally
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (chapter) {
      setContent(chapter.content || '');
      const words = (chapter.content || '').trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setSaveStatus('saved');
    }
  }, [chapter?.id, chapter?.content]);

  // Calculate live word count
  const calculateWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Perform save to backend
  const saveChapterContent = useCallback(
    async (textToSave: string) => {
      if (!chapter) return;
      setSaveStatus('saving');
      try {
        const res = await apiClient.put(`/chapters/${chapter.id}`, {
          content: textToSave,
        });
        setSaveStatus('saved');
        onChapterUpdate(res.data);
      } catch (err) {
        setSaveStatus('unsaved');
      }
    },
    [chapter, onChapterUpdate]
  );

  // Handle Editor Content Change with Debounced Autosave
  const handleEditorChange = (value: string | undefined) => {
    const text = value || '';
    setContent(text);
    setWordCount(calculateWordCount(text));
    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveChapterContent(text);
    }, 1500);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        saveChapterContent(content);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, saveChapterContent]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom VS Code dark theme rules for rich prose readability
    monaco.editor.defineTheme('prose-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },

      ],
      colors: {
        'editor.background': '#0C1019',
        'editor.foreground': '#E8EAF2',
        'editorCursor.foreground': '#A99DFF',
        'editor.lineHighlightBackground': '#111725',
        'editorLineNumber.foreground': '#687084',
        'editor.selectionBackground': '#8B7CFF35',
        'editor.inactiveSelectionBackground': '#8B7CFF20',
      },
    });

    monaco.editor.setTheme('prose-dark');
  };

  if (!chapter) {
    return (
      <div className="flex flex-1 select-none flex-col items-center justify-center bg-transparent px-6 text-center text-xs text-vscode-muted">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-[22px] border border-vscode-accent/20 bg-vscode-accent/10 shadow-spectral">
          <FileText className="h-7 w-7 text-vscode-accent" />
        </div>
        <span className="eyebrow mb-2">Blank page</span>
        <span className="text-sm text-vscode-text">Select or create a chapter to begin writing.</span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col overflow-hidden bg-vscode-editor ${
        isFullscreen ? 'fixed inset-0 z-50 bg-vscode-editor' : 'relative flex-1'
      }`}
    >
      {/* Tab Header Bar */}
      <div className="flex min-h-[62px] shrink-0 select-none items-center justify-between border-b border-white/[0.08] bg-vscode-sidebar/80 px-5 backdrop-blur-xl">
        <div className="min-w-0">
          <span className="eyebrow mb-1 flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-vscode-accent" />
            Manuscript canvas
          </span>
          <span className="block truncate font-serif text-[15px] font-semibold text-vscode-text">
            {formatChapterLabel(chapter.chapter_number, chapter.title)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-[10px] text-vscode-muted">
            {wordCount.toLocaleString()} words
          </span>

          <div className="flex items-center gap-1.5">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <button
                onClick={() => saveChapterContent(content)}
                className="flex items-center gap-1 text-[11px] text-vscode-accent hover:underline font-medium"
              >
                <Save className="w-3.5 h-3.5" /> Save Now
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="grid h-9 w-9 place-items-center rounded-xl text-vscode-muted transition hover:bg-white/[0.05] hover:text-vscode-text"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Distraction-Free Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Monaco Editor Canvas */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="markdown"
          theme="prose-dark"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            wordWrap: 'on',
            lineNumbers: 'off',
            minimap: { enabled: false },
            fontSize: 17,
            lineHeight: 31,
            fontFamily: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
            fontLigatures: true,
            padding: { top: 30, bottom: 36 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorWidth: 2,
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};
