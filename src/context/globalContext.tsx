import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { createContext } from "use-context-selector";

import { notification } from "antd";

import { SaleDto } from "../models/dtos/sale";
import { SettingsDto } from "../models/dtos/settings";
import { StoreCashDto } from "../models/dtos/storeCash";
import { UserDto } from "../models/dtos/user";
import { ProductDto } from "../models/dtos/product";

type GlobalContextType = {
  sale: SaleDto;
  setSale: Dispatch<SetStateAction<SaleDto>>;
  settings: SettingsDto;
  setSettings: Dispatch<SetStateAction<SettingsDto>>;
  storeCash: StoreCashDto;
  setStoreCash: Dispatch<SetStateAction<StoreCashDto>>;
  loading: boolean;
  savingSale: boolean;
  discountModalState: boolean;
  onAddItem: (
    product: ProductDto,
    quantity: number,
    price?: number
  ) => Promise<void>;
  onDecressItem: (id: string) => Promise<void>;
  onAddDiscount: (value: number) => Promise<void>;
  onAddToQueue: (name: string) => Promise<void>;
  onRegisterSale: () => Promise<void>;
  discountModalHandler: {
    openDiscoundModal: () => void;
    closeDiscoundModal: () => void;
  };
  user: UserDto | null;
};

export const GlobalContext = createContext<GlobalContextType>(null);

export function GlobalProvider({ children }) {
  const [sale, setSale] = useState<SaleDto>();
  const [storeCash, setStoreCash] = useState<StoreCashDto>();
  const [settings, setSettings] = useState<SettingsDto>();
  const [savingSale, setSavingSale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountModalState, setDiscountModalState] = useState(false);
  const [user, setUser] = useState<UserDto | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const _sale = await window.Main.sale.getCurrent();
      const _storeCash = await window.Main.storeCash.getCurrent();
      const _user = await window.Main.user.getUser();
      const _settings = await window.Main.settings.getSettings();
      setSettings(_settings);
      setSale(_sale);
      setUser(_user);
      setStoreCash(_storeCash);
      setLoading(false);
    }
    init();
  }, []);

  const discountModalHandler = {
    openDiscoundModal: () => setDiscountModalState(true),
    closeDiscoundModal: () => setDiscountModalState(false),
  };

  const onAddItem = async (
    product: ProductDto,
    quantity: number,
    price?: number
  ): Promise<void> => {
    price;
    const updatedSale = await window.Main.sale.addItem(
      product,
      quantity,
      price
    );
    setSale(updatedSale);
  };

  const onDecressItem = async (id: string): Promise<void> => {
    const updatedSale = await window.Main.sale.decressItem(id);
    notification.success({
      message: "Item removido com sucesso!",
      description: `O item selecionado foi retirado do carrinho.`,
      duration: 3,
    });
    setSale(updatedSale);
  };

  const onRegisterSale = async (): Promise<void> => {
    if (savingSale) {
      return;
    }

    if (!sale.items.length) {
      notification.warning({
        message: "Oops! Carrinho vazio.",
        description: `Nenhum item selecionado para venda, selecione algum item
                      ao carrinho para que seja possível finalizá-la.`,
        duration: 5,
      });
    }

    if (
      +(sale.total_sold.toFixed(2) || 0) >
      sale.total_paid + (sale.discount || 0) + 0.5
    ) {
      return notification.warning({
        message: "Pagamento inválido!",
        description: `Nenhuma forma de pagamento selecionado ou valor incorreto para pagamento.`,
        duration: 5,
      });
    }

    setSavingSale(true);
    await window.Main.sale.finishSale(sale);
    const _newSale = await window.Main.sale.buildNewSale();
    setSale(_newSale);
    setSavingSale(false);
    notification.success({
      message: "Venda realizada com sucesso!",
      description: `A venda foi registrada com sucesso.`,
      duration: 3,
    });
  };

  const onAddToQueue = async (name: string): Promise<void> => {
    const _newSale = await window.Main.sale.createStepSale(name);
    setSale(_newSale);
    notification.success({
      message: "Comanda salva com sucesso!",
      description: `Para que a venda retorne ao carrinho, clique na ação de restaurar a comanda[🔁] do modal anterior.`,
      duration: 5,
    });
  };

  const onAddDiscount = async (value: number): Promise<void> => {
    if (value > sale.total_sold) {
      return notification.warning({
        message: "Não é possível aplicar este desconto",
        description: `O valor informado é maior que o valor total da venda.`,
        duration: 5,
      });
    }
    const _updatedSale = await window.Main.sale.update(sale.id, {
      ...sale,
      discount: value,
    });
    setSale(_updatedSale);
  };

  return (
    <GlobalContext.Provider
      value={{
        sale,
        setSale,
        settings,
        setSettings,
        storeCash,
        setStoreCash,
        loading,
        savingSale,
        discountModalState,
        discountModalHandler,
        onAddDiscount,
        onAddItem,
        onDecressItem,
        onRegisterSale,
        onAddToQueue,
        user,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
