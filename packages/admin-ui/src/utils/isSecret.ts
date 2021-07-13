const secretRegex = /(secret|passphrase|password|private)/i;

/**
 * Guess if a field key is secret based on its key name
 */
export function isSecret(fieldKey: string): boolean {
  return secretRegex.test(fieldKey);
}
