const app = require("./app");
const mongoose = require("mongoose");

// process.on("uncaughtException", (err) => {
//   console.log("UNCAUGHT EXCEPTION, APP SHUTTING NOW!!");
//   console.log(err.message, err.name);
//   process.exit(1);
// });

const DB = "mongodb://localhost:27017";

mongoose
  .connect(DB, {

    autoIndex: true,
  })
  .then(() => {
    console.log("DB connected successfully");
  });

const port = 3000;

const server = app.listen(port, () => {
  console.log("Server is up listening on port:" + port);
});