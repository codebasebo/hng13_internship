import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { a2aAgentRoute } from "../routes/a2aAgentRoute";
import { codeBuddyAgent } from "../agent/handler";
import { codeBuddyWorkflow } from "../workflows/codebuddy.workflow";

export const mastra = new Mastra({
	workflows: { codeBuddyWorkflow },
	agents: { codeBuddyAgent },
	storage: new LibSQLStore({
		url: ":memory:",
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	telemetry: {
		enabled: false,
	},
	observability: {
		default: { enabled: true },
	},
	server: {
		build: {
			openAPIDocs: true,
			swaggerUI: true,
		},
		apiRoutes: [a2aAgentRoute],
	},
});
