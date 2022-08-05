//let {dbname} = require("./routes/admins");
//notice module is a built in javascript object with exports property
//exports is a variable that is set to module.exports (by reference)
//setting exports anew makes it different.
//explanation here: https://stackoverflow.com/questions/16383795/difference-between-module-exports-and-exports-in-the-commonjs-module-system
//this is temporary. we will have to make this easily
//modifiable to access the database on different computers
const Pool = require("pg").Pool;

let db = "attendance";
//if (dbname) {
   // db = dbname;
//}

const pool = new Pool({
    user: "postgres",
    password: "Fluffycat66^",
    host: "localhost",
    port: 5432,
    database: `${db}`
});

module.exports = pool;