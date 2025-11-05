import { A2ARequest, A2AResponse } from '../types.js';
import { 
  performCodeReview, 
  explainCode, 
  refactorCode, 
  generateCodeSnippet, 
  chatWithGroq 
} from '../services/groq.js';

/**
 * Very small intent classifier.
 * In production, replace with an LLM call or a rule+ML pipeline.
 */
export function classifyIntent(text: string) {
  const t = text.toLowerCase();
  if (t.startsWith('review') || t.includes('code review')) return 'code_review';
  if (t.startsWith('explain') || t.includes('explain ')) return 'explain';
  if (t.startsWith('refactor') || t.includes('refactor')) return 'refactor';
  if (t.startsWith('snippet') || t.includes('snippet')) return 'snippet';
  return 'small_talk';
}

export async function handleIntent(intent: string, text: string, payload: A2ARequest): Promise<A2AResponse> {
  switch (intent) {
    case 'code_review':
      return handleCodeReview(text, payload);
    case 'explain':
      return handleExplain(text);
    case 'refactor':
      return handleRefactor(text);
    case 'snippet':
      return handleSnippetRequest(text);
    default:
      return handleSmallTalk(text);
  }
}

async function handleCodeReview(text: string, payload: A2ARequest): Promise<A2AResponse> {
  try {
    // Extract the code block (triple backticks) or everything after 'review'
    const code = extractCode(text) || text.replace(/^review[:\s]*/i, '');
    
    if (!code || code.length < 10) {
      return {
        reply: { text: "Please provide some code to review. You can paste it directly or wrap it in triple backticks (```)." }
      };
    }

    const language = detectLanguage(code);
    const review = await performCodeReview(code, language);
    
    const issuesText = review.issues.length > 0 
      ? review.issues.slice(0, 5).map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : 'No major issues found!';
    
    const suggestionsText = review.suggestions.length > 0
      ? review.suggestions.slice(0, 3).map((suggestion, i) => `• ${suggestion}`).join('\n')
      : 'Code looks good overall!';

    return {
      reply: {
        text: `**Code Review Results:**\n\n**Summary:** ${review.summary}\n\n**Issues Found:**\n${issuesText}\n\n**Suggestions:**\n${suggestionsText}`,
        attachments: [
          { type: 'code', data: { language, content: code } }
        ]
      },
      actions: [
        { type: 'button', label: 'Get Refactor Suggestions', payload: { mode: 'refactor', code } }
      ]
    };
  } catch (error) {
    console.error('Code review error:', error);
    return {
      reply: { text: `Sorry, I couldn't complete the code review: ${error instanceof Error ? error.message : 'Unknown error'}` }
    };
  }
}

async function handleExplain(text: string): Promise<A2AResponse> {
  try {
    const topic = text.replace(/^explain[:\s]*/i, '');
    const code = extractCode(topic) || topic;
    
    if (!code || code.length < 5) {
      return {
        reply: { text: "Please provide some code to explain, or ask a specific programming question." }
      };
    }

    // Check if it looks like code or a general question
    const looksLikeCode = code.includes('(') || code.includes('{') || code.includes('function') || code.includes('def ') || code.includes('class ');
    
    if (looksLikeCode) {
      const language = detectLanguage(code);
      const explanation = await explainCode(code, language);
      
      const detailsText = explanation.details.slice(0, 5).map((detail, i) => `${i + 1}. ${detail}`).join('\n');
      
      return {
        reply: {
          text: `**Code Explanation** (${explanation.complexity} complexity):\n\n**Summary:** ${explanation.summary}\n\n**Details:**\n${detailsText}`,
          attachments: [
            { type: 'code', data: { language, content: code } }
          ]
        }
      };
    } else {
      // Handle as a general programming question
      const response = await chatWithGroq(`Please explain this programming concept or question: ${topic}`);
      return {
        reply: { text: response }
      };
    }
  } catch (error) {
    console.error('Explain error:', error);
    return {
      reply: { text: `Sorry, I couldn't provide an explanation: ${error instanceof Error ? error.message : 'Unknown error'}` }
    };
  }
}

