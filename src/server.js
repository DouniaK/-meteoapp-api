const config = require("./config");
const app = require("./app");

app.listen(config.port, () => {
  console.log(`API MeteoAPP démarrée sur le port ${config.port}`);
});
