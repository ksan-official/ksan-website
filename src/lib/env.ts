export function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

export function getRequiredEnv(name: string) {
  const value = getOptionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
