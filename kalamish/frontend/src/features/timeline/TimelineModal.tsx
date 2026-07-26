import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { TimelineEvent, Chapter } from '../../types';

const timelineSchema = z.object({
  event_order: z.coerce.number().min(1, 'Order must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  chapter_id: z.string().optional().or(z.literal('')),
  impact: z.string().optional(),
});

type TimelineFormData = z.infer<typeof timelineSchema>;

interface TimelineModalProps {
  novelId: string;
  chapters: Chapter[];
  nextOrder: number;
  event: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  novelId,
  chapters,
  nextOrder,
  event,
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
  } = useForm<TimelineFormData>({
    resolver: zodResolver(timelineSchema),
  });

  useEffect(() => {
    if (event) {
      reset({
        event_order: event.event_order,
        title: event.title,
        description: event.description,
        chapter_id: event.chapter_id || '',
        impact: event.impact || '',
      });
    } else {
      reset({
        event_order: nextOrder,
        title: '',
        description: '',
        chapter_id: '',
        impact: '',
      });
    }
  }, [event, nextOrder, reset, isOpen]);

  const onSubmit = async (data: TimelineFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        chapter_id: data.chapter_id ? data.chapter_id : null,
      };
      if (event) {
        await apiClient.put(`/timeline/${event.id}`, payload);
      } else {
        await apiClient.post(`/novels/${novelId}/timeline`, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save timeline event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? `Edit Event: ${event.title}` : 'Add Timeline Event'}
    >
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          <Input
            label="Order #"
            type="number"
            error={errors.event_order?.message}
            {...register('event_order')}
          />
          <div className="col-span-3">
            <Input
              label="Event Title *"
              placeholder="e.g. The Arrival at Orion Gateway"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Associated Chapter (Optional)
          </label>
          <select
            {...register('chapter_id')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors"
          >
            <option value="">-- No Specific Chapter --</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Ch. {c.chapter_number}: {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Event Description *
          </label>
          <textarea
            rows={3}
            placeholder="Detailed narrative summary of what occurs..."
            {...register('description')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Plot Impact
          </label>
          <textarea
            rows={2}
            placeholder="How does this event shift character relationships or plot stakes?"
            {...register('impact')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {event ? 'Save Changes' : 'Add Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
