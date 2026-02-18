import { HookEnginePlugin, PostToolUseParams } from "./HookEngine"
import { OrchestrationService } from "../services/orchestration/OrchestrationService"
import * as crypto from "crypto"
import { getGitRevision } from "../utils/git"
import { v7 as uuidv7 } from "uuid"
import { Task } from "../core/task/Task"

export class TraceRecordingPlugin implements HookEnginePlugin {
	name = "TraceRecording"

	async postToolUse(params: PostToolUseParams) {
		const { toolName, params: toolParams, result, task } = params

		if (!(task as any).activeIntentId) return

		const orchestrationService = (task as Task).orchestrationService
		const revisionId = await getGitRevision(task.cwd)

		const traceRecord: any = {
			id: uuidv7(),
			timestamp: new Date().toISOString(),
			intentId: (task as Task).activeIntentId,
			taskId: task.taskId,
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

		// Spatial independence: calculate hash of written content
		if (toolName === "write_to_file" && toolParams.path && toolParams.content) {
			traceRecord.files.push({
				path: toolParams.path,
				contentHash: crypto.createHash("sha256").update(toolParams.content).digest("hex"),
			})
		} else if (toolName === "apply_diff" && toolParams.path && toolParams.diff) {
			// For diffs, we hash the diff itself as a representation of the intent change
			traceRecord.files.push({
				path: toolParams.path,
				contentHash: crypto.createHash("sha256").update(toolParams.diff).digest("hex"),
			})
		}

		await orchestrationService.recordTrace(traceRecord)
	}
}

export const traceRecordingPlugin = new TraceRecordingPlugin()
