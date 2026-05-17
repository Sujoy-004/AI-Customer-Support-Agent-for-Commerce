// scripts/generateEmbeddings.ts
// Run as prebuild hook: "prebuild": "npx tsx scripts/generateEmbeddings.ts"
import { pipeline } from '@huggingface/transformers';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EmbeddingConfig {
  [intentName: string]: { phrases: string[]; embeddings: number[][] };
}

async function generate(): Promise<void> {
  const configDir = resolve(__dirname, '../src/config/semantic');

  // Load reference phrase configs via dynamic import
  // On Windows, dynamic import() requires file:// URLs, not raw paths
  const catalogModule = await import(pathToFileURL(resolve(configDir, 'catalogIntents.ts')).href);
  const offTopicModule = await import(pathToFileURL(resolve(configDir, 'offTopicIntents.ts')).href);
  const orderModule = await import(pathToFileURL(resolve(configDir, 'orderIntents.ts')).href);

  const CATALOG_INTENT_PHRASES: Record<string, string[]> = catalogModule.CATALOG_INTENT_PHRASES;
  const ON_TOPIC_CLUSTERS: Record<string, string[]> = offTopicModule.ON_TOPIC_CLUSTERS;
  const ORDER_INTENT_PHRASES: Record<string, string[]> = orderModule.ORDER_INTENT_PHRASES;

  // Load the model
  console.log('[generateEmbeddings] Loading model...');
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { dtype: 'q8' },
  );

  async function computeEmbeddings(
    phrases: Record<string, string[]>,
  ): Promise<Record<string, { phrases: string[]; embeddings: number[][] }>> {
    const result: Record<string, { phrases: string[]; embeddings: number[][] }> = {};
    for (const [intentName, phraseList] of Object.entries(phrases)) {
      const embeddings: number[][] = [];
      for (const phrase of phraseList) {
        const tensor = await extractor(phrase, {
          pooling: 'mean',
          normalize: true,
        });
        // tolist() returns number[][]; [0] for single-input batch
        embeddings.push(tensor.tolist()[0]);
      }
      result[intentName] = { phrases: phraseList, embeddings };
    }
    return result;
  }

  // Build the output JSON matching D-19 format:
  // { intentName: { phrases: string[], embeddings: number[][] } }
  const result: EmbeddingConfig = {
    catalog: await computeEmbeddings(CATALOG_INTENT_PHRASES),
    offTopic: await computeEmbeddings(ON_TOPIC_CLUSTERS),
    order: await computeEmbeddings(ORDER_INTENT_PHRASES),
  };

  // Write embeddings.json
  const outputPath = resolve(configDir, 'embeddings.json');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[generateEmbeddings] Successfully wrote ${outputPath}`);
}

// D-16: Failure exits with code 1, failing the build
generate().catch((err) => {
  console.error('[generateEmbeddings] Failed:', err);
  process.exit(1);
});
