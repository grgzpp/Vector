
export const isPositiveInteger = (stringDate: string) => {
    const number = Number(stringDate);
    const isInteger = Number.isInteger(number);
    const isPositive = number >= 0;
    return isInteger && isPositive;
}