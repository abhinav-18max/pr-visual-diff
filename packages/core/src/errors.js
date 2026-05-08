export class VisualDiffError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "VisualDiffError";
    this.code = options.code ?? "VISUAL_DIFF_ERROR";
    this.cause = options.cause;
  }
}
