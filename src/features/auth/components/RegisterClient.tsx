'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterClient() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Account created! Check your email to confirm your account.');
    router.push('/auth/login');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
          Create your account
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          Register to access your training portal
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isSubmitting}
        className="btn btn-secondary"
        style={{ width: '100%', marginBottom: '24px', height: '40px' }}
      >
        {isGoogleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 500 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Full Name */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" htmlFor="full_name">Full name</label>
          <input
            {...register('full_name')}
            id="full_name"
            type="text"
            autoComplete="name"
            className="form-input"
            placeholder="John Smith"
            disabled={isSubmitting}
          />
          {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" htmlFor="reg-email">Email address</label>
          <input
            {...register('email')}
            id="reg-email"
            type="email"
            autoComplete="email"
            className="form-input"
            placeholder="you@company.com"
            disabled={isSubmitting}
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              {...register('password')}
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="form-input"
              placeholder="Min. 8 characters"
              disabled={isSubmitting}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '2px', display: 'flex' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label" htmlFor="confirm_password">Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              {...register('confirm_password')}
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className="form-input"
              placeholder="Repeat your password"
              disabled={isSubmitting}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '2px', display: 'flex' }}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm_password && <p className="form-error">{errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="btn btn-primary"
          style={{ width: '100%', height: '40px' }}
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Creating account…</>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
