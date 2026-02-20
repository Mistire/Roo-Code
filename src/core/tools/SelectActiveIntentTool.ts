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

			const intent = await task.orchestrationService.getIntent(intent_id)

			if (!intent) {
				pushToolResult(
					`Error: Intent '${intent_id}' not found in .orchestration/active_intents.yaml. Please ensure the intent is defined before selection.`,
				)
				return
			}

			// Store the active intent on the task (the Two-Stage Handshake)
			;(task as any).activeIntentId = intent_id
			;(task as any).activeIntentContext = intent

			// Load recent trace history for this intent (Gap 1.A fix)
			const traceHistory = await task.orchestrationService.getTraceHistory(intent_id, 5)

			// Build the <intent_context> XML block as required by the spec (Gap 1.B fix)
			const scope = intent.owned_scope || intent.scope || []
			const constraints = intent.constraints || []
			const acceptanceCriteria = intent.acceptance_criteria || []

			let contextXml = `<intent_context>
  <intent_id>${intent_id}</intent_id>
  <name>${intent.name || intent_id}</name>
  <description>${intent.description}</description>
  <status>${intent.status || "IN_PROGRESS"}</status>
  <authorized_scope>
${scope.map((s: string) => `    <pattern>${s}</pattern>`).join("\n")}
  </authorized_scope>
  <constraints>
${constraints.map((c: string) => `    <constraint>${c}</constraint>`).join("\n")}
  </constraints>
  <acceptance_criteria>
${acceptanceCriteria.map((ac: string) => `    <criterion>${ac}</criterion>`).join("\n")}
  </acceptance_criteria>`

			// Include recent trace history if available
			if (traceHistory.length > 0) {
				contextXml += `\n  <recent_trace_history count="${traceHistory.length}">`
				for (const trace of traceHistory) {
					const filesModified = trace.files.map((f) => f.relative_path).join(", ")
					contextXml += `\n    <trace timestamp="${trace.timestamp}" tool="${trace.tool.name}" mutation_class="${trace.mutation_class || "UNKNOWN"}" files="${filesModified}" />`
				}
				contextXml += `\n  </recent_trace_history>`
			} else {
				contextXml += `\n  <recent_trace_history count="0" />`
			}

			contextXml += `\n</intent_context>`

			pushToolResult(
				`Successfully selected active intent: ${intent_id}. Context loaded.\n\n${contextXml}\n\nYou may now proceed with the task within the defined scope and constraints. CRITICAL: You are authorized to modify ONLY files matching the authorized_scope patterns above.`,
			)
		} catch (error) {
			await handleError("selecting active intent", error as Error)
		}
	}
}

export const selectActiveIntentTool = new SelectActiveIntentTool()
