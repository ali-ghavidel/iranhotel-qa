const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    chromeWebSecurity: false, // Disables Chrome's web security to allow cross-origin behavior
    experimentalSessionAndOrigin: true, // Enables experimental support for session and origin management
  },
});
