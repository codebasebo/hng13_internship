import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const codeBuddyStep = createStep({
	id: "codebuddy-step",
	description: "Handles messages and runs the CodeBuddy agent",
	inputSchema: z.object({
		message: z.string().describe("The user's message or code assistance request"),
	}),
	outputSchema: z.object({
		reply: z.string().describe("The agent's reply to the user"),
	}),
	execute: async ({ inputData, mastra }) => {
		console.log("🚀 Workflow triggered with input:", inputData);
		
		if (!inputData?.message) {
			console.error("❌ No user message received");
			throw new Error("No user message received");
		}

		console.log("✅ Message received:", inputData.message);

		const agent = mastra?.getAgent("codeBuddyAgent");
		if (!agent) {
			console.error("❌ CodeBuddy Agent not found");
			throw new Error("CodeBuddy Agent not found");
		}
		
		console.log("✅ Agent found, generating response...");

		const result = await agent.generate([
			{
				role: "user",
				content: inputData.message,
			},
		]);

		const reply = result?.text || "CodeBuddy is currently unavailable. Please try again in a moment.";
		console.log("✅ Response generated:", reply.substring(0, 100) + "...");

		return {
			reply,
		};
	},
});

export const codeBuddyWorkflow = createWorkflow({
	id: "codebuddy-workflow",
	description: "CodeBuddy Workflow — triggered by a Telex event.",
	inputSchema: z.object({
		message: z.string().describe("The user's input or code assistance command"),
	}),
	outputSchema: z.object({
		reply: z.string().describe("The agent's response"),
	}),
}).then(codeBuddyStep);

codeBuddyWorkflow.commit();
