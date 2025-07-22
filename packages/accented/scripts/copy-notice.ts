import { cp } from 'node:fs/promises';

await cp('../../NOTICE', './NOTICE');
