/**
 * 业务错误：message 是可以向用户展示的提示。
 */
export class BizError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BizError";
  }
}