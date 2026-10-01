const sensitiveHeaderNamePattern =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key|x-auth-token)$/i;

export function isSensitiveHeaderName(name: string) {
  return sensitiveHeaderNamePattern.test(name.trim());
}
