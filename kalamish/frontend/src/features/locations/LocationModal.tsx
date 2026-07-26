import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { Location } from '../../types';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  description: z.string().optional(),
  significance: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationModalProps {
  novelId: string;
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  novelId,
  location,
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
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    if (location) {
      reset({
        name: location.name,
        description: location.description || '',
        significance: location.significance || '',
      });
    } else {
      reset({
        name: '',
        description: '',
        significance: '',
      });
    }
  }, [location, reset, isOpen]);

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (location) {
        await apiClient.put(`/locations/${location.id}`, data);
      } else {
        await apiClient.post(`/novels/${novelId}/locations`, data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={location ? `Edit Location: ${location.name}` : 'Create Story Location'}
    >
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Location Name *"
          placeholder="e.g. Aethelgard Citadel"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Atmosphere, architecture, visual environment..."
            {...register('description')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Narrative Significance
          </label>
          <textarea
            rows={3}
            placeholder="Why does this setting matter to the plot or worldbuilding?"
            {...register('significance')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {location ? 'Save Changes' : 'Create Location'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
