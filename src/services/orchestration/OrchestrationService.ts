import * as path from "path"
import * as fs from "fs/promises"
import * as yaml from "yaml"

export interface Intent {
	id: string
	description: string
	scope: string[]
	constraints: string[]
	[key: string]: any
}

export class OrchestrationService {
	private orchestrationDir: string

	constructor(workspaceRoot: string) {
		this.orchestrationDir = path.join(workspaceRoot, ".orchestration")
	}

	async initialize() {
		try {
			await fs.mkdir(this.orchestrationDir, { recursive: true })
		} catch (error) {
			console.error("Failed to create .orchestration directory", error)
		}
	}

	async getIntent(intentId: string): Promise<Intent | undefined> {
		const intentsPath = path.join(this.orchestrationDir, "active_intents.yaml")
		try {
			const content = await fs.readFile(intentsPath, "utf-8")
			const data = yaml.parse(content) as { intents: Intent[] }
			return data.intents.find((i) => i.id === intentId)
		} catch (error) {
			console.warn(`Could not read intents from ${intentsPath}`, error)
			return undefined
		}
	}

	async recordTrace(trace: any) {
		const tracePath = path.join(this.orchestrationDir, "agent_trace.jsonl")
		try {
			await fs.appendFile(tracePath, JSON.stringify(trace) + "\n")
		} catch (error) {
			console.error(`Failed to record trace to ${tracePath}`, error)
		}
	}
}
