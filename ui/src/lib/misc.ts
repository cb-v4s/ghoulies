import { resources } from "@/components/room/resources";
import { FacingDirection } from "@/types";

export const capitalize = (s: string) => {
  const firstLetter = s[0].toUpperCase();
  return firstLetter + s.slice(1, s.length);
};

export const sleep = (ms: number) =>
  new Promise((res, _) => setTimeout(res, ms));

export const isExpired = (timestamp: number): boolean => {
  const maxSecs = 5;
  if (Date.now() - timestamp > maxSecs * 1000) return true;

  return false;
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | undefined;

  return function (...args: Parameters<T>): void {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      // @ts-ignore
      func.apply(this, args);
    }, delay);
  };
};

export const getRandomUsername = () => {
  const randomNames = [
    "Alice",
    "Hatter",
    "Dormouse",
    "White King",
    "White Queen",
    "Red King",
    "Red Queen",
    "Tweedledum",
    "Tweedledee",
    "Guard",
    "White Rabbit",
    "Caterpillar",
    "Cheshire Cat",
    "Dodo",
    "Talking Flowers",
    "Eaglet",
    "Playing Cards",
    "Tortoise",
    "Snowdrop",
    "Nobody",
    "Red Knight",
    "Lily",
    "Bread-and-Butterfly",
    "Owl",
  ];

  return randomNames[Math.floor(Math.random() * randomNames.length)];
};

export const getImageResource = (fd: FacingDirection, imgKey: string) =>
  resources.images[`${imgKey}.${fd}`].imgElem;

export const getCookie = (name: string): string | undefined => {
  return document.cookie
    .split("; ")
    .find((row: string) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

export const clearCookies = (): void => {
  document.cookie = "";
};
