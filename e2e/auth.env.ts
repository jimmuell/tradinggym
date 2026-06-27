// Test-account passwords are sourced from the environment (.env.test, gitignored),
// never committed. playwright.config.ts loads .env.test via dotenv before tests run.
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "";

export const TEST_ACCOUNTS = {
  starter: { email: "starter@gmail.com", password: TEST_PASSWORD },
  pro: { email: "pro@gmail.com", password: TEST_PASSWORD },
  expert: { email: "expert@gmail.com", password: TEST_PASSWORD },
  guru: { email: "guru@gmail.com", password: TEST_PASSWORD },
  admin: { email: "admin@gmail.com", password: TEST_PASSWORD },
};
