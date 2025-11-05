import Groq from 'groq-sdk';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Groq AI Service
 * Handles all interactions with the Groq API for code analysis and generation
 */

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set. Please add it to your environment before using the Groq service.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function parseJsonResponse<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const withoutFence = trimmed.startsWith('```')
    ? trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim()
    : trimmed;

  try {
    return JSON.parse(withoutFence) as T;
  } catch {
    return null;
  }
}

export interface CodeReviewResult {
  issues: string[];
  suggestions: string[];
  summary: string;
}

export interface CodeExplanation {
  summary: string;
  details: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface RefactorSuggestion {
  originalCode: string;
  refactoredCode: string;
  improvements: string[];
  reasoning: string;
}

/**
 * Perform code review using Groq
 */
export async function performCodeReview(code: string, language: string = 'auto'): Promise<CodeReviewResult> {
  try {
    const prompt = `You are an expert code reviewer. Please analyze the following ${language} code and provide:
1. A list of issues (bugs, security problems, performance issues)
2. Improvement suggestions
3. A brief summary

Code:
\`\`\`${language}
${code}
\`\`\`

Please respond in JSON format with this structure:
{
  "issues": ["issue1", "issue2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "summary": "brief summary of the code quality"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.1,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    const parsed = parseJsonResponse<CodeReviewResult>(response);
    if (parsed) {
      return {
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        summary: parsed.summary || 'Code analysis completed'
      };
    }

    // If JSON parsing fails, create a structured response from the text
    const summary = response.split('\n').slice(0, 3).join(' ').trim();
    return {
      issues: ['Unable to parse detailed analysis'],
      suggestions: ['Review the code manually for best practices'],
      summary: summary || 'Code analysis completed'
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Code review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Explain code using Groq
 */
export async function explainCode(code: string, language: string = 'auto'): Promise<CodeExplanation> {
  try {
    const prompt = `You are a programming tutor. Explain the following ${language} code in detail:

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. A brief summary of what the code does
2. Line-by-line or section-by-section explanation
3. Assess the complexity level (low/medium/high)

Respond in JSON format:
{
  "summary": "what the code does",
  "details": ["explanation of part 1", "explanation of part 2", ...],
  "complexity": "low|medium|high"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.2,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    const parsed = parseJsonResponse<CodeExplanation>(response);
    if (parsed) {
      return {
        summary: parsed.summary || 'Code explanation',
        details: parsed.details || ['Unable to provide detailed explanation'],
        complexity: parsed.complexity || 'medium'
      };
    }

    return {
      summary: 'Code explanation',
      details: [response.substring(0, 500).trim() + '...'],
      complexity: 'medium'
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Code explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refactor code using Groq
 */
export async function refactorCode(code: string, language: string = 'auto'): Promise<RefactorSuggestion> {
  try {
    const prompt = `You are an expert developer. Please refactor the following ${language} code to improve:
- Readability
- Performance
- Best practices
- Code structure

Original code:
\`\`\`${language}
${code}
\`\`\`

Provide the refactored version and explain the improvements. Respond in JSON format:
{
  "originalCode": "original code",
  "refactoredCode": "improved code",
  "improvements": ["improvement 1", "improvement 2", ...],
  "reasoning": "explanation of changes made"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    const parsed = parseJsonResponse<RefactorSuggestion>(response);
    if (parsed) {
      return {
        originalCode: parsed.originalCode || code,
        refactoredCode: parsed.refactoredCode || code,
        improvements: parsed.improvements || ['Refactoring suggestions not available'],
        reasoning: parsed.reasoning || 'Unable to provide detailed reasoning'
      };
    }

    return {
      originalCode: code,
      refactoredCode: code,
      improvements: ['Refactoring analysis completed'],
      reasoning: response.substring(0, 300).trim() + '...'
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Code refactoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate code snippet using Groq
 */
export async function generateCodeSnippet(description: string, language: string = 'javascript'): Promise<string> {
  try {
    const prompt = `Generate a ${language} code snippet for: ${description}
    
Please provide clean, well-commented code that demonstrates the requested functionality. 
Only return the code, no additional explanation.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.4,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    return response.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * General chat/question answering using Groq
 */
export async function chatWithGroq(message: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are TelexCodeBuddy, a helpful coding assistant. Provide concise, practical advice about programming and software development."
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.6,
      max_tokens: 600,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    return response.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}