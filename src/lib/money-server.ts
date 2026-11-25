import { Decimal } from "@prisma/client/runtime/library";

export type MoneyInput = Decimal | number | string;

export function money(value: MoneyInput): Decimal {
  return new Decimal(value);
}

export function moneyAdd(...values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((sum, v) => sum.plus(money(v)), money(0));
}

export function moneyMul(a: MoneyInput, b: MoneyInput): Decimal {
  return money(a).mul(money(b));
}

export function toNumber(value: MoneyInput): number {
  return money(value).toNumber();
}
