/**
 * Line-level Text Diff Engine using Longest Common Subsequence (LCS)
 * Computes unified and side-by-side differences between document versions
 */

export interface UnifiedDiffLine {
  type: 'added' | 'removed' | 'unchanged';
  lineNumA?: number;
  lineNumB?: number;
  content: string;
}

export interface SideBySideDiffRow {
  id: string;
  left?: {
    lineNum: number;
    content: string;
    type: 'removed' | 'unchanged';
  };
  right?: {
    lineNum: number;
    content: string;
    type: 'added' | 'unchanged';
  };
}

export interface DiffResult {
  unified: UnifiedDiffLine[];
  sideBySide: SideBySideDiffRow[];
  additions: number;
  deletions: number;
  unchanged: number;
}

/**
 * Computes line-by-line diff between two text strings using dynamic programming LCS
 */
export function computeLineDiff(textA: string, textB: string): DiffResult {
  const linesA = textA.replace(/\r\n/g, '\n').split('\n');
  const linesB = textB.replace(/\r\n/g, '\n').split('\n');

  const m = linesA.length;
  const n = linesB.length;

  // Build LCS matrix (bounded to prevent huge memory spikes if extremely long)
  // For standard ADR docs (usually < 2000 lines), m * n matrix is very fast
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1) as unknown as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const rawDiff: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string; lineA?: number; lineB?: number }> = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      rawDiff.push({
        type: 'unchanged',
        text: linesA[i - 1],
        lineA: i,
        lineB: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: 'added',
        text: linesB[j - 1],
        lineB: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: 'removed',
        text: linesA[i - 1],
        lineA: i,
      });
      i--;
    }
  }

  rawDiff.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  const unified: UnifiedDiffLine[] = rawDiff.map((item) => {
    if (item.type === 'added') additions++;
    else if (item.type === 'removed') deletions++;
    else unchanged++;

    return {
      type: item.type,
      lineNumA: item.lineA,
      lineNumB: item.lineB,
      content: item.text,
    };
  });

  // Construct Side-by-side rows
  const sideBySide: SideBySideDiffRow[] = [];
  let ptr = 0;
  let rowIdx = 0;

  while (ptr < rawDiff.length) {
    const current = rawDiff[ptr];

    if (current.type === 'unchanged') {
      sideBySide.push({
        id: `row-${rowIdx++}`,
        left: { lineNum: current.lineA!, content: current.text, type: 'unchanged' },
        right: { lineNum: current.lineB!, content: current.text, type: 'unchanged' },
      });
      ptr++;
    } else if (current.type === 'removed') {
      // Gather contiguous removals and additions to pair them up
      const removedBlock: typeof rawDiff = [];
      while (ptr < rawDiff.length && rawDiff[ptr].type === 'removed') {
        removedBlock.push(rawDiff[ptr]);
        ptr++;
      }
      const addedBlock: typeof rawDiff = [];
      while (ptr < rawDiff.length && rawDiff[ptr].type === 'added') {
        addedBlock.push(rawDiff[ptr]);
        ptr++;
      }

      const maxLen = Math.max(removedBlock.length, addedBlock.length);
      for (let k = 0; k < maxLen; k++) {
        const rem = removedBlock[k];
        const add = addedBlock[k];

        sideBySide.push({
          id: `row-${rowIdx++}`,
          left: rem ? { lineNum: rem.lineA!, content: rem.text, type: 'removed' } : undefined,
          right: add ? { lineNum: add.lineB!, content: add.text, type: 'added' } : undefined,
        });
      }
    } else if (current.type === 'added') {
      // Standalone addition
      sideBySide.push({
        id: `row-${rowIdx++}`,
        left: undefined,
        right: { lineNum: current.lineB!, content: current.text, type: 'added' },
      });
      ptr++;
    }
  }

  return {
    unified,
    sideBySide,
    additions,
    deletions,
    unchanged,
  };
}
