const express = require('express');
const pool = require('../db');
const router = express.Router();
const fastcsv = require("fast-csv");
const fs = require("fs");
let pth = '';

//C:/Users/jhung/Desktop/Web Dev/Attendance/files/rst.csv

//currently writes the data to a server side file before pushing it as a download
router.post('/download', async(req, res) => {
    try {
        /*
        const {pat} = req.body;
        pth = String(pat);
        if (pth == '') {
            console.error('Please specify a path');
        }
        const ws = fs.createWriteStream(""+ pth +"rst.csv")
        */

        const {tblname} = req.body;
        //see if you can make it copyable to relative path
        //const file = '../files/exp.csv'

        /*
        const qry = `SELECT * FROM ${tblname}`;
        const r = await pool.query(qry);
        const jsonData = JSON.parse(JSON.stringify(r.rows));
        fastcsv.write(jsonData, {headers: true}).pipe(ws);
        */
        await pool.query("COPY " + tblname + " TO 'C:/Users/jhung/Desktop/Web Dev/Attendance//server/files/exp.csv' DELIMITER ',' CSV HEADER;");
        //const dld = '' + pth+'rst.csv';
        res.download("C:/Users/jhung/Desktop/Web Dev/Attendance/server/files/exp.csv");
    } catch(err) {
        console.error(err);
    }
});

module.exports = router;
//this actually works. will allow us to set a new database
module.exports.dbname = "attendance";