import { pool } from '../../src/config/database.js';
import { embeddingProvider } from '../../src/modules/assistant/providers/embedding.provider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedRagKnowledge() {
  console.log('[Seed] Starting RAG knowledge seeding...');

  try {
    // 1. Run SQL seed if rag_documents is empty
    const checkCount = await pool.query(`
      SELECT count(*) as count FROM rag_documents;
    `);

    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('[Seed] rag_documents is empty. Inserting base knowledge records...');
      const sqlPath = path.join(__dirname, '002_rag_knowledge.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('[Seed] Base knowledge records inserted.');
    } else {
      console.log(`[Seed] rag_documents already contains ${checkCount.rows[0].count} documents.`);
    }

    // 2. Generate embeddings for rows missing embeddings if Gemini API key is available
    if (!embeddingProvider.isAvailable()) {
      console.log('[Seed] GEMINI_API_KEY not configured. Skipping vector generation (embeddings will remain null).');
      return;
    }

    const unpopulated = await pool.query(`
      SELECT id, title, content FROM rag_documents WHERE embedding IS NULL;
    `);

    if (unpopulated.rows.length === 0) {
      console.log('[Seed] All documents already have vector embeddings.');
      return;
    }

    console.log(`[Seed] Generating embeddings for ${unpopulated.rows.length} documents...`);

    for (const doc of unpopulated.rows) {
      try {
        const vector = await embeddingProvider.embedText(doc.content);
        const vectorStr = embeddingProvider.formatVectorForPg(vector);
        await pool.query(
          `UPDATE rag_documents SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          [vectorStr, doc.id]
        );
        console.log(`[Seed] Embedded: "${doc.title}"`);
      } catch (err: any) {
        console.warn(`[Seed] Failed to embed "${doc.title}":`, err.message);
      }
    }

    console.log('[Seed] Vector embedding generation complete.');
  } catch (err: any) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedRagKnowledge();
}
