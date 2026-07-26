import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';

const createNovelSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  genre: z.string().optional(),
  language: z.string().default('English'),
  tone: z.string().optional(),
  style: z.string().optional(),
  pov: z.string().optional(),
  estimated_chapters: z.coerce.number().min(1, 'Must be at least 1 chapter').default(10),
});

type CreateNovelFormData = z.infer<typeof createNovelSchema>;

interface CreateNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNovelModal: React.FC<CreateNovelModalProps> = ({
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
  } = useForm<CreateNovelFormData>({
    resolver: zodResolver(createNovelSchema),
    defaultValues: {
      language: 'English',
      estimated_chapters: 10,
    },
  });

  const onSubmit = async (data: CreateNovelFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/novels', data);
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create novel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Novel Project">
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Novel Title *"
          placeholder="e.g. Chronicles of Antigravity"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Genre"
            placeholder="e.g. Sci-Fi, Fantasy"
            error={errors.genre?.message}
            {...register('genre')}
          />
          <Input
            label="Language"
            placeholder="English"
            error={errors.language?.message}
            {...register('language')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tone"
            placeholder="e.g. Epic, Dark, Suspenseful"
            error={errors.tone?.message}
            {...register('tone')}
          />
          <Input
            label="Writing Style"
            placeholder="e.g. Cinematic, Immersive"
            error={errors.style?.message}
            {...register('style')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Point of View (POV)"
            placeholder="e.g. Third Person Limited"
            error={errors.pov?.message}
            {...register('pov')}
          />
          <Input
            label="Estimated Chapters"
            type="number"
            placeholder="10"
            error={errors.estimated_chapters?.message}
            {...register('estimated_chapters')}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
