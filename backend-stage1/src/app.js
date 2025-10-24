import express from 'express';
import bodyParser from 'body-parser';
import stringRoutes from './routes/stringRoutes.js';

export const app = express();
app.use(bodyParser.json());
app.use('/strings', stringRoutes);

// Health check
app.get('/', (req, res) => res.send('String Analyzer API Running'));
