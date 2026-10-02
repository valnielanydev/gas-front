export const ptBR = {
  buttons: {
    close: "Fechar",
  },
  status: {
    pending: "Aguardando motorista",
    accepted: "Motorista aceitou",
    in_delivery: "Em rota",
    delivered: "Entregue",
    cancelled: "Cancelado",
    cancelled_by_customer: "Cancelado pelo cliente",
    cancelled_by_driver: "Cancelado pelo motorista",
    cancelado_pelo_motorista: "Cancelado pelo motorista",
    expired: "Pedido expirado",
  },
  roles: {
    master: "Master",
    reseller_admin: "Admin da revendedora",
    driver: "Motorista",
    customer: "Cliente",
  },
  approvalStatus: {
    pending: "Aguardando aprovação",
    active: "Aprovado",
    inactive: "Inativo",
  },
} as const;

export function getOrderStatusLabel(status: string): string {
  return ptBR.status[status as keyof typeof ptBR.status] ?? status;
}

export function getRoleLabel(role: string): string {
  return ptBR.roles[role as keyof typeof ptBR.roles] ?? role;
}

export function getApprovalStatusLabel(status: string): string {
  return ptBR.approvalStatus[status as keyof typeof ptBR.approvalStatus] ?? status;
}
