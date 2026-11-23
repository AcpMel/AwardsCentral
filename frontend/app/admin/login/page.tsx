"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AuthMode = "login" | "signup";

interface Profile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  is_staff: boolean;
  is_superuser: boolean;
}

function getErrorMessage(data: any): string {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data === "object" && data !== null) {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);

        return `${field}: ${message}`;
      })
      .join("\n");
  }

  return "Something went wrong. Please try again.";
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Authenticate with Django JWT.
      const loginResponse = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(getErrorMessage(loginData));
      }

      const accessToken = loginData.access;
      const refreshToken = loginData.refresh;

      if (!accessToken) {
        throw new Error("Authentication token was not returned.");
      }

      // Step 2: Check whether the account is an administrator.
      const profileResponse = await fetch(`${API_URL}/auth/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const profileData: Profile = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(getErrorMessage(profileData));
      }

      // Step 3: Reject regular customer accounts.
      if (!profileData.is_staff) {
        throw new Error(
          "This account does not have administrator access. Please contact an authorized administrator.",
        );
      }

      // Step 4: Store the tokens only after staff verification.
      localStorage.setItem("awardscentral_admin_access", accessToken);

      if (refreshToken) {
        localStorage.setItem("awardscentral_admin_refresh", refreshToken);
      }

      // Step 5: Redirect to the admin products page.
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          password_confirm: passwordConfirm,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setSuccess(
        "Account created successfully! Your account is a regular account and does not have administrator access. An authorized administrator must grant staff access before you can log in here.",
      );

      // Clear registration fields.
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");

      // Return to login.
      setMode("login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <main className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* BRAND */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#D4AF37] mb-4">
            <span className="text-[#D4AF37] text-2xl font-bold">AC</span>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-wide">
            AWARDS CENTRAL
          </h1>

          <p className="text-[#D4AF37] text-xs tracking-[0.3em] mt-2">
            ADMINISTRATION PORTAL
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="bg-white rounded-2xl shadow-2xl p-7 sm:p-9">
          {/* TABS */}
          <div className="grid grid-cols-2 border-b border-gray-200 mb-7">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`pb-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "text-[#9B7920] border-b-2 border-[#D4AF37]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              ADMIN LOGIN
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`pb-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "text-[#9B7920] border-b-2 border-[#D4AF37]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "Welcome Back" : "Create an Account"}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {mode === "login"
                ? "Sign in using your authorized administrator account."
                : "Register an account. Administrator access requires approval."}
            </p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-line">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 text-gray-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#D4AF37] py-3.5 font-bold text-black transition hover:bg-[#c29d2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "PLEASE WAIT..." : "SIGN IN"}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>

                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>

                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                Show passwords
              </label>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs leading-relaxed text-amber-800">
                <strong>Important:</strong> Creating an account does not
                automatically grant administrator privileges. Your account must
                be approved by an existing administrator.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#D4AF37] py-3.5 font-bold text-black transition hover:bg-[#c29d2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          © 2026 Awards Central. All rights reserved.
        </p>
      </div>
    </main>
  );
}
