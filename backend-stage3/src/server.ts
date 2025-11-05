import express from 'express';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import { runAgent } from './agent/index.js';
import { A2ARequest } from './types.js';

// Load environment variables
config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

/**
 * A2A endpoint Mastra will call.
 * Mastra/A2A: POST with message payload -> expects JSON response with reply/actions
 *
 * NOTE: adapt field names to match the exact Telex/Mastra schema if they differ.
 */
app.post('/a2a/agent/telex-codebuddy', async (req, res) => {
  try {
    const payload: A2ARequest = req.body;
    // quick validation
    if (!payload) return res.status(400).json({ error: 'missing payload' });

    const response = await runAgent(payload);

    // You can either:
    //  - 1) Return the reply as the synchronous A2A response (preferred for quick responses)
    //  - 2) Kick off an async job that posts back to Telex API if needed.
    //
    // Here we return the response directly.
    return res.json(response);
  } catch (err: any) {
    console.error('A2A endpoint error', err);
    return res.status(500).json({ error: String(err?.message ?? err) });
  }
});

/**
 * Optional: a Telex webhook endpoint
 * If Telex supports outgoing webhooks for events you can also implement:
 */
app.post('/webhook/telex', async (req, res) => {
  const event = req.body;
  // Signature validation would go here (using WEBHOOK_SECRET)
  // For now, accept and forward to same handler
  try {
    const payload: A2ARequest = {
      id: event.id,
      channel_id: event.channel_id,
      user: event.user,
      text: event.text,
      metadata: event.metadata
    };
    const response = await runAgent(payload);
    // If Telex expects 200 quickly, acknowledge then process asynchronously.
    res.json({ ok: true });
    // Optionally push response back using Telex REST API (if available).
    // For this demo we skip that.
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.get('/', (_req, res) => res.send('TelexCodeBuddy is alive'));

app.listen(PORT, () => {
  console.log(`TelexCodeBuddy running on port ${PORT}`);
});
