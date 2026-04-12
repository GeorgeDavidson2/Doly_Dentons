"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      setError("Sign-in link expired or already used. Please request a new one.");
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-brand-purple/10 flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-brand-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a magic link to{" "}
            <span className="text-gray-900 font-medium">{email}</span>. Click it
            to sign in.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-gray-900">Doly</span>
            <span className="text-xs font-semibold tracking-widest text-brand-purple uppercase px-2 py-1 border border-brand-purple rounded">
              Dentons
            </span>
          </div>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dentons.com"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-brand-grey text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2.5 px-4 bg-brand-purple text-white font-medium rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          A sign-in link will be sent to your email. No password required.
        </p>
      </div>
    </div>
  );
}
