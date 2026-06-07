import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const API_URL =
  process.env.PRODUCTION_BIKE_API_URL ??
  "https://touring-mania-vite.pages.dev/api/trpc/bike.list";
const DB_NAME = "touring-mania-db";
const dryRun = process.argv.includes("--dry-run");

const requiredStringFields = [
  "name",
  "maker",
  "category",
  "cylinders",
  "transmission",
];
const requiredIntegerFields = [
  "id",
  "horsepower",
  "fuelEfficiency",
  "weight",
  "seatHeight",
  "totalLength",
  "year",
  "price",
];
const nullableStringFields = [
  "photoUrl",
  "ownerName",
  "ownerState",
  "displacement",
  "displacementUnit",
  "engineType",
];
const booleanFields = [
  "isTokyoRemake",
  "isR6Complete",
  "isR7Mega",
  "isR7Starter",
];

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function validateBikes(bikes) {
  if (!Array.isArray(bikes) || bikes.length < 100) {
    throw new Error(`Unexpected production bike count: ${bikes?.length ?? "unknown"}`);
  }

  const ids = new Set();
  for (const bike of bikes) {
    for (const field of requiredStringFields) {
      if (typeof bike[field] !== "string" || bike[field].length === 0) {
        throw new Error(`Bike ${bike.id ?? "unknown"} has invalid ${field}`);
      }
    }
    for (const field of requiredIntegerFields) {
      if (!Number.isInteger(bike[field])) {
        throw new Error(`Bike ${bike.id ?? "unknown"} has invalid ${field}`);
      }
    }
    if (bike.price < 1 || bike.price > 10_000) {
      throw new Error(
        `Bike ${bike.id} has suspicious price ${bike.price}; expected ten-thousand-yen units`,
      );
    }
    if (ids.has(bike.id)) {
      throw new Error(`Duplicate bike id returned by production: ${bike.id}`);
    }
    ids.add(bike.id);
  }
}

function buildSql(bikes) {
  const columns = [
    "id",
    ...requiredStringFields,
    ...requiredIntegerFields.filter(field => field !== "id"),
    ...nullableStringFields,
    ...booleanFields,
  ];

  const statements = ["DELETE FROM bikes;"];
  for (const bike of bikes) {
    const values = columns.map(column => sqlValue(bike[column]));
    statements.push(
      `INSERT INTO bikes (${columns.join(", ")}) VALUES (${values.join(", ")});`,
    );
  }
  return `${statements.join("\n")}\n`;
}

async function main() {
  console.log(`Reading production bike master from ${API_URL}`);
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Production API returned ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const bikes = payload?.result?.data?.json;
  validateBikes(bikes);

  console.log(`Validated ${bikes.length} bikes from production.`);
  if (dryRun) {
    console.log("Dry run complete. Local D1 was not changed.");
    return;
  }

  const directory = mkdtempSync(join(tmpdir(), "touring-mania-bikes-"));
  const sqlPath = join(directory, "sync-bikes.sql");
  writeFileSync(sqlPath, buildSql(bikes), "utf8");

  try {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    const result = spawnSync(
      npx,
      ["wrangler", "d1", "execute", DB_NAME, "--local", `--file=${sqlPath}`],
      { stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Wrangler exited with status ${result.status}`);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }

  console.log(`Local D1 bike master now matches production (${bikes.length} bikes).`);
}

main().catch(error => {
  console.error(`Bike sync failed: ${error.message}`);
  process.exitCode = 1;
});
