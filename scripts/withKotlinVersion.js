const { withProjectBuildGradle } = require("@expo/config-plugins");

// Expo 52 / expo-modules-core 2.x bundles Compose Compiler 1.5.15, which
// requires Kotlin 1.9.25, but the Expo template hardcodes 1.9.24.
// This config plugin patches the generated build.gradle during `expo prebuild`.
module.exports = function withKotlinVersion(config, { version = "1.9.25" } = {}) {
  return withProjectBuildGradle(config, (c) => {
    c.modResults.contents = c.modResults.contents.replace(
      /kotlinVersion\s*=\s*["'][\d.]+["']/g,
      `kotlinVersion = "${version}"`,
    );
    return c;
  });
};
