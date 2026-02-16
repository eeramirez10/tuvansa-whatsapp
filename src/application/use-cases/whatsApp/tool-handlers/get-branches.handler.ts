import { PrismaClient } from "@prisma/client";
import { ToolCallHandler, ToolCallContext } from "./tool-call-handler.interface";
import { BranchRepository } from '../../../../domain/repositories/branch.repository';

/**
 * Handler for the "get_branches" function call.
 * Retrieves all available branches from the database.
 * Returns array of branches with id, name, and address.
 */
export class GetBranchesHandler implements ToolCallHandler {

  constructor(
    private readonly branchRepository: BranchRepository
  ) { }

  canHandle(functionName: string): boolean {
    return functionName === 'get_branches';
  }

  async execute(context: ToolCallContext): Promise<any> {
    const { action } = context;

    console.log('[GetBranchesHandler] Fetching all branches');

    try {

      const branches = await this.branchRepository.getBranchs()

      return {
        tool_call_id: action.id,
        output: JSON.stringify(branches)
      };

    } catch (error) {
      console.error('[GetBranchesHandler] Error fetching branches:', error);

      // Return empty array on error for graceful handling
      return {
        tool_call_id: action.id,
        output: JSON.stringify([])
      };
    }
  }
}
