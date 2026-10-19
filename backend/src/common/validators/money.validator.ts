import { BadRequestException } from '@nestjs/common';

interface ValidateMoneyOptions {
  fieldName: string;
  min?: number;
  allowZero?: boolean;
  decimalPlaces?: number;
}

export function validateMoney(
  value: number,
  {
    fieldName,
    min = 0,
    allowZero = false,
    decimalPlaces = 2,
  }: ValidateMoneyOptions,
): void {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new BadRequestException(`${fieldName} must be a valid number.`);
  }

  if (allowZero ? amount < min : amount <= min) {
    throw new BadRequestException(
      `${fieldName} must be ${allowZero ? 'at least' : 'greater than'} ${min}.`,
    );
  }

  const decimalPart = amount.toString().split('.')[1] ?? '';

  if (decimalPart.length > decimalPlaces) {
    throw new BadRequestException(
      `${fieldName} must have up to ${decimalPlaces} decimal places.`,
    );
  }
}
