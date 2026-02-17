import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const capitalize = (str: string): string => {
  if (!str) return str;
  return str[0].toUpperCase() + str.slice(1);
};
