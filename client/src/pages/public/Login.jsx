import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSeo from '../../hooks/useSeo.js';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { apiMessage } from '../../api/client.js';
import { loginSchema } from '../../utils/validation.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';


export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    useSeo({ title: 'Log in', noindex: true });

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (!loading && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const onSubmit = async (values) => {
    setServerError('');

    try {
      const u = await login(values.email, values.password);
      const from = location.state?.from;

      navigate(
        from && from.startsWith(`/${u.role}`)
          ? from
          : `/${u.role}`,
        { replace: true }
      );
    } catch (e) {
      setServerError(apiMessage(e));
    }
  };

  return (
    <main className="min-h-[75vh] bg-gray-50/70 px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-7 sm:mb-8">
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-2xl
              bg-brand-tint text-brand-dark
              flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10V7a4 4 0 0 1 8 0v3"
              />
              <path
                strokeLinecap="round"
                d="M12 14v3"
              />
            </svg>
          </div>

          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">
            Welcome back
          </p>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-2">
            Log in to your account
          </h1>

          <p className="text-sm sm:text-base text-ink-muted mt-3 max-w-sm mx-auto leading-relaxed">
            Access your account to manage bookings, check updates,
            and take care of your home service needs.
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-5 sm:p-7 lg:p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4 sm:gap-5"
          >
            {/* Server Error */}
            {serverError && (
              <Alert>{serverError}</Alert>
            )}

            {/* Redirect / Status Notice */}
            {location.state?.notice && (
              <div
                role="status"
                className="rounded-xl border border-brand/20
                  bg-brand-tint p-4 text-sm font-semibold
                  text-brand-dark leading-relaxed"
              >
                {location.state.notice}
              </div>
            )}

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-[34px] min-h-10 px-2
                  inline-flex items-center justify-center rounded-lg
                  text-sm font-semibold text-brand-dark
                  hover:bg-brand-tint focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-brand"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-brand
                  underline underline-offset-4
                  hover:text-brand-dark focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-brand rounded"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px]"
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        </Card>

        {/* Register Link */}
        <p className="mt-6 text-sm sm:text-base text-center text-ink-muted">
          New here?{' '}
          <Link
            to="/register"
            className="font-bold text-brand underline underline-offset-4
              hover:text-brand-dark focus:outline-none
              focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Create an account
          </Link>
        </p>

        {/* Helpful Details */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <svg
              className="w-5 h-5 shrink-0 text-brand-dark"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3 7 9 6 9-6"
              />
            </svg>
            <span>Access your account</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <svg
              className="w-5 h-5 shrink-0 text-brand-dark"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 12 2 2 4-4"
              />
            </svg>
            <span>Secure sign-in</span>
          </div>
        </div>
      </div>
    </main>
  );
}