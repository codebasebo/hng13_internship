import express from 'express';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import { mastra } from './mastra/index.js';
import { A2ARequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

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
app.post('/a2a/agent/codeBuddyAgent', async (req, res) => {
  try {
    console.log('🚀 [A2A Request] Incoming request body:', JSON.stringify(req.body, null, 2));
    console.log('🚀 [A2A Request] Headers:', JSON.stringify(req.headers, null, 2));
    
    const payload: A2ARequest = req.body;
    // quick validation
    if (!payload) {
      console.error('❌ Missing payload');
      return res.status(400).json({ error: 'missing payload' });
    }

    console.log('📝 [Processing] Extracted text:', payload.text);
    
    if (!payload.text) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: payload.id || uuidv4(),
        error: {
          code: -32602,
          message: 'Invalid params: text is required'
        }
      });
    }
    
    const agent = mastra.getAgent("codeBuddyAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: payload.text,
      },
    ]);
    console.log('✅ Agent response generated:', result.text?.substring(0, 100) + '...');

    // Wrap in JSON-RPC 2.0 format (required for A2A/Telex)
    const jsonRpcResponse = {
      jsonrpc: '2.0',
      id: payload.id || uuidv4(),  // Use request ID or generate one
      result: {
        id: uuidv4(),  // Unique task ID
        contextId: payload.channel_id || uuidv4(),  // Use channel ID or generate
        status: {
          state: 'completed',  // Or 'running'/'failed' based on logic
          timestamp: new Date().toISOString(),
          message: {
            messageId: uuidv4(),
            role: 'agent',
            parts: [
              {
                kind: 'text',
                text: result.text || 'No response generated'  // Your agent's text
              }
            ],
            kind: 'message'
          }
        },
        artifacts: [],  // Simplified for now
        history: [],  // Optional: Add conversation history if needed
        kind: 'task'
      }
    };

    console.log('📤 [Response] Sending response back to Telex');
    return res.json(jsonRpcResponse);
  } catch (err: any) {
    console.error('❌ A2A endpoint error', err);
    // Return error in JSON-RPC format too
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || uuidv4(),
      error: {
        code: -32603,
        message: String(err?.message ?? err)
      }
    });
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
    
    if (!payload.text) {
      return res.status(400).json({ ok: false, error: 'No text provided' });
    }
    
    const agent = mastra.getAgent("codeBuddyAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: payload.text,
      },
    ]);
    // If Telex expects 200 quickly, acknowledge then process asynchronously.
    res.json({ ok: true });
    // Optionally push response back using Telex REST API (if available).
    // For this demo we skip that.
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.get('/', (_req, res) => res.send('CodeBuddy is alive - AI code assistant for reviews, explanations, refactoring, and snippets'));

app.listen(PORT, () => {
  console.log(`CodeBuddy running on port ${PORT}`);
});
