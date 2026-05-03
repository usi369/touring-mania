let _env: any = {};

const getEnvValue = (key: string) => {
  if (_env[key]) return _env[key];
  if (typeof process !== "undefined" && process.env[key]) return process.env[key];
  return "";
};

export const ENV = {
  get appId() { return getEnvValue("VITE_APP_ID") || getEnvValue("APP_ID"); },
  get cookieSecret() { return getEnvValue("JWT_SECRET"); },
  get databaseUrl() { return getEnvValue("DATABASE_URL"); },
  get oAuthServerUrl() { return getEnvValue("OAUTH_SERVER_URL"); },
  get ownerOpenId() { return getEnvValue("OWNER_OPEN_ID"); },
  get isProduction() { 
    const nodeEnv = getEnvValue("NODE_ENV");
    return nodeEnv === "production";
  },
  get forgeApiUrl() { return getEnvValue("BUILT_IN_FORGE_API_URL"); },
  get forgeApiKey() { return getEnvValue("BUILT_IN_FORGE_API_KEY"); },
};

export function initEnv(env: any) {
  _env = { ...env };
}
