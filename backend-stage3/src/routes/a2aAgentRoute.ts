import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

interface A2ARequestBody {
	jsonrpc?: string;
	id?: string;
	method?: string;
	params?: {
		message?: any;
		messages?: any[];
		contextId?: string;
		taskId?: string;
		metadata?: Record<string, any>;
	};
}

export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
	method: "POST",
	handler: async (c) => {
		try {
			const mastra = c.get("mastra") as any;
			const agentId = c.req.param("agentId") as string;

			let body: A2ARequestBody = {};
			try {
				body = (await c.req.json()) as A2ARequestBody;
			} catch {
				// If no JSON or invalid body, default to empty
				body = {};
			}

			const { jsonrpc, id: requestId, params } = body || {};

			// If body is empty, still return 200 with minimal A2A response
			if (!jsonrpc && !requestId && !params) {
				return c.json(
					{
						jsonrpc: "2.0",
						id: null,
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
											text: "No input received — but the gods are listening.",
										},
									],
								},
							},
							artifacts: [],
							history: [],
						},
					},
					200
				);
			}

			// Validate JSON-RPC structure
			if (jsonrpc !== "2.0" || !requestId) {
				return c.json(
					{
						jsonrpc: "2.0",
						id: requestId || null,
						error: {
							code: -32600,
							message:
								'Invalid Request: "jsonrpc" must be "2.0" and "id" must be provided.',
						},
					},
					400
				);
			}

			// Check for valid agent
			const agent = mastra?.getAgent?.(agentId);
			if (!agent) {
				return c.json(
					{
						jsonrpc: "2.0",
						id: requestId,
						error: {
							code: -32602,
							message: `Agent '${agentId}' not found.`,
						},
					},
					404
				);
			}

			const { message, messages, contextId, taskId } = params || {};

			const messagesList = message
				? [message]
				: Array.isArray(messages)
					? messages
					: [];

			const mastraMessages = messagesList.map((msg: any) => ({
				role: msg.role,
				content:
					msg.parts
						?.map((part: any) => {
							if (part.kind === "text") return part.text;
							if (part.kind === "data") return JSON.stringify(part.data);
							return "";
						})
						.join("\n") || "",
			}));

			const result = await agent.generate(mastraMessages);
			const textResponse: string =
				(result && result.text) || "No response generated.";

			const artifacts = [
				{
					artifactId: randomUUID(),
					name: `${agentId}Response`,
					parts: [{ kind: "text", text: textResponse }],
				},
			];

			if (result?.toolResults?.length) {
				artifacts.push({
					artifactId: randomUUID(),
					name: "ToolResults",
					parts: result.toolResults.map((tool: any) => ({
						kind: "data",
						data: tool,
					})),
				});
			}

			const history = [
				...messagesList.map((msg: any) => ({
					kind: "message",
					role: msg.role,
					parts: msg.parts,
					messageId: msg.messageId || randomUUID(),
					taskId: msg.taskId || taskId || randomUUID(),
				})),
				{
					kind: "message",
					role: "agent",
					parts: [{ kind: "text", text: textResponse }],
					messageId: randomUUID(),
					taskId: taskId || randomUUID(),
				},
			];

			return c.json({
				jsonrpc: "2.0",
				id: requestId,
				result: {
					id: taskId || randomUUID(),
					contextId: contextId || randomUUID(),
					kind: "task",
					status: {
						state: "completed",
						timestamp: new Date().toISOString(),
						message: {
							kind: "message",
							role: "agent",
							messageId: randomUUID(),
							parts: [{ kind: "text", text: textResponse }],
						},
					},
					artifacts,
					history,
				},
			});
		} catch (error: any) {
			console.error("A2A route error:", error);
			return c.json(
				{
					jsonrpc: "2.0",
					id: null,
					error: {
						code: -32603,
						message: "Internal error",
						data: { details: error.message || "Unknown error" },
					},
				},
				500
			);
		}
	},
});
