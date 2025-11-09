import { A as Agent } from './agent.mjs';

// src/agent/index.warning.ts
var Agent2 = class extends Agent {
  constructor(config) {
    super(config);
    this.logger.warn('Please import Agent from "@mastra/core/agent" instead of "@mastra/core"');
  }
};

export { Agent2 as Agent };
