import { randomInt } from 'crypto';

const CODE_MIN = 100000;
const CODE_MAX = 999999;

export const generateNumericCode = () => randomInt(CODE_MIN, CODE_MAX).toString();
