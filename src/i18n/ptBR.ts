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
} as const;

export function getOrderStatusLabel(status: string): string {
  return ptBR.status[status as keyof typeof ptBR.status] ?? status;
}
