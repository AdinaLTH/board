const express = require("express");
const { getConnection, oracledb } = require("./db");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
