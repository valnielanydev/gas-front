import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";
import { useCustomerAddresses, useUpdateCustomerAddress } from "@/queries/customer.queries";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthProvider";
import type { CustomerAddress } from "@/types/customer";
import { useState } from "react";
import { CustomerAddressDialog } from "@/components/customer/CustomerAddressDialog";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/customer/profile/enderecos")({
  component: AddressesPage,
});

function AddressesPage() {
  const { user } = useAuth();
  const { data: addresses = [] } = useCustomerAddresses(user?.id);
  const updateAddress = useUpdateCustomerAddress(user?.id);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    setEditing(address);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function setDefault(address: CustomerAddress) {
    if (address.isDefault || updateAddress.isPending) return;
    updateAddress.mutate({ id: address._id, data: { isDefault: true } });
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Endereços" />
      <div className="px-5 pt-1">
        {addresses?.map((address) => (
          <div
            key={address._id}
            onClick={() => setDefault(address)}
            className="border p-4 rounded-md mb-3 cursor-pointer"
            title="Clique para definir como endereço padrão"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="inline-block mr-[0.9rem]">
                  <Input
                    type="radio"
                    checked={address.isDefault === true}
                    onChange={() => setDefault(address)}
                    className="h-3 "
                  ></Input>
                </div>
                <span className="text-md md:text-lg">
                  {address.street}, {address.number}
                </span>
              </div>

              {address.isDefault && (
                <p className="shrink-0 rounded-full bg-muted px-3 py-1 text-[0.5rem] md:text-xs font-medium text-muted-foreground">
                  Padrão
                </p>
              )}
            </div>

            <div className="ml-7 text-muted-foreground text-sm md:text-lg">
              {address.postalCode && <span className="">CEP : {address.postalCode} - </span>}
              <span>
                {address.city}, {address.state}
              </span>
            </div>

            <button
              className="ml-[1.8rem] cursor-pointer underline hover:text-neutral-300 text-sm md:text-lg"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(address);
              }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      <div className="px-5">
        <button
          onClick={openCreate}
          className="p-5 border border-dashed rounded-md cursor-pointer w-full flex gap-2 justify-center hover:bg-gray-400/10 hover:border-blue-400"
        >
          <Plus className="text-blue-400"></Plus>{" "}
          <p className="text-blue-400">Adicionar Endereço</p>
        </button>
      </div>

      {dialogOpen && (
        <CustomerAddressDialog
          key={editing?._id ?? "new"}
          title={editing ? "Editar Endereço" : "Novo Endereço"}
          address={editing}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
