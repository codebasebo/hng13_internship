import { db } from '../db/connection.js';

// Natural language query parser
function parseNaturalLanguageQuery(query) {
  const lowerQuery = query.toLowerCase();
  const filters = {};

  // Parse palindrome patterns
  if (lowerQuery.includes('palindrom')) {
    filters.is_palindrome = true;
  }

  // Parse word count patterns
  const singleWordMatch = lowerQuery.match(/single[\s-]word|one[\s-]word|\bone\b.*\bword/);
  const twoWordMatch = lowerQuery.match(/two[\s-]word|\btwo\b.*\bwords/);
  const threeWordMatch = lowerQuery.match(/three[\s-]word|\bthree\b.*\bwords/);
  
  if (singleWordMatch) {
    filters.word_count = 1;
  } else if (twoWordMatch) {
    filters.word_count = 2;
  } else if (threeWordMatch) {
    filters.word_count = 3;
  }

  // Parse length patterns
  const longerThanMatch = lowerQuery.match(/longer\s+than\s+(\d+)|more\s+than\s+(\d+)\s+character/);
  const shorterThanMatch = lowerQuery.match(/shorter\s+than\s+(\d+)|less\s+than\s+(\d+)\s+character/);
  const exactlyMatch = lowerQuery.match(/exactly\s+(\d+)\s+character/);

  if (longerThanMatch) {
    const length = parseInt(longerThanMatch[1] || longerThanMatch[2]);
    filters.min_length = length + 1;
  }
  if (shorterThanMatch) {
    const length = parseInt(shorterThanMatch[1] || shorterThanMatch[2]);
    filters.max_length = length - 1;
  }
  if (exactlyMatch) {
    const length = parseInt(exactlyMatch[1]);
    filters.min_length = length;
    filters.max_length = length;
  }

  // Parse character containment patterns
  const containsLetterMatch = lowerQuery.match(/contain(?:s|ing)?\s+(?:the\s+)?(?:letter|character)\s+([a-z])/);
  const withLetterMatch = lowerQuery.match(/with\s+(?:the\s+)?(?:letter|character)\s+([a-z])/);
  const hasLetterMatch = lowerQuery.match(/has\s+(?:the\s+)?(?:letter|character)\s+([a-z])/);
  
  if (containsLetterMatch) {
    filters.contains_character = containsLetterMatch[1];
  } else if (withLetterMatch) {
    filters.contains_character = withLetterMatch[1];
  } else if (hasLetterMatch) {
    filters.contains_character = hasLetterMatch[1];
  }

  // Parse vowel patterns
  const vowelMatch = lowerQuery.match(/first\s+vowel|vowel\s+a/);
  if (vowelMatch) {
    filters.contains_character = 'a';
  }

  return filters;
}

// Apply filters to data
function applyFilters(data, filters) {
  let result = data;

  if (filters.is_palindrome !== undefined) {
    result = result.filter(s => s.properties.is_palindrome === filters.is_palindrome);
  }

  if (filters.min_length !== undefined) {
    result = result.filter(s => s.properties.length >= filters.min_length);
  }

  if (filters.max_length !== undefined) {
    result = result.filter(s => s.properties.length <= filters.max_length);
  }

  if (filters.word_count !== undefined) {
    result = result.filter(s => s.properties.word_count === filters.word_count);
  }

  if (filters.contains_character !== undefined) {
    result = result.filter(s => s.value.toLowerCase().includes(filters.contains_character));
  }

  return result;
}

// GET /strings/filter-by-natural-language
export const filterByNaturalLanguage = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing "query" parameter' });
  }

  try {
    // Parse the natural language query
    const parsedFilters = parseNaturalLanguageQuery(query);

    // Check for conflicting filters
    if (parsedFilters.min_length && parsedFilters.max_length && 
        parsedFilters.min_length > parsedFilters.max_length) {
      return res.status(422).json({ 
        error: 'Query parsed but resulted in conflicting filters',
        details: 'min_length cannot be greater than max_length'
      });
    }

    await db.read();
    const filteredData = applyFilters(db.data.strings, parsedFilters);

    res.json({
      data: filteredData,
      count: filteredData.length,
      interpreted_query: {
        original: query,
        parsed_filters: parsedFilters
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Unable to parse natural language query',
      details: error.message 
    });
  }
};
