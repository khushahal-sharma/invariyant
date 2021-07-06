exports.dbConnection = function () {
    var dbConfig = {
        user: "sa", // SQL Server Login
        password: "Pulsar180", // SQL Server Password
        server: "RITU-PC", // SQL Server Server name
        database: "test" // SQL Server Database name
    };
    return dbConfig;
};