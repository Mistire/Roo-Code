import { HookEnginePlugin, PostToolUseParams } from "./HookEngine"
import { OrchestrationService, TraceRecord } from "../services/orchestration/OrchestrationService"
import * as crypto from "crypto"
import { getGitRevision } from "../utils/git"
import { v7 as uuidv7 } from "uuid"
import { Task } from "../core/task/Task"
import { classifyMutation } from "./classifyMutation"

export class TraceRecordingPlugin implements HookEnginePlugin {
	name = "TraceRecording"

	async postToolUse(params: PostToolUseParams) {
		const { toolName, params: toolParams, result, task } = params

		if (!(task as any).activeIntentId) return

		const orchestrationService = (task as Task).orchestrationService
		const revisionId = await getGitRevision(task.cwd)

		// Get the AI model identifier from the task's API
		let modelIdentifier = "unknown"
		try {
			const model = (task as any).api?.getModel?.()
			modelIdentifier = model?.id || model?.info?.id || "unknown"
		} catch {
			// Best-effort model identification
		}

		const intentId = (task as any).activeIntentId as string
		const taskId = task.taskId

		// Determine mutation class (AST_REFACTOR vs INTENT_EVOLUTION)
		const mutationClass = await classifyMutation(intentId, toolParams?.path, orchestrationService)

		// Build the spec-compliant trace record
		const traceRecord: TraceRecord = {
			id: uuidv7(),
			timestamp: new Date().toISOString(),
			intentId,
			taskId,
			mutation_class: mutationClass,
			tool: {
				name: toolName,
				params: toolParams,
				result: typeof result === "string" ? result.substring(0, 1000) : "Complex Result",
			},
			vcs: {
				revision_id: revisionId,
			},
			files: [],
		}

		// Build spec-compliant file entries with conversations, contributor, ranges, related
		if (toolName === "write_to_file" && toolParams.path && toolParams.content) {
			const contentHash = crypto.createHash("sha256").update(toolParams.content).digest("hex")
			const lineCount = toolParams.content.split("\n").length

			traceRecord.files.push({
				relative_path: toolParams.path,
				conversations: [
					{
						url: taskId, // Session log ID
						contributor: {
							entity_type: "AI",
							model_identifier: modelIdentifier,
						},
						ranges: [
							{
								start_line: 1,
								end_line: lineCount,
								content_hash: `sha256:${contentHash}`,
							},
						],
						related: [
							{
								type: "specification",
								value: intentId,
							},
						],
					},
				],
			})
		} else if (toolName === "apply_diff" && toolParams.path && toolParams.diff) {
			const diffHash = crypto.createHash("sha256").update(toolParams.diff).digest("hex")

			traceRecord.files.push({
				relative_path: toolParams.path,
				conversations: [
					{
						url: taskId,
						contributor: {
							entity_type: "AI",
							model_identifier: modelIdentifier,
						},
						ranges: [
							{
								content_hash: `sha256:${diffHash}`,
							},
						],
						related: [
							{
								type: "specification",
								value: intentId,
							},
						],
					},
				],
			})
		}

		await orchestrationService.recordTrace(traceRecord)
	}
}

export const traceRecordingPlugin = new TraceRecordingPlugin()
