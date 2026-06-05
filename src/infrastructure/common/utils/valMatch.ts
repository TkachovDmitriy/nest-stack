export const valMatch = (object: object, str: string) => {
  const matchingKey = Object.keys(object || {}).find((key) => key.includes(str));
  return matchingKey ? object[matchingKey] : null;
};
