export type A2ARequest = {
  // This is the incoming payload Mastra or Telex will POST to your agent.
  // Actual platform may vary — adapt keys if Telex docs show different names.
  id?: string;
  channel_id?: string;        // channel uuid (used for logs)
  user?: {
    id: string;
    name?: string;
  };
  text?: string;             // message body
  metadata?: Record<string, any>;
  // original event type (message, mention, etc.)
  type?: string;
};

export type A2AResponse = {
  // Response you send back synchronously to the A2A call
  // Make sure to honor Telex/Mastra expected format — this is a generic structure
  reply?: {
    text: string;
    attachments?: Array<{ type: string; data: any }>;
  };
  // optional actions: open URL, suggestion buttons, etc.
  actions?: Array<{ type: string; label: string; payload?: any }>;
  // error field for debugging
  error?: string | null;
};
