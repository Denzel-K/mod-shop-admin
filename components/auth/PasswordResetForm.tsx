'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface PasswordResetFormProps {
  onSwitchToLogin: () => void;
}

export default function PasswordResetForm({ onSwitchToLogin }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 shadow-2xl shadow-green-500/10">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mb-4 shadow-lg shadow-green-500/25">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-slate-400 text-center leading-relaxed">
              If an account with that email exists, we have sent you a password reset link.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">What is next?</h3>
            <ul className="text-slate-300 text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                Check your email inbox (and spam folder)
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                Click the reset link within 1 hour
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                Create a new secure password
              </li>
            </ul>
          </div>

          {/* Back to Login */}
          <Button
            onClick={onSwitchToLogin}
            variant="outline"
            className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-4 shadow-lg shadow-orange-500/25">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-slate-400">Enter your email to receive a reset link</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-slate-300 font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                id="reset-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-300"
                placeholder="admin@modshop.com"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200 hover:underline inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
