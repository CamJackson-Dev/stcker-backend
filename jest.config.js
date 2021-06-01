module.exports = {
  preset: "ts-jest",
  setupFiles: ["./test-env.js"],
  testEnvironment: "node",
  testTimeout: 15000,
  verbose: true,
};
