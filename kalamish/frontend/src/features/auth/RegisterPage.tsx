import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, User as UserIcon, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Brand } from '../../components/Brand';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error: authError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitError(null);
    try {
      await registerUser(data.email, data.password, data.full_name || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <main className="min-h-screen overflow-y-auto px-5 pb-10 sm:px-8">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between py-6">
        <Brand to="/register" subtitle="Narrative intelligence" />
        <Link to="/login" className="text-xs text-vscode-muted transition hover:text-vscode-text">
          Already writing? <span className="ml-1 text-[#a99dff]">Sign in</span>
        </Link>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 py-8 lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden max-w-lg lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/[.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b1a7ff]">
            <Sparkles className="h-4 w-4" /> Your world begins here
          </div>
          <h1 className="mt-7 text-6xl font-[680] leading-[.92] tracking-[-.065em]">
            Build a story<br /><span className="brand-gradient">that remembers.</span>
          </h1>
          <p className="mt-7 text-base leading-8 text-[#929aac]">
            Plan the arc, write the chapter, revise the canon. Every piece of your novel stays connected.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/[.08] pt-6">
            {[['01', 'Shape'], ['02', 'Write'], ['03', 'Remember']].map(([number, label]) => (
              <div key={number}>
                <p className="text-sm font-semibold text-[#a99dff]">{number}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[.14em] text-[#687084]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card mx-auto w-full max-w-[560px] rounded-[28px] p-7 sm:p-10">
          <p className="eyebrow">Author onboarding</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">Create your writing room.</h2>
          <p className="mt-2 text-sm leading-6 text-[#747c8f]">One account for every manuscript and evolving world.</p>

          {(submitError || authError) && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[#ff7a90]/30 bg-[#ff7a90]/10 px-3.5 py-3 text-xs text-[#ff9cad] animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <Input label="Full name (optional)" type="text" placeholder="Your author name" error={errors.full_name?.message} className="pr-10" {...register('full_name')} />
              <UserIcon className="absolute right-3.5 top-[38px] h-4 w-4 text-vscode-muted" />
            </div>
            <div className="relative sm:col-span-2">
              <Input label="Email address" type="email" placeholder="author@example.com" error={errors.email?.message} className="pr-10" {...register('email')} />
              <Mail className="absolute right-3.5 top-[38px] h-4 w-4 text-vscode-muted" />
            </div>
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" error={errors.password?.message} className="pr-10" {...register('password')} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-[36px] grid h-7 w-7 place-items-center rounded-lg text-vscode-muted transition hover:bg-white/[.05] hover:text-vscode-text">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input label="Confirm password" type={showPassword ? 'text' : 'password'} placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-1 w-full sm:col-span-2">
              Create writing room <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-7 border-t border-white/[.08] pt-6 text-center text-xs text-vscode-muted">
            Already have a workspace?{' '}
            <Link to="/login" className="font-semibold text-[#a99dff] transition hover:text-white">Sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
