import { issuesUrl } from './constants.js';

export default function logAndRethrow(error: unknown) {
  console.error(
    'Accented threw an error (see below). Try updating your browser to the latest version. ' +
      `If you’re still seeing the error, file an issue at ${issuesUrl}.`,
  );
  throw error;
}
