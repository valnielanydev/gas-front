import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BackButton } from "./BackButton";
import { Field } from "./Field";
import { CtaButton } from "./CtaButton";
import { EyeIcon, EyeOffIcon } from "./icons";

interface StaffStepProps {
  role: "rev" | "admin";
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  loading: boolean;
  ready: boolean;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

export function StaffStep({
  role,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  loading,
  ready,
  onSubmit,
  onBack,
}: StaffStepProps) {
  return (
    <>
      <BackButton onClick={onBack} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {role === "rev" ? "Revendedora" : "Administrativo"}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-slate-400">Acesse com seu e-mail e senha</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field
          label="E-mail"
          value={email}
          onChange={onEmailChange}
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
        />
        <Field
          label="Senha"
          value={password}
          onChange={onPasswordChange}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="flex p-1 text-slate-500 transition-colors hover:text-slate-300"
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link
            to="/reset-password"
            className="text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            Esqueci minha senha
          </Link>
        </div>

        <CtaButton ready={ready} loading={loading}>
          {ready ? "Entrar" : "Preencha e-mail e senha"}
        </CtaButton>
      </form>
    </>
  );
}
