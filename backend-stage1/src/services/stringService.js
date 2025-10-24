import crypto from 'crypto';

export function analyzeString(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, '');
  const reversed = normalized.split('').reverse().join('');
  const is_palindrome = normalized === reversed;

  const length = value.length;
  const unique_characters = new Set(value).size;
  const word_count = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;

  const sha256_hash = crypto.createHash('sha256').update(value).digest('hex');
  const character_frequency_map = {};

  for (const ch of value) {
    character_frequency_map[ch] = (character_frequency_map[ch] || 0) + 1;
  }

  return {
    length,
    is_palindrome,
    unique_characters,
    word_count,
    sha256_hash,
    character_frequency_map
  };
}

export default analyzeString;
