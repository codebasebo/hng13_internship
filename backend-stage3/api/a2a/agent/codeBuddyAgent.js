import { randomUUID } from "crypto";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jsonrpc, id: requestId, params } = req.body || {};

    // Basic validation
    if (jsonrpc !== "2.0" || !requestId) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: requestId || null,
        error: {
          code: -32600,
          message: 'Invalid Request: "jsonrpc" must be "2.0" and "id" must be provided.',
        },
      });
    }

    const { message } = params || {};
    if (!message || !message.parts || !message.parts.length) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: requestId,
        error: {
          code: -32602,
          message: "Invalid params: message with parts required",
        },
      });
    }

    // Extract text from message parts
    const textContent = message.parts
      .filter(part => part.kind === 'text')
      .map(part => part.text)
      .join(' ');

    if (!textContent.trim()) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: requestId,
        error: {
          code: -32602,
          message: "No text content found in message",
        },
      });
    }

    // Generate response using GROQ
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are CodeBuddy, an expert AI code assistant specialized in helping developers write better code.

Your capabilities include:
- Code Review: Analyze code for bugs, security issues, performance problems, and best practices
- Code Explanation: Break down complex code into understandable explanations
- Refactoring: Suggest improvements and provide refactored versions of code
- Code Generation: Create code snippets and examples based on user requirements

When assisting users:
1. Provide clear, concise, and actionable feedback
2. Use proper technical terminology while keeping explanations accessible
3. Highlight potential issues with severity levels (critical, warning, info)
4. Suggest concrete improvements with code examples when applicable
5. Consider performance, security, maintainability, and readability
6. Support multiple programming languages and frameworks

Be friendly, professional, and focused on helping developers improve their code quality.`,
        },
        {
          role: "user",
          content: textContent,
        },
      ],
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const textResponse = chatCompletion.choices[0]?.message?.content || "CodeBuddy is currently unavailable. Please try again in a moment.";

    // Return A2A compliant response
    return res.status(200).json({
      jsonrpc: "2.0",
      id: requestId,
      result: {
        id: randomUUID(),
        contextId: randomUUID(),
        kind: "task",
        status: {
          state: "completed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            role: "agent",
            messageId: randomUUID(),
            parts: [
              {
                kind: "text",
                text: textResponse,
              },
            ],
          },
        },
        artifacts: [],
        history: [],
      },
    });
  } catch (error) {
    console.error("A2A route error:", error);
    return res.status(500).json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: "Internal error",
        data: { details: error.message || "Unknown error" },
      },
    });
  }
}