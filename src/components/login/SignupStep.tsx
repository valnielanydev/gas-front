import type { FormEvent } from "react";
import { BackButton } from "./BackButton";
import { Field } from "./Field";
import { CtaButton } from "./CtaButton";

interface SignupStepProps {
  name: string;
  onNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  loading: boolean;
  ready: boolean;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

export function SignupStep({
  name,
  onNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  loading,
  ready,
  onSubmit,
  onBack,
}: SignupStepProps) {
  return (
    <>
      <BackButton onClick={onBack} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-[15px] font-medium text-slate-400">
          Preencha seus dados para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field
          label="Nome completo"
          value={name}
          onChange={onNameChange}
          placeholder="João da Silva"
          autoComplete="name"
        />
        <Field
          label="E-mail"
          value={email}
          onChange={onEmailChange}
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
        />
        <Field
          label="Telefone"
          value={phone}
          onChange={onPhoneChange}
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
        />
        <CtaButton ready={ready} loading={loading}>
          Criar conta e entrar
        </CtaButton>
      </form>
    </>
  );
}
