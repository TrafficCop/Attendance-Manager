//more on if statements in query:
//https://stackoverflow.com/questions/59082517/how-do-i-structure-an-if-statement-in-node-postgres

const express = require('express');
const pool = require('../db');
const router = express.Router();
const format = require('pg-format');
/*
let dt = new Date();
let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();
*/

//we keep all students in the table as lower case
router.put("/:id/manage-student", async(req, res) => {
    try {
        const {id} = req.params;
        const {name} = req.body; //name
        //Syntax: INSERT INTO tablename (column name)...
        //multiple ways to use variable names: either concat, `${}`, or
        //use $1
        await pool.query("INSERT INTO " + id + " (student_id) VALUES ($1)", 
        [name]);
        res.json(`Student ${name} successfully added to class!`)
    } catch (err) {
        console.error(err.message);
        res.json('Unable to add student')
    }
});

//we keep all students in the table as lower case
router.delete("/:id/manage-student", async(req, res) => {
    try {
        const {id} = req.params;
        const {name} = req.body; //name
        //Syntax: INSERT INTO tablename (column name)...
        //multiple ways to use variable names: either concat, `${}`, or
        //use $1

        const qry = await format(`SELECT EXISTS (SELECT 1 FROM %I WHERE student_id=%L)`, id, name);
        const exists = await pool.query(qry);
        if (!exists.rows[0].exists) {
            res.json('Student does not exist');
            return;
        }

        await pool.query("DELETE FROM " + id + " WHERE student_id = $1", 
        [name]);
        res.json(`Student ${name} successfully removed from class!`)
    } catch (err) {
        console.error(err.message);
        res.json('Unable to remove student')
    }
});

//sign in only 
//sign in on check
//might be able to undo error checking if the validation is done every load
router.put("/:id/sign-in", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const {name} = req.body; //name to sign in
        const colname = "" + d;

        const qry = await format(`SELECT EXISTS (SELECT 1 FROM %I WHERE student_id=%L)`, id, name);
        const exists = await pool.query(qry);
        if (!exists.rows[0].exists) {
            res.json('student not found')
        }
        
        const querySignedIn = format("SELECT %I FROM %I WHERE student_id=%L", colname, id, name);
        let resp = await pool.query(querySignedIn);
        if (resp.rows[0] !== undefined) {
            if (resp.rows[0][colname] !== null) {
                res.json('Student already signed in');
                return;
            }
        }
        const insert = await format("UPDATE %I SET %I=%L WHERE student_id=%L", id, colname, t, name)
        await pool.query(insert);
        //functionality: add names that are signed in into 
        //a table for the class on that day
        res.json('success');
    } catch (err) {
        console.error(err.message);
    }
});

//sign-out: signs out on submit of form. Design allows manual sign
//out for early sign outs. assumes students exist in the table and column for day initialized
router.put("/:id/sign-out", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const {name} = req.body; //name
        const colname = "" + d;
        const querySignedIn = format("SELECT %I FROM %I WHERE student_id=%L", colname, id, name);
        let resp = await pool.query(querySignedIn);
        if (resp.rows[0][colname] !== null) {
            if (resp.rows[0][colname].includes("/")) {
                res.json('You have already signed out!');
                return;
            }
            const inout = "" + resp.rows[0][colname] + "/" + t;
            const insert = format("UPDATE %I SET %I=%L WHERE student_id=%L", id, colname, inout, name);
            await pool.query(insert);
            res.json('Successfully signed out');
        } else {
            res.json('Please sign in first');
        }
    } catch (err) {
        console.error(err);
    }
});

router.get("/current/:id", async(req, res) => {
    try {
        const dt = new Date();
        
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();
        const {id} = req.params;
        const query = format("WITH listing (person_name, value) AS (SELECT student_id, %I FROM %I) SELECT * FROM listing;", d, id);
        let resp = await pool.query(query);
        res.json(resp.rows);
    } catch (err) {
        console.error(err);
    }
})

router.get("/current-students/:id", async(req, res)=> {
    try {
        const {id} = req.params;
        const query = format("WITH listing (person_name) AS (SELECT student_id FROM %I) SELECT * FROM listing;", id);
        let resp = await pool.query(query);
        res.json(resp.rows);
    } catch (err) {
        console.error(err);
    }
})

//we create a function that handles the creation of
//a table for a teacher containing their students
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const tblname = "" + id;
        const exists = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [tblname]);
        const qry = format(" \
        CREATE TABLE %I( \
            student_id VARCHAR(255) PRIMARY KEY \
        ); \
        ", id);
        if(!exists.rows[0].exists) {
            const resc = await pool.query(qry);
        }
        res.send('success');
    } catch (err) {
        res.send('error');
    }
})

