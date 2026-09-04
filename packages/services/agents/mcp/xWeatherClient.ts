import { MCPServerStdio } from "@openai/agents";
const MCP_CONNECT_TIMEOUT_MS = 45_000;
let _mcpServer: MCPServerStdio | null = null;
let _mcpReady = false;
function buildMCPServer(): MCPServerStdio {
  const clientId = "fa1uPigNYY2ZdEUHKPz5P";
  const clientSecret = "WUswtXmlJPDM5qPBYNgJy61Z2aFA5smqbWIovLvI";

  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
  };

  if (clientId && clientSecret) {
    console.log(
      "[xWeatherMCP] xWeather credentials detected — passing to @dangahagan/weather-mcp",
    );
    env["XWEATHER_CLIENT_ID"] = clientId;
    env["XWEATHER_CLIENT_SECRET"] = clientSecret;
  } else {
    console.log(
      "[xWeatherMCP] Using @dangahagan/weather-mcp (free, public data)",
    );
  }

  return new MCPServerStdio({
    name: "WeatherMCP",
    command: "npx",
    args: ["-y", "@dangahagan/weather-mcp@latest"],
    env,
  });
}

/**
 * getXWeatherMCPServer — Returns the singleton MCP server instance if it
 * successfully connected. Returns null if connection failed/timed out.
 */
export function getXWeatherMCPServer(): MCPServerStdio | null {
  return _mcpReady ? _mcpServer : null;
}

/**
 * initXWeatherMCP — Connects the MCP server with a timeout.
 * Non-fatal: if the server times out or fails, the Weather Agent
 * falls back to Open-Meteo only.
 */
export async function initXWeatherMCP(): Promise<void> {
  const server = buildMCPServer();

  try {
    // Race the connection against a timeout
    await Promise.race([
      server.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `MCP connect timed out after ${MCP_CONNECT_TIMEOUT_MS / 1000}s`,
              ),
            ),
          MCP_CONNECT_TIMEOUT_MS,
        ),
      ),
    ]);

    // Log discovered tools
    const tools = await server.listTools();
    const toolNames = tools.map((t) => t.name);
    console.log(
      `[xWeatherMCP] Connected. Discovered ${toolNames.length} tool(s): ` +
        toolNames.join(", "),
    );

    _mcpServer = server;
    _mcpReady = true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[xWeatherMCP] MCP server unavailable: ${message}. ` +
        "Weather Agent will use Open-Meteo only.",
    );
    // Attempt graceful close of the partially-started process
    try {
      await server.close();
    } catch {
      /* ignore */
    }
    _mcpServer = null;
    _mcpReady = false;
  }
}

/**
 * shutdownXWeatherMCP — Closes the MCP server connection.
 */
export async function shutdownXWeatherMCP(): Promise<void> {
  if (_mcpServer && _mcpReady) {
    try {
      await _mcpServer.close();
      console.log("[xWeatherMCP] Connection closed");
    } catch {
      // Ignore shutdown errors
    }
    _mcpServer = null;
    _mcpReady = false;
  }
}
