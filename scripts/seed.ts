import { seedDemoData } from "./seed-data";

async function main() {
  await seedDemoData();
  console.info("Seeded the deterministic Symph CRM demo dataset.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
