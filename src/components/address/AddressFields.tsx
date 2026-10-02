import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddressValue } from "@/types/address";

interface Props {
  value: AddressValue;
  update: (patch: Partial<AddressValue>) => void;
  onCepBlur: (cep: string) => void;
  cepLoading: boolean;
}

/** CEP, number, street, neighborhood, complement, city and UF inputs. */
export function AddressFields({ value, update, onCepBlur, cepLoading }: Props) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>CEP *</Label>
          <div className="flex gap-2">
            <Input
              value={value.postalCode}
              maxLength={9}
              onChange={(e) => update({ postalCode: e.target.value })}
              onBlur={(e) => onCepBlur(e.target.value)}
              placeholder="00000-000"
            />
            {cepLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label>Número *</Label>
          <Input
            value={value.number}
            onChange={(e) => update({ number: e.target.value })}
            placeholder="123"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Rua *</Label>
        <Input
          value={value.street}
          onChange={(e) => update({ street: e.target.value })}
          placeholder="Av. Sete de Setembro"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Bairro *</Label>
          <Input
            value={value.neighborhood}
            onChange={(e) => update({ neighborhood: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Complemento</Label>
          <Input
            value={value.complement}
            onChange={(e) => update({ complement: e.target.value })}
            placeholder="Sala 2"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Cidade *</Label>
          <Input value={value.city} onChange={(e) => update({ city: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>UF *</Label>
          <Input
            value={value.state}
            maxLength={2}
            onChange={(e) => update({ state: e.target.value.toUpperCase() })}
          />
        </div>
      </div>
    </>
  );
}
