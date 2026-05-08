import { parseArgs } from "node:util";

export function parseCliArgs(argv) {
  const [command = "help", ...rest] = argv;

  const { values } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      base: { type: "string" },
      routes: { type: "string" },
      headless: { type: "boolean" },
      verbose: { type: "boolean" },
      config: { type: "string" },
      output: { type: "string" },
      "fail-on-change": { type: "boolean" }
    }
  });

  return {
    command,
    options: {
      baseBranch: values.base,
      routes: values.routes ? values.routes.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
      headless: values.headless,
      verbose: values.verbose ?? false,
      configPath: values.config,
      outputDir: values.output,
      failOnChange: values["fail-on-change"]
    }
  };
}
