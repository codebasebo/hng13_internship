import { A2ARequest, A2AResponse } from '../types.js';
import { handleWithMastra } from '../mastra/index.js';

/**
 * Main agent entry point - now powered by Mastra!
 * Mastra framework is used for agent capabilities and Groq integration
 */
export async function runAgent(payload: A2ARequest): Promise<A2AResponse> {
  return handleWithMastra(payload);
}
