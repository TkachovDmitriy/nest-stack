// import { genSaltSync, hash } from 'bcrypt';

// export const passwordHashing = async (password: string): Promise<string> => {
//   const saltRounds = 10;

//   const saltOrRounds = genSaltSync(saltRounds);
//   const passwordHash = await hash(password, saltOrRounds);

//   return passwordHash;
// };

export const normalizeTime = (hours: string, minutes: string): string => {
  if (hours.length === 1) {
    return `0${hours}:${minutes}`;
  }

  return `${hours}:${minutes}`;
};

export const capitalizeFirstLetter = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

export const getDatabaseNameFromUrl = (url: string): string => {
  try {
    return new URL(url).pathname.slice(1) || 'kumakatok_db';
  } catch (_error) {
    return 'kumakatok_db';
  }
};
