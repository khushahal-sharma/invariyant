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
  return config;
};
