# Graph Report - C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\.opencode  (2026-05-14)

## Corpus Check
- 21 files · ~411,387 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 62 nodes · 62 edges · 19 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `renderStatusline()` - 6 edges
2. `main()` - 5 edges
3. `scanDirectory()` - 4 edges
4. `readGsdState()` - 3 edges
5. `formatGsdState()` - 3 edges
6. `scanForSecrets()` - 3 edges
7. `scanFile()` - 3 edges
8. `readGsdConfig()` - 2 edges
9. `getConfigValue()` - 2 edges
10. `readLastSlashCommand()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `ECCHooksPlugin()` --calls--> `initStore()`  [INFERRED]
  C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\.opencode\plugins\ecc-hooks.ts → C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\.opencode\plugins\lib\changed-files-store.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (6): addToTree(), buildTree(), initStore(), recordChange(), toRelative(), ECCHooksPlugin()

### Community 1 - "Community 1"
Cohesion: 0.36
Nodes (8): formatGsdState(), getConfigValue(), parseStateMd(), readGsdConfig(), readGsdState(), readLastSlashCommand(), renderProgressBar(), renderStatusline()

### Community 2 - "Community 2"
Cohesion: 0.6
Nodes (5): buildBannerOutput(), main(), readCache(), recordFailureWarning(), shouldSuppressFailureWarning()

### Community 3 - "Community 3"
Cohesion: 0.6
Nodes (4): scanCodeSecurity(), scanDirectory(), scanFile(), scanForSecrets()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 7`** (2 nodes): `gsd-check-update-worker.js`, `isNewer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `gsd-check-update.js`, `detectConfigDir()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `gsd-read-injection-scanner.js`, `isExcludedPath()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `check-coverage.ts`, `parseCoverageData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `git-summary.ts`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `gsd-context-monitor.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `gsd-prompt-guard.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `gsd-read-guard.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `gsd-workflow-guard.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._