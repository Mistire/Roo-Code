import { HookEnginePlugin, PostToolUseParams } from "./HookEngine"
import { OrchestrationService } from "../services/orchestration/OrchestrationService"

export class TraceRecordingPlugin implements HookEnginePlugin {
	name = "TraceRecording"

	async postToolUse(params: PostToolUseParams) {
		const { toolName, params: toolParams, result, task } = params

		if (!(task as any).activeIntentId) return

		const orchestrationService = new OrchestrationService(task.cwd)

		const traceRecord = {
			timestamp: new Date().toISOString(),
			intentId: (task as any).activeIntentId,
			taskId: task.taskId,
			toolName,
			params: toolParams,
			result: typeof result === "string" ? result.substring(0, 1000) : "Complex Result", // Avoid huge trace logs
			// Spatial independence: we would add file hashes here
		}

		await orchestrationService.recordTrace(traceRecord)
	}
}

export const traceRecordingPlugin = new TraceRecordingPlugin()
