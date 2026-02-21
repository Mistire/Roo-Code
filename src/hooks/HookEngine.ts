import { ToolName } from "@roo-code/types"
import { Task } from "../core/task/Task"
import { traceRecordingPlugin } from "./TraceRecordingPlugin"
import { optimisticLockingPlugin } from "./OptimisticLockingPlugin"

export interface HookContext {
	intentId?: string
	[key: string]: any
}

export interface PreToolUseParams {
	toolName: ToolName
	params: any
	task: Task
}

export interface PostToolUseParams {
	toolName: ToolName
	params: any
	result: any
	task: Task
}

export interface HookEnginePlugin {
	name: string
	preToolUse?(params: PreToolUseParams): Promise<void>
	postToolUse?(params: PostToolUseParams): Promise<void>
}

export class HookEngine {
	private plugins: HookEnginePlugin[] = []

	register(plugin: HookEnginePlugin) {
		this.plugins.push(plugin)
	}

	async triggerPreToolUse(params: PreToolUseParams) {
		for (const plugin of this.plugins) {
			if (plugin.preToolUse) {
				await plugin.preToolUse(params)
			}
		}
	}

	async triggerPostToolUse(params: PostToolUseParams) {
		for (const plugin of this.plugins) {
			if (plugin.postToolUse) {
				await plugin.postToolUse(params)
			}
		}
	}
}

export const hookEngine = new HookEngine()
hookEngine.register(traceRecordingPlugin)
hookEngine.register(optimisticLockingPlugin)
