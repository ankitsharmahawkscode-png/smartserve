import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSeo from '../../hooks/useSeo.js';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { apiMessage } from '../../api/client.js';
import { loginSchema } from '../../utils/validation.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Spinner } from '../../components/States.jsx';

// Where to go after login: the page the user wanted, but only inside their own dashboard
const safeTarget = (from, role) => {
  const base = `/${role}`;
  const path =
    typeof from === 'string'
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search || ''}`
        : '';
  return path === base || path.startsWith(`${base}/`) ? path : base;
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useSeo({ title: 'Log in', noindex: true });

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Still checking the saved session
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Already logged in: go to the page they wanted, or their dashboard
  if (user) {
    return <Navigate to={safeTarget(location.state?.from, user.role)} replace />;
  }

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const u = await login(values.email, values.password);
      navigate(safeTarget(location.state?.from, u.role), { replace: true });
    } catch (e) {
      setServerError(apiMessage(e));
    }
  };

  const checkCaps = (e) => setCapsOn(!!e.getModifierState?.('CapsLock'));

  return (
    <main className="min-h-[75vh] bg-gray-50/70 px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-7 text-center sm:mb-8">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-dark"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path strokeLinecap="round" d="M12 14v3" />
            </svg>
          </div>

          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">Welcome back</p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Log in to your account
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted sm:text-base">
            Access your account to manage bookings, check updates, and take care of your home service needs.
          </p>
        </div>

        {/* Login form */}
        <Card className="p-5 sm:p-7 lg:p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 sm:gap-5">
            {serverError && <Alert>{serverError}</Alert>}

            {location.state?.notice && (
              <div
                role="status"
                className="rounded-xl border border-brand/20 bg-brand-tint p-4 text-sm font-semibold leading-relaxed text-brand-dark"
              >
                {location.state.notice}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

        

<div>
  <div className="relative">
    <Input
      label="Password"
      type={showPassword ? 'text' : 'password'}
      autoComplete="current-password"
      placeholder="Enter your password"
      error={errors.password?.message}
      onKeyUp={checkCaps}
      onKeyDown={checkCaps}
      {...register('password')}
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      className="absolute right-3 top-[42px] z-10 inline-flex h-9 items-center justify-center rounded-lg px-2 text-sm font-semibold text-brand-dark hover:bg-brand-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {showPassword ? 'Hide' : 'Show'}
    </button>
  </div>

  {capsOn && (
    <p role="status" className="mt-2 text-xs font-semibold text-amber-700">
      ⚠ Caps Lock is on
    </p>
  )}
</div>


            <div className="-mt-1 flex justify-end">
              <Link
                to="/forgot-password"
                className="rounded text-sm font-semibold text-brand underline underline-offset-4 hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" disabled={isSubmitting} className="min-h-[46px] w-full">
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        </Card>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-ink-muted sm:text-base">
          New here?{' '}
          <Link
            to="/register"
            className="rounded font-bold text-brand underline underline-offset-4 hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-ink-muted">
          Are you a technician?{' '}
          <Link to="/become-a-technician" className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark">
            Apply to join us
          </Link>
        </p>

        {/* Helpful details */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <svg className="h-5 w-5 shrink-0 text-brand-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
            </svg>
            <span>Access your account</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <svg className="h-5 w-5 shrink-0 text-brand-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
            </svg>
            <span>Secure sign-in</span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          By logging in you agree to our{' '}
          <Link to="/terms" className="underline hover:text-brand">Terms</Link> and{' '}
          <Link to="/privacy-policy" className="underline hover:text-brand">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}