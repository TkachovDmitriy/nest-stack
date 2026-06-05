// Mock for nanoid to avoid ES module import issues in Jest
export const nanoid = jest.fn(() => 'mock-nanoid-id');
export const customAlphabet = jest.fn(() => jest.fn(() => 'mock-custom-nanoid'));
export const urlAlphabet = 'mock-url-alphabet';
export const customRandom = jest.fn(() => jest.fn(() => 'mock-custom-random'));
export const random = jest.fn(() => 'mock-random');
export const urlSafe = jest.fn(() => 'mock-url-safe');

export default {
  nanoid,
  customAlphabet,
  urlAlphabet,
  customRandom,
  random,
  urlSafe,
};
