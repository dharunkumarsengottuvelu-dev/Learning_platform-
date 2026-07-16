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
          disabled={isSubmitting}
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
