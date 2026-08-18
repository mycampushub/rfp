import { PrismaClient } from "@prisma/client"

// Self-contained transaction client type — no cross-file db dependency
export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use" | "$applyPendingMigrations"
>

/**
 * Calculate and persist a consensus score for a given submission + criterion.
 *
 * Algorithm (fixed in a prior sprint — do NOT modify logic):
 * 1. Fetch all individual scores for the submission/criterion pair.
 * 2. Compute mean, standard deviation, and agreement level (0-1) scaled
 *    against the criterion's scale range so that perfect agreement = 1.
 * 3. Count how many scores fall outside 1σ from the mean.
 * 4. Upsert a ConsensusScore record with the computed values.
 */
export async function calculateConsensus(
  tx: TransactionClient,
  submissionId: string,
  criterionId: string,
) {
  // Get all scores for this submission and criterion
  const scores = (await tx.score.findMany({
    where: {
      submissionId,
      criterionId,
    },
    include: {
      evaluator: true,
      criterion: true,
    },
    take: 500,
  })) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

  if (scores.length === 0) {
    return // No scores to calculate consensus
  }

  // Calculate mean score
  const mean = scores.reduce((sum, score) => sum + score.scoreValue, 0) / scores.length

  // Calculate standard deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score.scoreValue - mean, 2), 0) / scores.length
  const standardDeviation = Math.sqrt(variance)

  // Determine scale range from the criterion
  const criterion = scores[0]?.criterion
  const scaleMin = criterion?.scaleMin ?? 1
  const scaleMax = criterion?.scaleMax ?? 5
  // Max possible std dev is half the range (scores split at extremes)
  const maxPossibleStdDev = (scaleMax - scaleMin) / 2

  // Agreement level: 100% when all evaluators agree perfectly, decreasing with disagreement
  // If only 1 evaluator, agreement is 100%
  const agreementLevel = maxPossibleStdDev > 0
    ? Math.max(0, Math.min(1, 1 - (standardDeviation / maxPossibleStdDev)))
    : 1

  // Count disagreements (scores more than 1 std dev from mean)
  const disagreements = scores.length > 1
    ? scores.filter(score => Math.abs(score.scoreValue - mean) > standardDeviation).length
    : 0

  const consensusNotes = `Consensus based on ${scores.length} evaluator(s). Mean: ${mean.toFixed(2)}, Std Dev: ${standardDeviation.toFixed(2)}, Agreement: ${(agreementLevel * 100).toFixed(0)}%`
    + (disagreements > 0 ? `. ${disagreements} score(s) outside 1σ from mean.` : '')

  // Update or create consensus score
  const existingConsensus = await tx.consensusScore.findFirst({
    where: {
      submissionId,
      criterionId,
    },
  })

  if (existingConsensus) {
    await tx.consensusScore.update({
      where: { id: existingConsensus.id },
      data: {
        scoreValue: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        agreementLevel: Math.round(agreementLevel * 100) / 100,
        notes: consensusNotes,
      },
    })
  } else {
    await tx.consensusScore.create({
      data: {
        submissionId,
        criterionId,
        scoreValue: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        agreementLevel: Math.round(agreementLevel * 100) / 100,
        notes: consensusNotes,
      },
    })
  }
}
