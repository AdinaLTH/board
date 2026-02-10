const express = require("express");
const { getConnection, oracledb } = require("./db");
const cors = require("cors");
const app = express();
