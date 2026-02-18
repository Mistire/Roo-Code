import { HookEnginePlugin, PostToolUseParams } from "./HookEngine"
import { OrchestrationService } from "../services/orchestration/OrchestrationService"
import * as crypto from "crypto"

export class TraceRecordingPlugin implements HookEnginePlugin {
	name = "TraceRecording"

	async postToolUse(params: PostToolUseParams) {
		const { toolName, params: toolParams, result, task } = params

		if (!(task as any).activeIntentId) return

		const orchestrationService = new OrchestrationService(task.cwd)

		const traceRecord: any = {
			timestamp: new Date().toISOString(),
			intentId: (task as any).activeIntentId,
			taskId: task.taskId,
			toolName,
			params: toolParams,
			result: typeof result === "string" ? result.substring(0, 1000) : "Complex Result", // Avoid huge trace logs
		}

		// Spatial independence: calculate hash of written content
		if (toolName === "write_to_file" && toolParams.content) {
			traceRecord.contentHash = crypto.createHash("sha256").update(toolParams.content).digest("hex")
		} else if (toolName === "apply_diff" && toolParams.diff) {
			// For diffs, we hash the diff itself as a representation of the intent change
			traceRecord.contentHash = crypto.createHash("sha256").update(toolParams.diff).digest("hex")
		}

		await orchestrationService.recordTrace(traceRecord)
	}
}

export const traceRecordingPlugin = new TraceRecordingPlugin()
