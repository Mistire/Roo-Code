import { Task } from "../task/Task"
import { BaseTool, ToolCallbacks } from "./BaseTool"
import { SelectActiveIntentParams } from "@roo-code/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

export class SelectActiveIntentTool extends BaseTool<"select_active_intent"> {
	readonly name = "select_active_intent" as const

	async execute(params: SelectActiveIntentParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
		const { intent_id } = params
		const { pushToolResult, handleError } = callbacks

		try {
			if (!intent_id) {
				pushToolResult("Error: intent_id is required.")
				return
			}

			// In a real implementation, we would use the OrchestrationService
			// which should be initialized on the Task.
			// For now, we'll store it on the task instance or a shared context.

			// Assume OrchestrationService is available or can be instantiated
			const orchestrationService = new OrchestrationService(task.cwd)
			const intent = await orchestrationService.getIntent(intent_id)

			if (!intent) {
				pushToolResult(
					`Error: Intent '${intent_id}' not found in .orchestration/active_intents.yaml. Please ensure the intent is defined before selection.`,
				)
				return
			}

			// Store the active intent on the task (we'll need to extend Task type or use a dynamic property)
			;(task as any).activeIntentId = intent_id
			;(task as any).activeIntentContext = intent

			pushToolResult(
				`Successfully selected active intent: ${intent_id}. Context loaded. You may now proceed with the task within the defined scope and constraints.`,
			)
		} catch (error) {
			await handleError("selecting active intent", error as Error)
		}
	}
}

export const selectActiveIntentTool = new SelectActiveIntentTool()
