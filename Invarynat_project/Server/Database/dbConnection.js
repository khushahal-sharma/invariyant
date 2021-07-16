exports.dbConnection = function () {
  const config = {
    client: "mssql",
    server: "DESKTOP-DGUDS34",
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
  /*
  const config = {
    client: "mssql",
    server: "az-eastus2-prod-spoke1-mhri-mmr-sql.privatelink.database.windows.net",
    database: "az-eastus2-prod-spoke1-mhri-mmr-sqldb",
    authentication: {
      type: "default",
      options: {
        userName: "mmuser",
        password: "xxx",
      },
    },
    options: {
      encrypt: true,
      enableArithAbort: true,
    },
  };
  */
  return config;
};