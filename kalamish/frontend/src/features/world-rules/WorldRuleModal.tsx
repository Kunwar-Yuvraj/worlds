import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../app/apiClient';
import { WorldRule } from '../../types';

const worldRuleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required'),
  category: z.string().default('general'),
  description: z.string().min(1, 'Description is required'),
});

type WorldRuleFormData = z.infer<typeof worldRuleSchema>;

interface WorldRuleModalProps {
  novelId: string;
  rule: WorldRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorldRuleModal: React.FC<WorldRuleModalProps> = ({
  novelId,
  rule,
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
  } = useForm<WorldRuleFormData>({
    resolver: zodResolver(worldRuleSchema),
  });

  useEffect(() => {
    if (rule) {
      reset({
        rule_name: rule.rule_name,
        category: rule.category,
        description: rule.description,
      });
    } else {
      reset({
        rule_name: '',
        category: 'general',
        description: '',
      });
    }
  }, [rule, reset, isOpen]);

  const onSubmit = async (data: WorldRuleFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (rule) {
        await apiClient.put(`/world-rules/${rule.id}`, data);
      } else {
        await apiClient.post(`/novels/${novelId}/world-rules`, data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save world rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? `Edit Rule: ${rule.rule_name}` : 'Create World Rule'}
    >
      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Rule Name *"
          placeholder="e.g. Hyperdrive Quantum Core Limitation"
          error={errors.rule_name?.message}
          {...register('rule_name')}
        />

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Category
          </label>
          <select
            {...register('category')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors"
          >
            <option value="technology">Technology & Science</option>
            <option value="magic">Magic & Supernatural</option>
            <option value="society">Society & Factions</option>
            <option value="physics">Physics & Cosmology</option>
            <option value="general">General World Rule</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-vscode-muted block mb-1">
            Rule Description & Constraints *
          </label>
          <textarea
            rows={4}
            placeholder="Detailed explanation of the rule, limitations, and consequences if violated..."
            {...register('description')}
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text text-sm rounded px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-vscode-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {rule ? 'Save Changes' : 'Create World Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
