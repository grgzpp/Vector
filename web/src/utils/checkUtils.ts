
/** Check if provided string is parsable to an integer and if it is positive. */
export const isPositiveInteger = (stringDate: string): boolean => {
    const number = Number(stringDate);
    const isInteger = Number.isInteger(number);
    const isPositive = number >= 0;
    return isInteger && isPositive;
}

/** Check if provided amount string meets the validation criteria. */
export const isAmountValid = (amount: number): boolean => {
    const stringAmount = String(amount);
    const decimalDigits = process.env.DECIMAL_DIGITS || 2; // Allowed decimal digits from environment variable
    // Amount validation: positive number, excluiding 0, with 2 decimal digits and max 9 integer digits
    const regexPattern = new RegExp(`^(?!0(\\.00)?$)([1-9]\\d{0,8}(\\.\\d{${decimalDigits}})?|0\\.\\d{${decimalDigits}})$`);
    return regexPattern.test(stringAmount);
}