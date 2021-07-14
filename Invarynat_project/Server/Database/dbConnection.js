exports.dbConnection = function () {
  const config = {
    client: "mssql",
    server: "RITU-PC",
    database: "test",
    authentication: {
      type: "default",
      options: {
        userName: "sa",
        password: "Pulsar180",
      },
    },
    options: {
      database: "test",
      encrypt: false,
      enableArithAbort: true,
    },
  };

  // For Azure sql server example
  /*const config = {
    client: "mssql",
    server: "stg-invaryant-eus-sqlsrv.database.windows.net",
    database: "stg-invaryant-eus-sql-db",
    port: 1433,
    authentication: {
      type: "default",
      options: {
        userName: "invaryantDbAdmin",
        password: "u_cXMLy/MnFY7*yV",
      },
    },
    options: {
      encrypt: true,
      enableArithAbort: true,
    },
  };*/

  return config;
};
