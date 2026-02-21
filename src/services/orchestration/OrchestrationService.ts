import * as path from "path"
import * as fs from "fs/promises"
import * as yaml from "yaml"

export interface Intent {
	id: string
	name: string
	description: string
	status: "DRAFT" | "IN_PROGRESS" | "COMPLETE" | "BLOCKED"
	owned_scope: string[]
	/** @deprecated Use owned_scope instead */
	scope?: string[]
	constraints: string[]
	acceptance_criteria: string[]
	[key: string]: any
}

export interface TraceRecord {
	id: string
	timestamp: string
	intentId: string
	taskId: string
	mutation_class?: "AST_REFACTOR" | "INTENT_EVOLUTION"
	tool: {
		name: string
		params: any
		result: string
	}
	vcs: {
		revision_id: string | undefined
	}
	files: Array<{
		relative_path: string
		conversations: Array<{
			url: string
			contributor: {
				entity_type: "AI" | "HUMAN"
				model_identifier: string
			}
			ranges: Array<{
				start_line?: number
				end_line?: number
				content_hash: string
			}>
			related: Array<{
				type: "specification"
				value: string
			}>
		}>
	}>
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
			const data = yaml.parse(content) as { active_intents: Intent[] }
			const intent = data.active_intents.find((i) => i.id === intentId)
			if (intent) {
				// Normalize: support both 'owned_scope' (spec) and 'scope' (legacy)
				if (!intent.owned_scope && intent.scope) {
					intent.owned_scope = intent.scope
				}
				if (!intent.scope && intent.owned_scope) {
					intent.scope = intent.owned_scope
				}
			}
			return intent
		} catch (error) {
			console.warn(`Could not read intents from ${intentsPath}`, error)
			return undefined
		}
	}

	/**
	 * Get recent trace history for a given intent ID.
	 * Reads agent_trace.jsonl and returns the last N records matching the intent.
	 */
	async getTraceHistory(intentId: string, limit: number = 10): Promise<TraceRecord[]> {
		const tracePath = path.join(this.orchestrationDir, "agent_trace.jsonl")
		try {
			const content = await fs.readFile(tracePath, "utf-8")
			const lines = content
				.trim()
				.split("\n")
				.filter((line) => line.length > 0)
			const records: TraceRecord[] = []
			for (const line of lines) {
				try {
					const record = JSON.parse(line) as TraceRecord
					if (record.intentId === intentId) {
						records.push(record)
					}
				} catch {
					// Skip malformed lines
				}
			}
			// Return the most recent N records
			return records.slice(-limit)
		} catch {
			// File doesn't exist yet — no history
			return []
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
