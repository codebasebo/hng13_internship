import { Mastra } from "@mastra/core/mastra";
import { Agent } from "@mastra/core";
import { config } from "dotenv";
import { codeBuddyWorkflow } from "../workflows/codebuddy.workflow.js";

config();

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export const codeBuddyAgent = new Agent({
  name: "codeBuddyAgent",
  instructions: "You are CodeBuddy, an expert AI code assistant. Help with code reviews, explanations, refactoring, and snippets.",
  model: {
    provider: "GROQ",
    name: DEFAULT_MODEL,
    toolChoice: "auto",
  } as any,
});

export const mastra = new Mastra({
  workflows: { codeBuddyWorkflow },
  agents: { codeBuddyAgent },
  telemetry: {
    enabled: false,
  },
});
