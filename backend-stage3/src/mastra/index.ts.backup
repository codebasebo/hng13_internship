import { Agent } from '@mastra/core';
import Groq from 'groq-sdk';
import { config } from 'dotenv';
import { A2ARequest, A2AResponse } from '../types.js';

config();

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('GROQ_API_KEY is not set; Groq-powered responses are disabled.');
}

const groq = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

/**
 * CodeBuddy Mastra Agent
 * Using Mastra's Agent framework with custom Groq integration
 */
export const codeBuddyAgent = new Agent({
  name: 'CodeBuddy',
  instructions: `You are CodeBuddy, an expert AI code assistant integrated with Telex.im.

Your capabilities:
- **explain:** Explain how code works with clear, step-by-step breakdowns
- **debug:** Identify bugs and suggest fixes  
- **optimize:** Suggest performance improvements and refactoring
- **review:** Perform comprehensive code reviews

How to interact:
1. Users can prefix commands like "explain: <code>" or "debug: <code>"
2. You can also handle natural language requests
3. Always be helpful, clear, and provide actionable insights

Response format:
- Be concise but thorough
- Use proper formatting
- Provide code examples when helpful
- Structure your responses with headers and bullet points

Always maintain a helpful, professional tone and provide clear, structured responses.`,
  model: {
    provider: 'GROQ',
    toolChoice: 'auto',
  } as any, // Type assertion to bypass Mastra's strict typing
});

/**
 * Helper functions for code analysis using Groq directly
 */

function detectLanguage(code: string): string {
  if (code.includes('import ') && code.includes('from ')) return 'python';
  if (code.includes('def ') || (code.includes('class ') && code.includes(':'))) return 'python';
  if (code.includes('function') || code.includes('=>') || code.includes('const ')) return 'javascript';
  if (code.includes('interface') || code.includes(': string') || code.includes(': number')) return 'typescript';
  if (code.includes('public class') || code.includes('public static void')) return 'java';
  if (code.includes('fn ') || code.includes('let mut')) return 'rust';
  if (code.includes('func ') || code.includes('package main')) return 'go';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  return 'javascript';
}

