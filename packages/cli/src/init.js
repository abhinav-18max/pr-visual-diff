import { DEFAULT_CONFIG_FILE, createLogger, initConfig } from "@pr-visual-diff/core";

export async function runInit({ projectRoot, configPath, verbose }) {
  const logger = createLogger({ verbose });
  const result = await initConfig(projectRoot, configPath ?? DEFAULT_CONFIG_FILE);
  logger.success(`Created config at ${result.path}`);
  return result;
}
