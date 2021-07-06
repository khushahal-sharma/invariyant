exports.dbConnection = function () {
    var dbConfig = {
        user: "sa", // SQL Server Login
        password: "Pulsar180", // SQL Server Password
        server: "RITU-PC", // SQL Server Server name
        database: "test", // SQL Server Database name
         "options": {
        "encrypt": true,
        "enableArithAbort": true
        }
    };




    const config = {
	server: 'RITU-PC',
	authentication: {
		type: 'default',
		options: {
			userName: 'sa',
			password: "Pulsar180",
		},
	},
	options: {
		database: 'test',
		encrypted: false,
	},
}
    return config;
};