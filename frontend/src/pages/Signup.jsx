import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";

import AuthLayout from "../layouts/AuthLayout.jsx";
import SocialButtons from "../components/auth/SocialButtons.jsx";
import Button from "../components/ui/Button.jsx";
import Field, { Checkbox, Input, PasswordInput } from "../components/ui/Field.jsx";
import { Alert } from "../components/ui/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  passwordStrength,
  validateConfirmation,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation.js";

/** Four-segment strength meter, announced politely for screen readers. */
function StrengthMeter({ password }) {
  const { score, level, label } = useMemo(() => passwordStrength(password), [password]);
  if (!password) return null;

  return (
    <div className="strength">
      <div className="strength__track" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="strength__seg"
            data-on={index < score}
            data-level={level}
          />
        ))}
      </div>
      <p className="strength__label" role="status">
        {label}
      </p>
    </div>
  );
}

/**
 * Signup.
 *
 * Same validation model as Login: validate on blur, then live once a field has
 * errored. Password confirmation is checked client-side only — the API never
 * receives it, since it is a typo guard rather than a credential.
 *
 * A duplicate email comes back from the API as a 409 and is attached to the
 * email field, which is where the user can actually act on it.
 */
export default function Signup() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading } = useAuth();

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    document.title = "Create an account — ResearchOS";
  }, []);

  if (!isLoading && isAuthenticated && status === "idle") {
    return <Navigate to="/app" replace />;
  }

  const validate = (next = values) => ({
    name: validateName(next.name),
    email: validateEmail(next.email),
    password: validatePassword(next.password),
    confirm: validateConfirmation(next.password, next.confirm),
    terms: next.terms ? null : "Accept the terms to continue.",
  });

  const setField = (key, value) => {
    const next = { ...values, [key]: value };
    setValues(next);

    if (touched[key]) {
      const fresh = validate(next);
      setErrors((current) => ({
        ...current,
        [key]: fresh[key],
        // Changing the password invalidates a previously matching confirmation.
        ...(key === "password" && touched.confirm ? { confirm: fresh.confirm } : {}),
      }));
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
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });

    const firstBad = ["name", "email", "password", "confirm"].find((key) => nextErrors[key]);
    if (firstBad || nextErrors.terms) {
      document.getElementById(`signup-${firstBad ?? "terms"}`)?.focus();
      return;
    }

    setStatus("submitting");

    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      setStatus("success");
      setTimeout(() => navigate("/app", { replace: true }), 650);
    } catch (error) {
      setStatus("idle");

      // 409 means the email is taken — that belongs on the email field, where
      // the user can change it, not in a detached banner.
      if (error.status === 409) {
        setErrors((current) => ({ ...current, email: error.message }));
        document.getElementById("signup-email")?.focus();
      } else {
        setFormError(error.message);
      }
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
          <h1 className="auth-card__title">Workspace ready</h1>
          <p className="auth-card__lead">
            Welcome, {values.name.trim().split(" ")[0]}. Taking you to your dashboard…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="auth-card__title">Create your workspace</h1>
      <p className="auth-card__lead">
        Start running multi-agent research over the web, your PDFs, or both.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <SocialButtons action="Sign up" />

        <div className="auth-divider">or sign up with email</div>

        {formError && (
          <Alert variant="danger" title="Could not create your account">
            {formError}
          </Alert>
        )}

        <Field label="Full name" htmlFor="signup-name" error={errors.name} required>
          <Input
            id="signup-name"
            name="name"
            autoComplete="name"
            icon={User}
            placeholder="Ada Lovelace"
            value={values.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => setField("name", event.target.value)}
            onBlur={() => handleBlur("name")}
          />
        </Field>

        <Field label="Email" htmlFor="signup-email" error={errors.email} required>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            placeholder="you@example.com"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setField("email", event.target.value)}
            onBlur={() => handleBlur("email")}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="signup-password"
          error={errors.password}
          hint="At least 8 characters."
          required
        >
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            icon={Lock}
            placeholder="Create a password"
            value={values.password}
            invalid={Boolean(errors.password)}
            onChange={(event) => setField("password", event.target.value)}
            onBlur={() => handleBlur("password")}
          />
        </Field>

        <StrengthMeter password={values.password} />

        <Field
          label="Confirm password"
          htmlFor="signup-confirm"
          error={errors.confirm}
          success={
            values.confirm && !errors.confirm && values.confirm === values.password
              ? "Passwords match"
              : undefined
          }
          required
        >
          <PasswordInput
            id="signup-confirm"
            name="confirm"
            autoComplete="new-password"
            icon={Lock}
            placeholder="Re-enter your password"
            value={values.confirm}
            invalid={Boolean(errors.confirm)}
            onChange={(event) => setField("confirm", event.target.value)}
            onBlur={() => handleBlur("confirm")}
          />
        </Field>

        <div>
          <Checkbox
            id="signup-terms"
            label="I agree to the terms of service and privacy policy"
            checked={values.terms}
            onChange={(event) => setField("terms", event.target.checked)}
            onBlur={() => handleBlur("terms")}
          />
          {errors.terms && touched.terms && (
            <p className="field__error" style={{ marginTop: "var(--space-2)" }} role="alert">
              {errors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          block
          loading={status === "submitting"}
          trailingIcon={status === "submitting" ? undefined : ArrowRight}
        >
          {status === "submitting" ? "Creating workspace…" : "Create account"}
        </Button>

        <p className="field__hint" style={{ textAlign: "center" }}>
          Your password is hashed with bcrypt before it is stored. We never keep the original.
        </p>
      </form>

      <p className="auth-foot">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
