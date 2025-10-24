import dayjs from 'dayjs';
import { db } from '../db/connection.js';
import { analyzeString } from '../services/stringService.js';

// POST /strings
export const createString = async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Missing "value"' });
  if (typeof value !== 'string') return res.status(422).json({ error: '"value" must be a string' });

  await db.read();
  const existing = db.data.strings.find(s => s.value === value);
  if (existing) return res.status(409).json({ error: 'String already exists' });

  const properties = analyzeString(value);
  const record = {
    id: properties.sha256_hash,
    value,
    properties,
    created_at: dayjs().toISOString()
  };

  db.data.strings.push(record);
  await db.write();

  res.status(201).json(record);
};

// GET /strings/:value
export const getString = async (req, res) => {
  const { value } = req.params;
  await db.read();
  const record = db.data.strings.find(s => s.value === value);
  if (!record) return res.status(404).json({ error: 'String not found' });
  res.json(record);
};

// GET /strings (with filters)
export const getAllStrings = async (req, res) => {
  await db.read();
  let data = db.data.strings;

  const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

  if (is_palindrome !== undefined) {
    if (!['true', 'false'].includes(is_palindrome))
      return res.status(400).json({ error: 'Invalid is_palindrome' });
    data = data.filter(s => s.properties.is_palindrome === (is_palindrome === 'true'));
  }

  if (min_length) data = data.filter(s => s.properties.length >= parseInt(min_length));
  if (max_length) data = data.filter(s => s.properties.length <= parseInt(max_length));
  if (word_count) data = data.filter(s => s.properties.word_count === parseInt(word_count));
  if (contains_character) data = data.filter(s => s.value.includes(contains_character));

  res.json({
    data,
    count: data.length,
    filters_applied: req.query
  });
};

// DELETE /strings/:value
export const deleteString = async (req, res) => {
  const { value } = req.params;
  await db.read();
  const index = db.data.strings.findIndex(s => s.value === value);
  if (index === -1) return res.status(404).json({ error: 'String not found' });
  db.data.strings.splice(index, 1);
  await db.write();
  res.status(204).send();
};
