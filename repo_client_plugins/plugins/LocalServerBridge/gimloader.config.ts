import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "LocalServerBridge",
    description: "Bridges Gimloader's client requests to a local custom server while falling back to official Gimkit endpoints.",
    author: "OpenAI",
    version: "0.1.0",
    changelog: ["Initial release"],
    gamemodes: ["2d"]
});
