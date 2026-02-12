const oracledb = require("oracledb");

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function getConnection() {
  return await oracledb.getConnection({
    user: "board",
    password: "1234",
    connectString: "192.168.0.32:1521/xe",
  });
}

module.exports = { getConnection, oracledb };
