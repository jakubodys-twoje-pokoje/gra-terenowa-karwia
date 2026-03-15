/**
 * Profanity filter for user-submitted text.
 * Blocks nicknames, city names, and email addresses that contain vulgar words.
 */

const BLOCKED_WORDS = [
  // Polish profanity
  'kurwa', 'kurwy', 'kurew', 'kurwami', 'kurwach', 'kurwic',
  'chuj', 'chuja', 'chujowi', 'chujowy', 'chujowa', 'chujem', 'chuje', 'chujec',
  'pizda', 'pizdy', 'pizdzie', 'pizdę', 'pizdę',
  'pizdo', 'pizdowaty',
  'jebać', 'jebac', 'jebał', 'jebala', 'jebie', 'jebany', 'jebana', 'jebane',
  'pierdolić', 'pierdolic', 'pierdolony', 'pierdolona', 'pierdol', 'pierdole',
  'pierdoleniec', 'pierdolec',
  'morda', 'mordować', 'mordowac',
  'suka', 'suką', 'sukę', 'sucy',
  'skurwysyn', 'skurwiał', 'skurwiel',
  'cipa', 'cipę', 'cipie', 'cipka', 'cipki',
  'dupa', 'dupę', 'dupy', 'dupie', 'dupek', 'dupka',
  'gówno', 'gowno', 'gówna', 'gównem',
  'fiut', 'fiuta', 'fiutem',
  'cwel', 'cwele', 'cwela',
  'pedał', 'pedal', 'pedała',
  'pojeb', 'pojeba', 'pojebany', 'pojebana',
  'debil', 'debile', 'debila',
  'idiota', 'idioci', 'idiocie',
  'kretyni', 'kretyn', 'kretyna',
  'zjeb', 'zjeba', 'zjebany',
  'spierdalać', 'spierdolić', 'spierdalaj', 'spierdalac',
  'odpierdolić', 'odpierdalac',
  'wpierdolić', 'wpierdalac',
  // Common English profanity (in case of mixed usage)
  'fuck', 'fucker', 'fucking', 'fucked',
  'shit', 'cunt', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'nigger', 'nigga',
  'whore', 'slut',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]/g, ''); // keep only alphanumeric
}

/**
 * Returns true if the text contains a blocked word.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = normalize(text);
  return BLOCKED_WORDS.some((word) => normalized.includes(normalize(word)));
}

/**
 * Validates a user-facing field value.
 * Returns an error message string if invalid, or null if OK.
 */
export function validateField(fieldName: string, value: string | undefined | null): string | null {
  if (!value) return null;
  if (containsProfanity(value)) {
    return `Pole "${fieldName}" zawiera niedozwolone słowa.`;
  }
  return null;
}
