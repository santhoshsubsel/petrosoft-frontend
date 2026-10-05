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

      const payload = response?.data ?? response;
      const token = payload.token ?? payload.accessToken;
      const user = payload.user;

      if (!token) {
        throw new Error("LOGIN_TOKEN_MISSING");
      }

      if (!user) {
        throw new Error("LOGIN_USER_MISSING");
      }

      if (!user.role) {
        throw new Error("LOGIN_ROLE_MISSING");
      }

      if (rememberMe) {
        document.cookie = "petrosoft_remember=true; path=/; SameSite=Lax";
      } else {
        document.cookie = "petrosoft_remember=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
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
  <div className="min-h-screen bg-white lg:grid lg:grid-cols-[44%_56%]">

    {/* ================= LEFT LOGIN ================= */}
    <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10">

      <div className="w-full max-w-[390px]">

        {/* LOGO */}
        <Logo />

        {/* HEADING */}
        <div className="mt-10">
          <h1 className="text-[30px] font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your petrol station.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={login}
          className="mt-8 space-y-5"
        >

          {/* EMAIL */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Email or Username
            </label>

            <div className="relative">

              <Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                autoComplete="username"
                disabled={loading}
                className="
                  h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-11
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:bg-slate-50
                "
              />

            </div>
          </div>


          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Password
            </label>

            <div className="relative">

              <LockKeyhole
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="
                  h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-11
                  pr-12
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:bg-slate-50
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                className="
                  absolute
                  right-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  hover:text-slate-700
                "
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>
          </div>


          {/* REMEMBER + FORGOT */}
          <div className="flex items-center justify-between">

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                disabled={loading}
                className="
                  h-4
                  w-4
                  rounded
                  border-slate-300
                  text-blue-600
                  focus:ring-blue-500
                "
              />

              Remember me

            </label>

            <button
              type="button"
              className="
                text-xs
                font-semibold
                text-blue-600
                hover:text-blue-700
              "
            >
              Forgot password?
            </button>

          </div>


          {/* ERROR */}
          {error && (
            <div
              className="
                rounded-xl
                border
                border-red-100
                bg-red-50
                px-4
                py-3
                text-xs
                font-medium
                text-red-600
              "
            >
              {error}
            </div>
          )}


          {/* LOGIN */}
          <button
            type="submit"
            disabled={loading}
            className="
              flex
              h-[50px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-blue-600/20
              transition
              hover:bg-blue-700
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Signing in...
              </>
            ) : (
              "Sign In"
            )}

          </button>

        </form>


        {/* FOOTER */}
        <p className="mt-12 text-center text-[10px] text-slate-400">
         PetroSoft v1.0.0
        </p>

      </div>

    </section>


    {/* ================= RIGHT IMAGE ================= */}
    <section
      className="
        relative
        hidden
        min-h-screen
        overflow-hidden
        lg:block
      "
    >

      <img
        src="/images/petrol-bunk-login.png"
        alt="PetroSoft Petrol Station"
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-left
        "
      />

    </section>

  </div>
);
}