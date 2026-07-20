import { seedDemoData } from "./seed-data";

async function main() {
  await seedDemoData();
  console.info("Reset the Symph CRM demo database to its baseline fixtures.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