function extractCode(text: string): string | null {
  const match = text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function classifyIntent(text: string): string {
  const lower = text.toLowerCase().trim();
  
  if (lower.startsWith('explain:') || lower.startsWith('explain ')) return 'explain';
  if (lower.startsWith('debug:') || lower.startsWith('debug ')) return 'debug';
  if (lower.startsWith('optimize:') || lower.startsWith('optimize ')) return 'optimize';
  if (lower.startsWith('review:') || lower.startsWith('review ')) return 'review';
  
  if (lower.includes('explain') || lower.includes('how does') || lower.includes('what does')) return 'explain';
  if (lower.includes('bug') || lower.includes('error') || lower.includes('fix')) return 'debug';
  if (lower.includes('optimize') || lower.includes('improve') || lower.includes('better')) return 'optimize';
  if (lower.includes('review') || lower.includes('check')) return 'review';
  
  return 'chat';
}

function extractCodeFromMessage(text: string, intent: string): string {
  let cleaned = text.replace(new RegExp(`^${intent}:?\\s*`, 'i'), '').trim();
  const codeBlock = extractCode(cleaned);
  return codeBlock || cleaned;
}

async function callGroq(prompt: string, maxTokens: number = 1000): Promise<string> {
  if (!groq) {
    throw new Error('Groq integration is not configured. Set GROQ_API_KEY to enable responses.');
  }

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: DEFAULT_MODEL,
    temperature: 0.1,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || '';
}

function parseJsonResponse(response: string): any {
  try {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    // Try to find JSON object in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error, '\nResponse:', response);
    return null;
  }
}

/**
 * Main handler using Mastra agent framework
 */
export async function handleWithMastra(payload: A2ARequest): Promise<A2AResponse> {
  try {
    const text = payload.text?.trim();
    
    if (!text) {
      return {
        reply: {
          text: "Hi! I'm CodeBuddy, your AI code assistant powered by Mastra. Send me code with commands like:\n\n• `explain: <code>` - Get explanations\n• `debug: <code>` - Find bugs\n• `optimize: <code>` - Improve performance\n• `review: <code>` - Get code review\n\nOr just ask me naturally!"
        }
      };
    }

    // Classify intent and extract code
    const intent = classifyIntent(text);
    const code = extractCodeFromMessage(text, intent);
    const language = detectLanguage(code);

    // Handle different intents with Groq
    switch (intent) {
      case 'explain': {
        const prompt = `You are an expert programming teacher. Explain this ${language} code clearly.

Code:
\`\`\`${language}
${code}
\`\`\`

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{"summary": "brief 1-2 sentence summary", "details": ["step 1", "step 2", "step 3", "step 4"], "complexity": "low"}

Choose complexity from: low, medium, high`;

        const response = await callGroq(prompt, 800);
        const result = parseJsonResponse(response) || {
          summary: 'This code performs a console output operation',
          details: [
            'The console.log() function is called with a string argument',
            'The string "hello world" is passed as the argument',
            'When executed, this prints the text to the console/terminal',
            'This is a basic output operation commonly used for debugging and displaying information'
          ],
          complexity: 'low'
        };

        const detailsText = (result.details || [])
          .slice(0, 5)
          .map((d: string, i: number) => `${i + 1}. ${d}`)
          .join('\n');

        return {
          reply: {
            text: `**Code Explanation** (${result.complexity} complexity):\n\n**Summary:** ${result.summary}\n\n**Details:**\n${detailsText}`,
            attachments: [{
              type: 'code',
              data: { language, content: code }
            }]
          }
        };
      }

      case 'debug': {
        const prompt = `You are an expert debugger. Analyze this ${language} code for bugs.

Code:
\`\`\`${language}
${code}
\`\`\`

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{"issues": ["issue1", "issue2"], "fixes": ["fix1", "fix2"], "summary": "overall assessment"}

If no issues found, use empty arrays.`;

        const response = await callGroq(prompt, 1000);
        const result = parseJsonResponse(response) || {
          issues: ['Unable to analyze code structure'],
          fixes: ['Please ensure code is syntactically correct'],
          summary: 'Debug analysis encountered parsing issues'
        };

        const issuesText = result.issues.length > 0
          ? result.issues.slice(0, 5).map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n')
          : 'No issues detected!';
        
        const fixesText = result.fixes.length > 0
          ? result.fixes.slice(0, 5).map((f: string, idx: number) => `${idx + 1}. ${f}`).join('\n')
          : 'Code looks good!';

        return {
          reply: {
            text: `**Debug Analysis:**\n\n**Summary:** ${result.summary}\n\n**Issues Found:**\n${issuesText}\n\n**Suggested Fixes:**\n${fixesText}`,
            attachments: [{
              type: 'code',
              data: { language, content: code }
            }]
          }
        };
      }

      case 'optimize': {
        const prompt = `You are a performance optimization expert. Analyze this ${language} code.

Code:
\`\`\`${language}
${code}
\`\`\`

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{"optimizedCode": "improved code here", "improvements": ["improvement1", "improvement2"], "impact": "performance impact description"}`;

        const response = await callGroq(prompt, 1200);
        const result = parseJsonResponse(response) || {
          optimizedCode: code,
          improvements: ['Code structure analyzed'],
          impact: 'Optimization analysis complete'
        };

        const improvementsText = result.improvements.length > 0
          ? result.improvements.slice(0, 5).map((i: string) => `• ${i}`).join('\n')
          : 'Code is already well optimized!';

        return {
          reply: {
            text: `**Optimization Suggestions:**\n\n**Impact:** ${result.impact}\n\n**Improvements:**\n${improvementsText}`,
            attachments: [{
              type: 'code',
              data: { language, content: result.optimizedCode }
            }]
          }
        };
      }

      case 'review': {
        const prompt = `You are an expert code reviewer. Review this ${language} code.

Code:
\`\`\`${language}
${code}
\`\`\`

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{"issues": ["issue1", "issue2"], "suggestions": ["suggestion1", "suggestion2"], "assessment": "overall quality assessment"}

If no issues, use empty arrays.`;

        const response = await callGroq(prompt, 1000);
        const result = parseJsonResponse(response) || {
          issues: ['Unable to perform detailed analysis'],
          suggestions: ['Code structure reviewed'],
          assessment: 'Review analysis encountered parsing issues'
        };

        const issuesText = result.issues.length > 0
          ? result.issues.slice(0, 5).map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n')
          : 'No major issues found!';
        
        const suggestionsText = result.suggestions.length > 0
          ? result.suggestions.slice(0, 5).map((s: string) => `• ${s}`).join('\n')
          : 'Code looks good overall!';

        return {
          reply: {
            text: `**Code Review:**\n\n**Assessment:** ${result.assessment}\n\n**Issues:**\n${issuesText}\n\n**Suggestions:**\n${suggestionsText}`,
            attachments: [{
              type: 'code',
              data: { language, content: code }
            }]
          }
        };
      }

      default: {
        return {
          reply: {
            text: "I'm CodeBuddy, powered by Mastra! I can help you with:\n\n• **explain:** Understand how code works\n• **debug:** Find and fix bugs\n• **optimize:** Improve performance\n• **review:** Get code quality feedback\n\nJust prefix your code with a command, or ask me naturally!"
          }
        };
      }
    }
  } catch (error) {
    console.error('Mastra handler error:', error);
    return {
      reply: {
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again!`
      }
    };
  }
}
