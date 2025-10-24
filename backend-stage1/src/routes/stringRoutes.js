import express from 'express';
import {
  createString,
  getString,
  getAllStrings,
  deleteString
} from '../controllers/stringController.js';
import { filterByNaturalLanguage } from '../controllers/naturalLanguageController.js';

const router = express.Router();

router.post('/', createString);
router.get('/filter-by-natural-language', filterByNaturalLanguage);
router.get('/', getAllStrings);
router.get('/:value', getString);
router.delete('/:value', deleteString);

export default router;
