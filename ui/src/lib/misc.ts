export const capitalize = (s: string) => {
  const firstLetter = s[0].toUpperCase();
  return firstLetter + s.slice(1, s.length);
};

export const sleep = (ms: number) =>
  new Promise((res, _) => setTimeout(res, ms));
