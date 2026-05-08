const colors = {
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  gray: "\u001b[90m",
  reset: "\u001b[0m"
};

function colorize(color, value) {
  return `${colors[color]}${value}${colors.reset}`;
}

export function createLogger({ verbose = false } = {}) {
  return {
    info(message) {
      console.log(message);
    },
    success(message) {
      console.log(colorize("green", `✓ ${message}`));
    },
    warn(message) {
      console.warn(colorize("yellow", `! ${message}`));
    },
    error(message) {
      console.error(colorize("red", `x ${message}`));
    },
    debug(message) {
      if (verbose) {
        console.log(colorize("gray", `› ${message}`));
      }
    }
  };
}
