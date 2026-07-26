import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { Outline } from '../../types';

const outlineSchema = z.object({
  chapter_number: z.coerce.number().min(1, 'Chapter number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  synopsis: z.string().min(1, 'Synopsis is required'),
  key_events: z.string().optional(),
  target_word_count: z.coerce.number().min(100).default(2000),
});

type OutlineFormData = z.infer<typeof outlineSchema>;

interface OutlineModalProps {
  novelId: string;
  nextChapterNumber: number;
  outline: Outline | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OutlineModal: React.FC<OutlineModalProps> = ({
  novelId,
  nextChapterNumber,
  outline,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OutlineFormData>({
    resolver: zodResolver(outlineSchema),
  });

  useEffect(() => {
    if (outline) {
      reset({
        chapter_number: outline.chapter_number,
        title: outline.title,
        synopsis: outline.synopsis,
        key_events: Array.isArray(outline.key_events)
          ? outline.key_events.join(', ')
          : '',
        target_word_count: outline.target_word_count || 2000,
      });
    } else {
      reset({
        chapter_number: nextChapterNumber,
        title: '',
        synopsis: '',
        key_events: '',
        target_word_count: 2000,
      });
    }
  }, [outline, nextChapterNumber, reset, isOpen]);

  const onSubmit = async (data: OutlineFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const keyEventsArray = data.key_events
        ? data.key_events.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const payload = {
        ...data,
        key_events: keyEventsArray,
      };

      if (outline) {
        await apiClient.put(`/outlines/${outline.id}`, payload);
      } else {
        await apiClient.post(`/novels/${novelId}/outlines`, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save outline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={outline ? `Edit Outline: Ch. ${outline.chapter_number}` : 'Create Chapter Outline'}
    >
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Ch. #"
            type="number"
            error={errors.chapter_number?.message}
            {...register('chapter_number')}
          />
          <div className="col-span-2">
            <Input
              label="Chapter Title *"
              placeholder="e.g. Arrival at Gateway"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Chapter Synopsis *
          </label>
          <textarea
            rows={3}
            placeholder="High-level narrative summary of what occurs in this chapter..."
            {...register('synopsis')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <Input
          label="Key Narrative Beats / Events (Comma-separated)"
          placeholder="e.g. Docking, AI Encounter, Discovery of Artifact"
          error={errors.key_events?.message}
          {...register('key_events')}
        />

        <Input
          label="Target Word Count"
          type="number"
          placeholder="2000"
          error={errors.target_word_count?.message}
          {...register('target_word_count')}
        />

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {outline ? 'Save Changes' : 'Create Outline'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
