import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  CreditCard,
  HelpCircle,
  LogOut,
  MapPin,
  Moon,
  Shield,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProfileSection } from "@/components/customer/ProfileSection";
import {
  ProfileRow,
  ProfileRowContent,
  profileRowClassName,
} from "@/components/customer/ProfileRow";
import { useAuth } from "@/auth/AuthProvider";
import { customerService } from "@/services/customer.service";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/profile/")({
  component: CustomerProfile,
});

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function CustomerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    customerService
      .activeOrder()
      .then((data) => setHasActiveOrder(Boolean(data?.id)))
      .catch(() => {});
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const name = user?.name ?? "";

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground [text-wrap:balance]">
            {name || "Meu perfil"}
          </h1>
          {user?.email && (
            <p className="mt-1.5 text-[13.5px] font-medium text-muted-foreground">{user.email}</p>
          )}
        </div>
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-primary/10 text-lg font-extrabold text-primary">
            {initialsOf(name)}
          </div>
          <button
            type="button"
            onClick={() => toast.info("Em breve: escolha uma foto de perfil.")}
            aria-label="Alterar foto"
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-background bg-primary text-primary-foreground"
          >
            <Camera className="h-[13px] w-[13px]" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="space-y-1 pb-2">
        <ProfileSection label="Conta">
          <ProfileRow
            icon={UserIcon}
            title="Dados pessoais"
            to="/customer/profile/dados-pessoais"
          />
          <ProfileRow icon={Shield} title="Segurança" to="/customer/profile/seguranca" />
          <ProfileRow icon={MapPin} title="Endereços" to="/customer/profile/enderecos" />
        </ProfileSection>

        <ProfileSection label="Pagamento & pedidos">
          <ProfileRow
            icon={CreditCard}
            title="Formas de pagamento"
            to="/customer/profile/pagamento"
          />
          <ProfileRow
            icon={ShoppingBag}
            title="Pedidos"
            to="/customer/orders"
            meta={hasActiveOrder ? "1 ativo" : undefined}
          />
        </ProfileSection>

        <ProfileSection label="Preferências">
          <ProfileRow icon={Bell} title="Notificações" to="/customer/profile/notificacoes" />
          <ProfileRow icon={Moon} title="Aparência" to="/customer/profile/aparencia" />
        </ProfileSection>

        <ProfileSection label="Suporte">
          <ProfileRow icon={HelpCircle} title="Ajuda" to="/customer/profile/ajuda" />
        </ProfileSection>

        <ProfileSection>
          <AlertDialog>
            <AlertDialogTrigger className={profileRowClassName}>
              <ProfileRowContent icon={LogOut} title="Sair da conta" destructive chevron={false} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você precisará entrar novamente com seu CPF e senha para acessar o app.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleLogout()}>Sair</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ProfileSection>
      </div>
    </div>
  );
}
