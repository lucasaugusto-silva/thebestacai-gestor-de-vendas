import storeCashModel, { Entity } from "../models/storeCash";

export const storeCashFactory = {
  getAvailableStoreCashes: async () =>
    await storeCashModel.getAvailableStoreCashes(),
  getCurrent: async () => await storeCashModel.getOne(),
  openStoreCash: async (
    code: string,
    amount_on_open: number
  ): Promise<Entity | undefined> =>
    await storeCashModel.openStoreCash(code, amount_on_open),
  closeStoreCash: async (
    code: string,
    amount_on_open: number
  ): Promise<Entity | undefined> =>
    await storeCashModel.closeStoreCash(code, amount_on_open),
  getStoreCashBalance: async (withClosedCash = false) =>
    await storeCashModel.getStoreCashBalance(withClosedCash),
  getStoreCashHistoryService: async () =>
    await storeCashModel.getStoreCashHistoryService(),
  updateStoreCashObservation: async (observation: string) =>
    await storeCashModel.updateStoreCashObservation(observation),
};
