import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';

const createChapterSchema = z.object({
  chapter_number: z.coerce.number().min(1, 'Chapter number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
});

type CreateChapterFormData = z.infer<typeof createChapterSchema>;

interface CreateChapterModalProps {
  novelId: string;
  nextChapterNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newChapterId: string) => void;
}

export const CreateChapterModal: React.FC<CreateChapterModalProps> = ({
  novelId,
  nextChapterNumber,
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
  } = useForm<CreateChapterFormData>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: {
      chapter_number: nextChapterNumber,
    },
  });

  React.useEffect(() => {
    reset({
      chapter_number: nextChapterNumber,
      title: `Chapter ${nextChapterNumber}`,
    });
  }, [nextChapterNumber, reset]);

  const onSubmit = async (data: CreateChapterFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post(`/novels/${novelId}/chapters`, {
        ...data,
        content: '',
        status: 'draft',
      });
      reset();
      onSuccess(res.data.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create chapter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Chapter">
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
              placeholder="e.g. The Awakening"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>
        </div>

        <Input
          label="Chapter Summary (Optional)"
          placeholder="Brief synopsis of key events..."
          error={errors.summary?.message}
          {...register('summary')}
        />

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Chapter
          </Button>
        </div>
      </form>
    </Modal>
  );
};
