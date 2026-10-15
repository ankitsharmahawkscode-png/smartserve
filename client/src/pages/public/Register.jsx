import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiMessage } from '../../api/client.js';
import { registerSchema } from '../../utils/validation.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import useSeo from '../../hooks/useSeo.js';
export default function Register() {
  const { user, loading, register: signUp } = useAuth();
  const navigate = useNavigate();
useSeo({ title: 'Create an account', noindex: true });
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  if (!loading && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const onSubmit = async ({ confirmPassword, phone, ...rest }) => {
    setServerError('');

    try {
      const u = await signUp({
        ...rest,
        phone: phone || undefined,
      });

      navigate(`/${u.role}`, { replace: true });
    } catch (e) {
      const first = e.response?.data?.errors?.[0]?.message;
      setServerError(first || apiMessage(e));
    }
  };

  return (
    <main className="min-h-[75vh] bg-gray-50/70 px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-lg mx-auto">
        {/* Page Header */}
        <div className="text-center mb-7 sm:mb-8">
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-2xl
              bg-brand-tint text-brand-dark flex items-center justify-center"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              />
              <circle cx="10" cy="7" r="4" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 8v6m-3-3h6"
              />
            </svg>
          </div>

          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">
            Get started today
          </p>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-2">
            Create your account
          </h1>

          <p className="text-sm sm:text-base text-ink-muted mt-3 max-w-sm mx-auto leading-relaxed">
            Sign up to explore services, manage your bookings, and enjoy
            a convenient home service experience.
          </p>
        </div>

        {/* Registration Form */}
        <Card className="p-5 sm:p-7 lg:p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4 sm:gap-5"
          >
            {serverError && <Alert>{serverError}</Alert>}

            <Input
              label="Full name"
              autoComplete="name"
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone number (optional)"
              type="tel"
              autoComplete="tel"
              placeholder="Enter your phone number"
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
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

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter your password again"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
                aria-pressed={showConfirmPassword}
                className="absolute right-3 top-[34px] min-h-10 px-2
                  inline-flex items-center justify-center rounded-lg
                  text-sm font-semibold text-brand-dark
                  hover:bg-brand-tint focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-brand"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px]"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </div>

            <p className="text-xs text-ink-muted text-center leading-relaxed">
              By creating an account, make sure you use accurate contact
              details so you can manage your bookings.
            </p>
          </form>
        </Card>

        {/* Login Link */}
        <p className="mt-6 text-sm sm:text-base text-center text-ink-muted">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-brand underline underline-offset-4
              hover:text-brand-dark focus:outline-none
              focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Log in
          </Link>
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          {[
            'Easy service booking',
            'Manage your appointments',
            'Track booking updates',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center justify-center gap-2
                text-xs sm:text-sm text-ink-muted text-center"
            >
              <svg
                className="w-4 h-4 shrink-0 text-brand-dark"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.13a1 1 0 0 1-1.42 0l-3.54-3.57a1 1 0 1 1 1.42-1.41l2.83 2.85 6.36-6.41a1 1 0 0 1 1.414-.004Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}