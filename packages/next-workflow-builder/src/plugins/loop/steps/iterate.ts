/**
 * Executable step function for Loop action
 * Iterates over an array and executes downstream nodes for each item/batch
 * Similar to n8n's SplitInBatches node
 */
import "server-only";
import { StepInput, withStepLogging } from "../../../lib/steps/step-handler";

export type LoopInput = StepInput & {
  /** The array to iterate over */
  items: unknown[];
  /** Number of items per batch (default: 1) */
  batchSize?: number;
  /** Current batch index (set by executor) */
  currentBatchIndex?: number;
  /** Original items expression for logging */
  expression?: string;
};

export type LoopResult = {
  /** Whether there are more batches to process */
  hasMore: boolean;
  /** Current batch index (0-based) */
  currentBatchIndex: number;
  /** Current batch of items being processed */
  currentBatch: unknown[];
  /** Current item (first item of batch, for single-item iterations) */
  currentItem: unknown;
  /** Current item index in the full array */
  currentIndex: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of batches */
  totalBatches: number;
  /** All items in the array */
  items: unknown[];
  /** Batch size used */
  batchSize: number;
};

function evaluateLoop(input: LoopInput): LoopResult {
  const items = Array.isArray(input.items) ? input.items : [];
  const batchSize = Math.max(1, input.batchSize || 1);
  const currentBatchIndex = input.currentBatchIndex ?? 0;
  const totalItems = items.length;
  const totalBatches = Math.ceil(totalItems / batchSize);

  // Calculate current batch
  const startIndex = currentBatchIndex * batchSize;
  const endIndex = Math.min(startIndex + batchSize, totalItems);
  const currentBatch = items.slice(startIndex, endIndex);
  const currentItem = currentBatch[0];
  const hasMore = currentBatchIndex < totalBatches - 1;

  return {
    hasMore,
    currentBatchIndex,
    currentBatch,
    currentItem,
    currentIndex: startIndex,
    totalItems,
    totalBatches,
    items,
    batchSize,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function loopStep(input: LoopInput): Promise<LoopResult> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(evaluateLoop(input)));
}

loopStep.maxRetries = 0;
