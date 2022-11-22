import { BaseRepository } from "../../repository/baseRepository";
import { IUseCaseFactory } from "../useCaseFactory.interface";
import { StorageNames } from "../../repository/storageNames";
import { StoreDto, StoreCashDto } from "../../models/gestor";
import { v4 } from "uuid";

interface Request {
  amount_on_open: number;
}

class OpenStoreCash implements IUseCaseFactory {
  constructor(
    private storeCashRepository = new BaseRepository<StoreCashDto>(
      StorageNames.StoreCash
    ),
    private saleRepository = new BaseRepository<StoreDto>(StorageNames.Sale),
    private integratedSaleRepository = new BaseRepository<StoreDto>(StorageNames.Integrated_Sale),
    private integratedHandlerRepository = new BaseRepository<StoreDto>(StorageNames.Integrated_Handler)
  ) { }

  async execute({
    amount_on_open
  }: Request): Promise<StoreCashDto | undefined> {
    const payload: StoreCashDto = {
      id: v4(),
      gv_sales: 0,
      code: "OFFLINE",
      amount_on_open,
      is_opened: true,
      is_online: false,
    };

    /*
      TODO: Implementar logs de backup do banco antes do reset
    */

    await this.saleRepository.clear();
    await this.integratedSaleRepository.clear();
    await this.integratedHandlerRepository.clear();

    await this.storeCashRepository.clear();
    await this.storeCashRepository.create(payload);
    return payload;
  }
}

export const openStoreCash = new OpenStoreCash();
