import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/**
 * CodeBuddy Step - Handles code assistance requests
 */
const codeBuddyStep = createStep({
  id: "codebuddy-step",
  description: "Handles code review, explanation, refactoring, and snippet generation requests",
  inputSchema: z.object({
    message: z.string().describe("The user's message or code assistance request"),
    userId: z.string().optional().describe("The user's ID"),
    channelId: z.string().optional().describe("The channel ID"),
  }),
  outputSchema: z.object({
    reply: z.string().describe("The agent's response to the user"),
    attachments: z.array(z.object({
      type: z.string(),
      data: z.any(),
    })).optional().describe("Optional code attachments"),
  }),
  execute: async ({ inputData, mastra }) => {
    console.log("🚀 Workflow triggered with input:", inputData);

    if (!inputData?.message) {
      throw new Error("No user message received");
    }

    // Get the CodeBuddy agent from Mastra
    const agent = mastra?.getAgent("codeBuddyAgent");
    if (!agent) {
      throw new Error("CodeBuddy Agent not found");
    }

    // Generate response using the agent
    const result = await agent.generate([
      {
        role: "user",
        content: inputData.message,
      },
    ]);

    console.log("✅ Agent response generated");

    return {
      reply: result?.text || "CodeBuddy is currently unavailable. Please try again in a moment.",
      attachments: [],
    };
  },
});

/**
 * CodeBuddy Workflow - Triggered by Telex messages
 */
export const codeBuddyWorkflow = createWorkflow({
  id: "telex_codebuddy_agent",
  description: "TelexCodeBuddy - AI code assistant for reviews, explanations, refactoring, and snippets",
  inputSchema: z.object({
    message: z.string().describe("The user's input or code assistance command"),
    userId: z.string().optional(),
    channelId: z.string().optional(),
  }),
  outputSchema: z.object({
    reply: z.string().describe("The agent's response"),
    attachments: z.array(z.object({
      type: z.string(),
      data: z.any(),
    })).optional(),
  }),
}).then(codeBuddyStep);

// Commit the workflow to make it available
codeBuddyWorkflow.commit();
