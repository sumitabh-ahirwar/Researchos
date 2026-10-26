import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";

import AuthLayout from "../layouts/AuthLayout.jsx";
import Button from "../components/ui/Button.jsx";
import Field, { Checkbox, Input, PasswordInput } from "../components/ui/Field.jsx";
import { Alert } from "../components/ui/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateEmail, validatePassword } from "../utils/validation.js";

/**
 * Login.
 *
 * Validates on blur — not on every keystroke, which is hostile while someone is
 * still typing — then re-validates live once a field has errored so the message
 * clears the moment the input becomes valid.
 *
 * Server-side failures land in `formError` rather than on a specific field,
 * because the API deliberately does not say whether it was the email or the
 * password that was wrong.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [values, setValues] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const [formError, setFormError] = useState("");

  // Where to land after signing in — the page the user was trying to reach.
  const redirectTo = location.state?.from || "/app";

  useEffect(() => {
    document.title = "Log in — ResearchOS";
  }, []);

  // Someone already signed in has no business on the login page.
  if (!isLoading && isAuthenticated && status === "idle") {
    return <Navigate to={redirectTo} replace />;
  }

  const validate = (next = values) => ({
    email: validateEmail(next.email),
    password: validatePassword(next.password),
  });

  const setField = (key, value) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) {
      setErrors((current) => ({ ...current, [key]: validate(next)[key] }));
    }
  };

  const handleBlur = (key) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: validate()[key] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (nextErrors.email || nextErrors.password) {
      // Move focus to the first problem so keyboard users are not left guessing.
      document.getElementById(nextErrors.email ? "login-email" : "login-password")?.focus();
      return;
    }

    setStatus("submitting");

    try {
      await login({ email: values.email.trim(), password: values.password });
      setStatus("success");
      // Brief pause so the success state is legible rather than a flicker.
      setTimeout(() => navigate(redirectTo, { replace: true }), 550);
    } catch (error) {
      setStatus("idle");
      setFormError(error.message);
      document.getElementById("login-password")?.focus();
    }
  };

  if (status === "success") {
    return (
      <AuthLayout>
        <div className="stack" style={{ gap: "var(--space-5)", textAlign: "center" }}>
          <span
            className="icon-tile icon-tile--lg icon-tile--success"
            style={{ margin: "0 auto" }}
            aria-hidden="true"
          >
            <CheckCircle2 size={26} />
          </span>
          <h1 className="auth-card__title">You&apos;re in</h1>
          <p className="auth-card__lead">Opening your workspace…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="auth-card__title">Welcome back</h1>
      <p className="auth-card__lead">Log in to pick up your research where you left off.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <Alert variant="danger" title="Could not sign you in">
            {formError}
          </Alert>
        )}

        <Field label="Email" htmlFor="login-email" error={errors.email} required>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            placeholder="you@example.com"
            value={values.email}
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            onChange={(event) => setField("email", event.target.value)}
            onBlur={() => handleBlur("email")}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="login-password"
          error={errors.password}
          required
          action={
            <Link
              to="/login"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--text-brand)",
              }}
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            icon={Lock}
            placeholder="Your password"
            value={values.password}
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            onChange={(event) => setField("password", event.target.value)}
            onBlur={() => handleBlur("password")}
          />
        </Field>

        <div className="auth-form__row">
          <Checkbox
            label="Remember me"
            checked={values.remember}
            onChange={(event) => setField("remember", event.target.checked)}
          />
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          block
          loading={status === "submitting"}
          trailingIcon={status === "submitting" ? undefined : ArrowRight}
        >
          {status === "submitting" ? "Signing in…" : "Log in"}
        </Button>

        <p className="field__hint" style={{ textAlign: "center" }}>
          Your session is kept in a secure, httpOnly cookie.
        </p>
      </form>

      <p className="auth-foot">
        New to ResearchOS? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
