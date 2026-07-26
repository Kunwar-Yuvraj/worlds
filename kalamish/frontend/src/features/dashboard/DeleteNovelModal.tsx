import React from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { apiClient } from '../../app/apiClient';
import { Novel } from '../../types';

interface DeleteNovelModalProps {
  novel: Novel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteNovelModal: React.FC<DeleteNovelModalProps> = ({
  novel,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!novel) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/novels/${novel.id}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete novel project.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <div className="text-sm text-vscode-text space-y-3">
        <p>
          Are you sure you want to delete <strong className="text-vscode-accent">{novel.title}</strong>?
        </p>
        <p className="text-xs text-vscode-muted">
          This action will permanently delete all associated chapters, characters, locations, outlines, and world rules. This action cannot be undone.
        </p>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-vscode-border">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
          Delete Permanently
        </Button>
      </div>
    </Modal>
  );
};
