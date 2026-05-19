export type SendEmailInput = {
  to: string;
  from: string;
  subject: string;
  body: string;
  reply_to?: string;
  headers?: Record<string, string>;
};

export function validateSendEmailInput(input: unknown): asserts input is SendEmailInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('SendEmailInput must be an object');
  }
  const o = input as Record<string, unknown>;
  for (const f of ['to', 'from', 'subject', 'body'] as const) {
    if (typeof o[f] !== 'string' || (o[f] as string).length === 0) {
      throw new Error(`SendEmailInput.${f} is required and must be a non-empty string`);
    }
  }
  if (o.reply_to !== undefined && typeof o.reply_to !== 'string') {
    throw new Error('SendEmailInput.reply_to must be a string when provided');
  }
  if (o.headers !== undefined) {
    if (typeof o.headers !== 'object' || o.headers === null) {
      throw new Error('SendEmailInput.headers must be an object when provided');
    }
    for (const [, v] of Object.entries(o.headers)) {
      if (typeof v !== 'string') {
        throw new Error('SendEmailInput.headers must map string->string');
      }
    }
  }
}