//this function will verify that a column has been created for the day
router.post("/attendance/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();
        const colname = "" + d;
        const queryexist = format("SELECT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=%L AND COLUMN_NAME=%L)"
        , id, colname);
        const exists = await pool.query(queryexist);
        if(!exists.rows[0].exists) {
            const qry = format(" \
            ALTER TABLE %I \
                ADD %I VARCHAR(255); \
            ", id, colname);
            const resc = await pool.query(qry);
        }
        res.send('success');
    } catch (err) {
        console.log(err)
        res.send('error');
    }
})

//this function will verify that a student exists in a class
router.get("/students/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const name = req.header('name');
        const qry = await format(`SELECT EXISTS (SELECT 1 FROM %I WHERE student_id=%L)`, id, name);
        const exists = await pool.query(qry);
        if (exists.rows[0].exists) {
            res.send('success');
        } else {
            res.send('student not found')
        }
    }  catch (err) {
        console.error(err.message);
        res.send('error');
    }
})

//create the column for the day if it doesn't exist else return the data
//always return the current rows - empty list if new 
router.get("/:id/sign-in", async(req, res) => {
    try {
        let dt = new Date();
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const colname = "" + d;

        const queryexist = format("SELECT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=%L AND COLUMN_NAME=%L)"
        , id, colname);
        const exists = await pool.query(queryexist);
        if(!exists.rows[0].exists) {
            const qry = format(" \
            ALTER TABLE %I \
                ADD %I VARCHAR(255); \
            ", id, colname);
            const resc = await pool.query(qry);
        } else {
            const getEntries = format("SELECT student_id, %I FROM %I", colname, id);
            const table = await pool.query(getEntries);
            res.send(table.rows);
        }
        //res.send("success");
    } catch (err) {
        console.error(err.message);
    }
})

/*
//tell if table exists for the day
router.get("/:id/sign-in", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const tblname = "" + id + d;
        const exists = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [tblname]);
        res.send(exists.rows[0].exists);
    } catch (err) {
        console.error(err.message);
    }
})
*/

//undo sign-in: unsign on uncheck
router.put("/:id/unsign", async(req, res) => {
    try {
        const {id} = req.params;
        const {name} = req.body; //name to unsign
        const tblname = "" + id + d;
        const qry = `DELETE FROM ${tblname} WHERE person_name='${name}'`;
        await pool.query(qry);
        res.send('success!');
    } catch (err) {
        console.error(err);
    }
});

/*
//create the table for the day if it doesn't exist else return the table
//always return the current rows - empty list if new 
router.get("/:id/sign-in", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const tblname = "" + id + d;
        const exists = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [tblname]);
        if (!exists.rows[0].exists) {
            const setTable = format(" \
                DO $$ \
                BEGIN \
                IF (NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '%I')) THEN \
                    CREATE TABLE %I( \
                        person_name VARCHAR(255) PRIMARY KEY, \
                        time_in time, \
                        time_out time \
                    ); \
                END IF; \
                END $$; \
            ", tblname, tblname);
            await pool.query(setTable);
            const rows = [];
            res.send(rows);
        } else {
            const getTable = format("SELECT * FROM %I", tblname);
            const table = await pool.query(getTable);
            res.send(table.rows);
        }
        //res.send("success");
    } catch (err) {
        console.error(err.message);
    }
})

//sign in only 
//sign in on check
//might be able to undo error checking if the validation is done every load
router.put("/:id/sign-in", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const {names} = req.body; //list of names
        const tblname = "" + id + d;
        const setTable = format(" \
            DO $$ \
            BEGIN \
            IF (NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '%I')) THEN \
                CREATE TABLE %I( \
                    person_name VARCHAR(255) PRIMARY KEY, \
                    time_in time, \
                    time_out time \
                ); \
            END IF; \
            END $$; \
        ", tblname, tblname);
        const resc = await pool.query(setTable);
        if (names != null) 
        names.forEach(element => {
            //const personQuery = `INSERT INTO ${tblname} (student_id, time_in) VALUES (${element}, ${t})`;
            pool.query("INSERT INTO " + tblname + " (person_name, time_in) VALUES ($1, $2)", [element, t]);
        });
        //functionality: add names that are signed in into 
        //a table for the class on that day
        res.send('success');
    } catch (err) {
        console.error(err.message);
    }
});

//sign-out: signs out on submit of form. Design allows manual sign
//out for early sign outs
router.put("/:id/sign-out", async(req, res) => {
    try {
        let dt = new Date();
        let t = dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let d = "" + String(dt.getMonth()+1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0') + dt.getFullYear();

        const {id} = req.params;
        const {names} = req.body; //list of names
        const tblname = "" + id + d;
        names.forEach(element => {
            //const personQuery = `INSERT INTO ${tblname} (student_id, time_in) VALUES (${element}, ${t})`;
            pool.query("UPDATE " + tblname + " SET time_out=$1 WHERE person_name=$2", [t,element]);
        });
        res.send('success');
    } catch (err) {
        console.error(err);
    }
});

*/
module.exports = router;