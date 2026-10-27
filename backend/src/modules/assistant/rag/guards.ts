export class SecurityGuards {
  private static readonly INJECTION_PATTERNS = [
    /ignore (all )?(previous|prior) instructions/gi,
    /disregard (all )?(previous|prior) instructions/gi,
    /system (prompt|instructions|directive)/gi,
    /you are now (an?|in) /gi,
    /<\/?evidence>/gi,
    /<\/?user_query>/gi,
    /<\/?system>/gi,
  ];

  /**
   * Sanitizes user input to prevent prompt injection and tag breakout.
   */
  public static sanitizeQuery(query: string): string {
    let sanitized = query.trim();

    // Replace known injection sequences with safe placeholders
    for (const pattern of this.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[filtered]');
    }

    // Escape raw XML/HTML tags
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return sanitized;
  }

  /**
   * Validates and cleans up the generated answer text.
   */
  public static validateAnswer(answer: string): string {
    if (!answer || !answer.trim()) {
      return 'No specific travel information could be found for your request.';
    }

    let cleaned = answer.trim();

    // Remove any leftover tag artifacts
    cleaned = cleaned.replace(/<\/?EVIDENCE>/gi, '');
    cleaned = cleaned.replace(/<\/?USER_QUERY>/gi, '');

    return cleaned;
  }
}
