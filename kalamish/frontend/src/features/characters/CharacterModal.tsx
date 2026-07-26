import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { Character } from '../../types';

const characterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().default('supporting'),
  description: z.string().optional(),
  backstory: z.string().optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterModalProps {
  novelId: string;
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  novelId,
  character,
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
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
  });

  useEffect(() => {
    if (character) {
      reset({
        name: character.name,
        role: character.role,
        description: character.description || '',
        backstory: character.backstory || '',
      });
    } else {
      reset({
        name: '',
        role: 'supporting',
        description: '',
        backstory: '',
      });
    }
  }, [character, reset, isOpen]);

  const onSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (character) {
        await apiClient.put(`/characters/${character.id}`, data);
      } else {
        await apiClient.post(`/novels/${novelId}/characters`, {
          ...data,
          personality_traits: {},
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save character.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={character ? `Edit Character: ${character.name}` : 'Create Character Profile'}
    >
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Character Name *"
          placeholder="e.g. Captain Leo Vance"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Story Role
          </label>
          <select
            {...register('role')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors"
          >
            <option value="protagonist">Protagonist</option>
            <option value="antagonist">Antagonist</option>
            <option value="supporting">Supporting</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="A brief overview of physical appearance and role..."
            {...register('description')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Backstory
          </label>
          <textarea
            rows={3}
            placeholder="History, motivations, secrets, and origin..."
            {...register('backstory')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {character ? 'Save Changes' : 'Create Character'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
