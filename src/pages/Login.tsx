import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Loader2,
} from "lucide-react";

import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../services/api";

type Role = "ADMIN" | "MANAGER";

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  token?: string;
  accessToken?: string;
  user?: User;
  data?: {
    token?: string;
    accessToken?: string;
    user?: User;
  };
  message?: string;
}

export default function Login() {
  const nav = useNavigate();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("admin@petrosoft.com");
  const [password, setPassword] = useState("Admin@123");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiPost<LoginResponse, LoginRequest>(
        "/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

      console.log("LOGIN RESPONSE:", response);

      const payload = response.data ?? response;

      const token = payload.token ?? payload.accessToken;
      const user = payload.user;

      console.log("LOGIN TOKEN:", token);
      console.log("LOGIN USER:", user);

      if (!token) {
        throw new Error("LOGIN_TOKEN_MISSING");
      }

      if (!user) {
        throw new Error("LOGIN_USER_MISSING");
      }

      if (!user.role) {
        throw new Error("LOGIN_ROLE_MISSING");
      }

      localStorage.setItem("petrosoft_token", token);

      localStorage.setItem(
        "petrosoft_user",
        JSON.stringify(user)
      );

      if (rememberMe) {
        localStorage.setItem(
          "petrosoft_remember",
          "true"
        );
      } else {
        localStorage.removeItem("petrosoft_remember");
      }

      setSession(token, user);

      nav("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password.");
        } else if (err.response.status === 403) {
          setError(
            "You don't have permission to access PetroSoft."
          );
        } else {
          setError(
            err.response.data?.message ||
              `Server error (${err.response.status}).`
          );
        }

        return;
      }

      if (err.message === "LOGIN_TOKEN_MISSING") {
        setError(
          "Login successful, but token was not returned by the server."
        );
        return;
      }

      if (err.message === "LOGIN_USER_MISSING") {
        setError(
          "Login successful, but user details were not returned by the server."
        );
        return;
      }

      if (err.message === "LOGIN_ROLE_MISSING") {
        setError(
          "Login successful, but user role was not returned by the server."
        );
        return;
      }

      setError(
        "Unable to connect to the server. Please check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">

      {/* LEFT */}
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          <Logo />

          <div className="mt-10">

            <h1 className="text-2xl font-extrabold">
              Welcome back
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Sign in to manage your petrol station.
            </p>

            <form
              onSubmit={login}
              className="mt-7 space-y-4"
            >

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Email or Username
                </label>

                <div className="relative">

                  <Mail
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <input
                    className="input pl-10"
                    type="text"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter email or username"
                    autoComplete="username"
                    disabled={loading}
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <input
                    className="input pl-10 pr-11"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>
              </div>

              {/* REMEMBER */}
              <div className="flex items-center justify-between text-xs">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    disabled={loading}
                  />

                  Remember me

                </label>

                <button
                  type="button"
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </button>

              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* LOGIN */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}

              </button>

            </form>

          </div>

          <p className="mt-12 text-center text-[10px] text-slate-400">
            RAJ AGENCIES, HPCL DEALER · PetroSoft v1.0.0
          </p>

        </div>
      </div>

      {/* RIGHT */}
      <div className="relative hidden overflow-hidden bg-[#0b2a4a] lg:block">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(22,119,255,.5),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,.45),transparent_40%)]" />

        <div className="relative flex h-full flex-col justify-end p-16 text-white">

          <div className="mb-10 grid h-20 w-20 place-items-center rounded-3xl bg-white/10 text-brand-100 backdrop-blur">
            <span className="text-4xl">
              ⛽
            </span>
          </div>

          <h2 className="max-w-md text-5xl font-black leading-tight">
            Fueling
            <br />
            Better
            <br />
            <span className="text-blue-300">
              Tomorrow.
            </span>
          </h2>

          <p className="mt-5 max-w-md text-sm text-blue-100/70">
            Manage sales, inventory, credit, cash
            closure and reports from one modern
            workspace.
          </p>

        </div>
      </div>

    </div>
  );
}