async function handleRefactor(text: string): Promise<A2AResponse> {
  try {
    const code = extractCode(text) || text.replace(/^refactor[:\s]*/i, '');
    
    if (!code || code.length < 10) {
      return {
        reply: { text: "Please provide some code to refactor. You can paste it directly or wrap it in triple backticks (```)." }
      };
    }

    const language = detectLanguage(code);
    const refactorResult = await refactorCode(code, language);
    
    const improvementsText = refactorResult.improvements
      .slice(0, 4)
      .map((improvement, i) => `${i + 1}. ${improvement}`)
      .join('\n');

    return {
      reply: {
        text: `**Refactoring Suggestions:**\n\n**Improvements Made:**\n${improvementsText}\n\n**Reasoning:** ${refactorResult.reasoning}\n\n**Refactored Code:**\n\`\`\`${language}\n${refactorResult.refactoredCode}\n\`\`\``,
        attachments: [
          { type: 'code', data: { language, content: refactorResult.originalCode, title: 'Original Code' } },
          { type: 'code', data: { language, content: refactorResult.refactoredCode, title: 'Refactored Code' } }
        ]
      }
    };
  } catch (error) {
    console.error('Refactor error:', error);
    return {
      reply: { text: `Sorry, I couldn't refactor the code: ${error instanceof Error ? error.message : 'Unknown error'}` }
    };
  }
}

async function handleSnippetRequest(text: string): Promise<A2AResponse> {
  try {
    const query = text.replace(/^snippet[:\s]*/i, '') || 'hello world example';
    
    // Try to detect the language from the query
    const language = detectLanguageFromQuery(query);
    
    const snippet = await generateCodeSnippet(query, language);
    
    return {
      reply: {
        text: `**Code Snippet for:** ${query}\n\n\`\`\`${language}\n${snippet}\n\`\`\``,
        attachments: [
          { type: 'code', data: { language, content: snippet } }
        ]
      }
    };
  } catch (error) {
    console.error('Snippet generation error:', error);
    return {
      reply: { text: `Sorry, I couldn't generate a code snippet: ${error instanceof Error ? error.message : 'Unknown error'}` }
    };
  }
}

// --- Helpers (mock implementations) ---
function extractCode(text: string) {
  const m = text.match(/```(?:[\w-]+)?\n([\s\S]*?)\n```/m);
  if (m) return m[1];
  // fallback: return after colon
  const parts = text.split(':');
  if (parts.length>1) return parts.slice(1).join(':').trim();
  return null;
}

function lintMock(code?: string) {
  if (!code) return ['No code provided'];
  // very basic heuristics
  const issues = [];
  if (code.includes('==') && !code.includes('===')) issues.push('Use === instead of == for strict equality.');
  if (code.includes('var ')) issues.push('Use let/const instead of var.');
  if (code.split('\n').length > 120) issues.push('Consider splitting large files into modules.');
  if (code.includes('TODO')) issues.push('Found TODO comments — address them.');
  if (!issues.length) issues.push('No obvious issues found. Consider adding tests and types.');
  return issues;
}

function detectLanguage(code?: string) {
  if (!code) return 'text';
  if (code.includes('function') || code.includes('console.log')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  return 'text';
}

function getMockSnippet(query: string) {
  if (query.includes('node')) return { lang: 'js', code: 'console.log("hello world");' };
  if (query.includes('express')) return { lang: 'js', code: "import express from 'express';\nconst app=express();" };
  return { lang: 'txt', code: "// example snippet\n" };
}

/**
 * Handle small talk and general questions using Groq
 */
async function handleSmallTalk(text: string): Promise<A2AResponse> {
  try {
    const response = await chatWithGroq(text);
    return { 
      reply: { 
        text: response 
      } 
    };
  } catch (error) {
    console.error('Small talk error:', error);
    return { 
      reply: { 
        text: "I'm TelexCodeBuddy — I can help you with: `review` (code review), `explain` (code explanation), `refactor` (code improvement), or `snippet` (code generation). Try: `review: <paste your code>`" 
      } 
    };
  }
}

/**
 * Detect programming language from user query
 */
function detectLanguageFromQuery(query: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('javascript') || q.includes('js') || q.includes('node') || q.includes('react') || q.includes('express')) return 'javascript';
  if (q.includes('typescript') || q.includes('ts')) return 'typescript';
  if (q.includes('python') || q.includes('django') || q.includes('flask') || q.includes('pandas')) return 'python';
  if (q.includes('java') && !q.includes('javascript')) return 'java';
  if (q.includes('c++') || q.includes('cpp')) return 'cpp';
  if (q.includes('c#') || q.includes('csharp')) return 'csharp';
  if (q.includes('go') || q.includes('golang')) return 'go';
  if (q.includes('rust')) return 'rust';
  if (q.includes('php')) return 'php';
  if (q.includes('ruby')) return 'ruby';
  if (q.includes('swift')) return 'swift';
  if (q.includes('kotlin')) return 'kotlin';
  if (q.includes('sql') || q.includes('database')) return 'sql';
  if (q.includes('html')) return 'html';
  if (q.includes('css')) return 'css';
  if (q.includes('bash') || q.includes('shell') || q.includes('script')) return 'bash';
  
  return 'javascript'; // default
}
