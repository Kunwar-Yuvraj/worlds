import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Brand } from '../../components/Brand';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="min-h-screen overflow-y-auto px-5 pb-10 sm:px-8">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between py-6">
        <Brand to="/login" subtitle="Narrative intelligence" />
        <Link to="/register" className="text-xs text-vscode-muted transition hover:text-vscode-text">
          New author? <span className="ml-1 text-[#a99dff]">Create account</span>
        </Link>
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-12 py-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden max-w-xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/[.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b1a7ff]">
            <Sparkles className="h-4 w-4" /> AI-native novel studio
          </div>
          <h1 className="mt-7 text-[clamp(3.7rem,6.2vw,6.4rem)] font-[680] leading-[.9] tracking-[-.07em]">
            Write beyond<br /><span className="brand-gradient">the blank page.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#929aac]">
            A focused story environment where chapters, characters, timelines, and world memory evolve together.
          </p>
          <div className="glass-card relative mt-10 overflow-hidden rounded-[24px] p-7">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(139,124,255,.18),transparent_70%)]" />
            <p className="eyebrow relative">From your chronicle</p>
            <p className="narrative-serif relative mt-5 text-xl leading-9 text-[#dfe3ec]">
              “The city remembers every name it has swallowed. Tonight, it whispers one back.”
            </p>
            <div className="relative mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-[#687084]">
              <span className="live-dot" /> Story memory synchronized
            </div>
          </div>
        </section>

        <section className="glass-card mx-auto w-full max-w-[480px] rounded-[28px] p-7 sm:p-10">
          <p className="eyebrow">Author access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">Return to your stories.</h2>
          <p className="mt-2 text-sm leading-6 text-[#747c8f]">Sign in to continue shaping your narrative worlds.</p>

          {(submitError || authError) && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[#ff7a90]/30 bg-[#ff7a90]/10 px-3.5 py-3 text-xs text-[#ff9cad] animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-5">
            <div className="relative">
              <Input label="Email address" type="email" placeholder="author@example.com" error={errors.email?.message} className="pr-10" {...register('email')} />
              <Mail className="absolute right-3.5 top-[38px] h-4 w-4 text-vscode-muted" />
            </div>
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" error={errors.password?.message} className="pr-10" {...register('password')} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-[36px] grid h-7 w-7 place-items-center rounded-lg text-vscode-muted transition hover:bg-white/[.05] hover:text-vscode-text">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-1 w-full">
              Enter workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-7 border-t border-white/[.08] pt-6 text-center text-xs text-vscode-muted">
            First time here?{' '}
            <Link to="/register" className="font-semibold text-[#a99dff] transition hover:text-white">Begin your first story</Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
