import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { Novel } from '../../types';

const editNovelSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  genre: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  style: z.string().optional(),
  pov: z.string().optional(),
  estimated_chapters: z.coerce.number().min(1).optional(),
  status: z.string().optional(),
});

type EditNovelFormData = z.infer<typeof editNovelSchema>;

interface EditNovelModalProps {
  novel: Novel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditNovelModal: React.FC<EditNovelModalProps> = ({
  novel,
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
  } = useForm<EditNovelFormData>({
    resolver: zodResolver(editNovelSchema),
  });

  useEffect(() => {
    if (novel) {
      reset({
        title: novel.title,
        genre: novel.genre || '',
        language: novel.language,
        tone: novel.tone || '',
        style: novel.style || '',
        pov: novel.pov || '',
        estimated_chapters: novel.estimated_chapters,
        status: novel.status,
      });
    }
  }, [novel, reset]);

  if (!novel) return null;

  const onSubmit = async (data: EditNovelFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/novels/${novel.id}`, data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update novel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${novel.title}`}>
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Novel Title *"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Genre"
            error={errors.genre?.message}
            {...register('genre')}
          />
          <Input
            label="Language"
            error={errors.language?.message}
            {...register('language')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tone"
            error={errors.tone?.message}
            {...register('tone')}
          />
          <Input
            label="Writing Style"
            error={errors.style?.message}
            {...register('style')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="POV"
            error={errors.pov?.message}
            {...register('pov')}
          />
          <Input
            label="Estimated Chapters"
            type="number"
            error={errors.estimated_chapters?.message}
            {...register('estimated_chapters')}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
