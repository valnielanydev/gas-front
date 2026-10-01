import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useCreateCustomerAddress, useUpdateCustomerAddress } from "../../queries/customer.queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CustomerAddress } from "../../types/customer";
import { geoService } from "../../services/geo.service";
import { toast } from "sonner";
import { ApiError } from "../../integrations/api/client";

type Props = {
  address: CustomerAddress | null;
  onClose: () => void;
  title: string;
};

export function CustomerAdressDialog({ address, onClose, title }: Props) {
  const { user } = useAuth();
  const updateAddress = useUpdateCustomerAddress(user?.id);
  const createAddress = useCreateCustomerAddress(user?.id);

  const [street, setStreet] = useState(address?.street ?? "");
  const [cep, setCep] = useState(address?.postalCode ?? "");
  const [number, setNumber] = useState(address?.number ?? "");
  const [complement, setComplement] = useState(address?.complement ?? "");
  const [state, setState] = useState(address?.state ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood ?? "");

  const isPending = updateAddress.isPending || createAddress.isPending;

  const findAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const address = await geoService.lookupCep(cep);

      if (address === null) {
        toast.error("CEP não encontrado");
        return;
      }

      setStreet(address.street);
      setNeighborhood(address.neighborhood);
      setState(address.state);
      setCity(address.city);
    } catch {
      toast.error("Não foi possível buscar o CEP. Tente novamente.");
    }
  };

  function getApiErrorMessage(err: ApiError) {
    const body = err.body as { errors?: { message?: string }[] } | undefined;
    const messages = body?.errors?.map((e) => e.message).filter(Boolean);

    return messages?.length ? messages.join(", ") : err.message;
  }

  function save() {
    const data = {
      street,
      postalCode: cep,
      number,
      complement,
      state,
      neighborhood,
      city,
    };

    if (address) {
      updateAddress.mutate(
        { id: address._id, data },
        {
          onSuccess: () => {
            toast.success("Endereço Atualizado!");
            onClose();
          },
          onError: (err) => {
            toast.error(
              err instanceof ApiError
                ? getApiErrorMessage(err)
                : "Sem conexão com o servidor. Tente novamente.",
            );
          },
        },
      );
    } else {
      createAddress.mutate(data, {
        onSuccess: () => {
          toast.success("Endereço adicionado!");
          onClose();
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError
              ? getApiErrorMessage(err)
              : "Sem conexão com o servidor. Tente novamente.",
          );
        },
      });
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  required
                  value={cep}
                  onChange={(e) => {
                    setCep(e.target.value);
                    findAddressByCep(e.target.value);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="street">Rua / Avenida</Label>
              <Input
                id="street"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
            </div>

            <Button className="mt-5 cursor-pointer w-full" type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : address ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
