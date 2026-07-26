import React from 'react';
import { Modal } from './Modal';
import { Command } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'S'], description: 'Save current chapter prose to backend' },
    { keys: ['Ctrl', 'K'], description: 'Open global semantic vector search modal' },
    { keys: ['Ctrl', 'B'], description: 'Toggle left Explorer sidebar drawer' },
    { keys: ['Ctrl', 'I'], description: 'Toggle right AI Assistant side panel' },
    { keys: ['Esc'], description: 'Close any active modal or search dialog' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts Guide">
      <div className="space-y-3 text-xs select-none">
        <div className="flex items-center gap-1.5 text-vscode-accent font-semibold mb-2">
          <Command className="w-4 h-4" />
          <span>Productivity Hotkeys</span>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-vscode-bg/60 border border-vscode-border rounded-lg"
            >
              <span className="text-vscode-muted">{sc.description}</span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-0.5 bg-vscode-sidebar border border-vscode-border rounded text-[10px] font-mono text-vscode-text shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
