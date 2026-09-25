import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Field } from "./Field";
import { CtaButton } from "./CtaButton";
import { RoleCard } from "./RoleCard";
import { EyeIcon, EyeOffIcon, StoreIcon, ShieldIcon } from "./icons";

interface ClientStepProps {
  cpf: string;
  onCpfChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  loading: boolean;
  ready: boolean;
  onSubmit: (e: FormEvent) => void;
  onSelectRole: (role: "rev" | "admin") => void;
}

export function ClientStep({
  cpf,
  onCpfChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  loading,
  ready,
  onSubmit,
  onSelectRole,
}: ClientStepProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-[15px] font-medium text-slate-400">
          Use seu CPF e senha para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field
          label="CPF"
          value={cpf}
          onChange={onCpfChange}
          inputMode="numeric"
          placeholder="000.000.000-00"
          maxLength={14}
          autoComplete="username"
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
          {ready ? "Entrar" : "Preencha CPF e senha"}
        </CtaButton>
      </form>

      <div className="my-7 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[12px] font-semibold tracking-[1px] text-slate-500">
          OU ACESSE COMO
        </span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex gap-3">
        <RoleCard
          active={false}
          onClick={() => onSelectRole("rev")}
          label="Revendedora"
          icon={<StoreIcon />}
        />
        <RoleCard
          active={false}
          onClick={() => onSelectRole("admin")}
          label="Admin"
          icon={<ShieldIcon />}
        />
      </div>

      <div className="flex-1" />
    </>
  );
}
