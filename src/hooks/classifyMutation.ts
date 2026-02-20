import { OrchestrationService } from "../services/orchestration/OrchestrationService"

/**
 * Semantic mutation classification.
 *
 * - AST_REFACTOR:      Syntax/structure change under an EXISTING intent for a file
 *                      that was previously modified under the same intent.
 *                      (Same intent, same file = restructuring existing work)
 *
 * - INTENT_EVOLUTION:  A NEW file is being touched for this intent, or the file
 *                      was previously owned by a different intent.
 *                      (New feature work or scope expansion)
 */
export type MutationClass = "AST_REFACTOR" | "INTENT_EVOLUTION"

/**
 * Classify a mutation as AST_REFACTOR or INTENT_EVOLUTION.
 *
 * Heuristic:
 *   - If the file has been previously modified under the SAME intent → AST_REFACTOR
 *   - If this is the first time this file is touched under this intent → INTENT_EVOLUTION
 */
export async function classifyMutation(
	intentId: string,
	filePath: string | undefined,
	orchestrationService: OrchestrationService,
): Promise<MutationClass> {
	if (!filePath) {
		return "INTENT_EVOLUTION"
	}

	try {
		const history = await orchestrationService.getTraceHistory(intentId, 100)

		// Check if any previous trace record for this intent touched this file
		const previouslyTouched = history.some((record) => record.files.some((f) => f.relative_path === filePath))

		return previouslyTouched ? "AST_REFACTOR" : "INTENT_EVOLUTION"
	} catch {
		// Default to INTENT_EVOLUTION if we can't determine history
		return "INTENT_EVOLUTION"
	}
}
