import { pool } from '../../../config/database.js';
import { SupportedLanguage } from '../dto/assistant-query.dto.js';

export interface ChatTurn {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export class MemoryService {
  /**
   * Retrieves conversation history for a user's single persistent session,
   * ordered from oldest to newest within the limit.
   */
  public async getRecentHistory(userId: string, limit: number = 8): Promise<ChatTurn[]> {
    if (!userId || !userId.trim()) {
      return [];
    }

    try {
      const sql = `
        SELECT id, role, content, created_at
        FROM (
          SELECT id, role, content, created_at
          FROM assistant_messages
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        ) sub
        ORDER BY created_at ASC;
      `;
      const res = await pool.query(sql, [userId.trim(), limit]);
      return res.rows.map((r) => ({
        id: String(r.id),
        role: r.role as 'user' | 'assistant',
        content: r.content,
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch (err: any) {
      console.warn('[MemoryService] getRecentHistory error:', err.message);
      return [];
    }
  }

  /**
   * Appends a message to the user's persistent session history.
   */
  public async recordMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    language?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!userId || !userId.trim() || !content || !content.trim()) {
      return;
    }

    try {
      const sql = `
        INSERT INTO assistant_messages (user_id, role, content, language, metadata)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await pool.query(sql, [
        userId.trim(),
        role,
        content.trim(),
        language || null,
        JSON.stringify(metadata),
      ]);
    } catch (err: any) {
      console.warn('[MemoryService] recordMessage error:', err.message);
    }
  }

  /**
   * Erases all conversation memory for the user (resets their single session to fresh state).
   */
  public async clearMemory(userId: string): Promise<number> {
    if (!userId || !userId.trim()) {
      return 0;
    }

    try {
      const sql = `DELETE FROM assistant_messages WHERE user_id = $1;`;
      const res = await pool.query(sql, [userId.trim()]);
      return res.rowCount || 0;
    } catch (err: any) {
      console.warn('[MemoryService] clearMemory error:', err.message);
      return 0;
    }
  }

  /**
   * Detects whether the query is a request to clear or erase conversation memory.
   * Supports English, Amharic, and Afaan Oromo.
   */
  public isClearMemoryIntent(query: string): boolean {
    if (!query) return false;
    const lower = query.toLowerCase().trim();

    // English patterns
    const enMatch =
      /erase\s+(your\s+|my\s+|our\s+)?(memory|history|conversation|chat)/i.test(lower) ||
      /clear\s+(your\s+|my\s+|our\s+)?(memory|history|conversation|chat)/i.test(lower) ||
      /forget\s+(everything|what\s+i\s+(said|asked)|all|past)/i.test(lower) ||
      /reset\s+(your\s+|my\s+|our\s+)?(memory|history|conversation|session|chat)/i.test(lower) ||
      /delete\s+(your\s+|my\s+|our\s+)?(memory|history|chat)/i.test(lower);

    // Amharic patterns
    const amMatch =
      /ትዝታ.*አጥፋ/.test(query) ||
      /ማስታወሻ.*አጥፋ/.test(query) ||
      /ታሪኬን.*አጥፋ/.test(query) ||
      /ሁሉንም.*እርሳ/.test(query) ||
      /ሁሉንም.*ሰርዝ/.test(query) ||
      /አዲስ.*ጀምር/.test(query);

    // Afaan Oromo patterns
    const omMatch =
      /yaadannoo.*haqi/i.test(lower) ||
      /irraanfadhu/i.test(lower) ||
      /haaraa.*jalqabi/i.test(lower);

    return enMatch || amMatch || omMatch;
  }

  /**
   * Formats a localized memory wipe confirmation message.
   */
  public getMemoryClearedConfirmation(language: SupportedLanguage = 'en'): string {
    switch (language) {
      case 'am':
        return 'ማስታወሻዬን ሙሉ በሙሉ አጥፍቻለሁ። አዲስ ውይይት ጀምረናል። ዛሬ ስለ አዲስ አበባ ጉዞዎ በምን ልርዳዎት?';
      case 'om':
        return "Yaadannoo koo guutummaatti haqeera. Haaraa jalqabneerra. Waa'ee imala Finfinnee keessanii akkamitti sin gargaaru?";
      case 'en':
      default:
        return 'I have completely cleared my memory. We are starting fresh! How can I assist you with your travels in Addis Ababa today?';
    }
  }
}

export const memoryService = new MemoryService();
