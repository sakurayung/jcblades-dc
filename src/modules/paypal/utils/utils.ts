import { zeroDecimalCurrencies } from "medusa-core-utils";

export function roundToTwo(num: number, currency: string): string {
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(num).toString();
  } else {
    return num.toFixed(2);
  }
}