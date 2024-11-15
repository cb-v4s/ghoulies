export const capitalize = (s: string) => {
  const firstLetter = s[0].toUpperCase();
  return firstLetter + s.slice(1, s.length);
};
