//this file handles the backend operations
//https://www.geeksforgeeks.org/jwt-authentication-with-node-js/
const express = require("express");
const app = express();
const cors = require("cors");
const pool = require('./db');
const format = require('pg-format');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
require('dotenv').config();
app.use(cors());
app.use(express.json());
const bcrypt = require('bcrypt');
const saltRounds = 10;
dotenv.config();

/*Design:
    Urls separate for teachers, admin
*/

app.post("/login/:type", async(req, res) => {
    const {type} = req.params;
    const {username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const booleanType = type ==='admin';
    let qry = format(" \
        DO $$ \
        BEGIN \
        IF (EXISTS (SELECT * FROM login WHERE username = %L AND password = %L AND admin = %L)) THEN \
            RAISE NOTICE 'Login Successful'; \
        ELSE \
            RAISE EXCEPTION 'Nonexistent ID' \
                USING HINT = 'Please check your user ID'; \
        END IF; \
        END $$; \
    ", username, password, booleanType);
    try {
        await pool.query(qry);
        let jwtSecretKey = process.env.JWT_SECRET_KEY;
        let data = {
            time: Date(),
            userId: username,
            admin: booleanType,
        }

        const token = jwt.sign(data,jwtSecretKey);
        //res.send(token);
        res.json(token);
    } catch (err){
        //res.send(token);
        res.json('failure');
    }
});

app.get("/user/validateToken", async(req,res) => {
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const admin = req.header('admin');
    const userId = req.header('userId');
    try {
        //send with header {token_header_key: sdsjjkajskj}
        let token = req.header(tokenHeaderKey);
        token = token.replaceAll('"','');
        let decoded = jwt.decode(token, {json: true});
        if (decoded.userId !== userId || String(decoded.admin) !== admin) {
            return res.status(401).json('failure');
        }
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            return res.json('success')
        } else {   
            return res.status(401).json('failure');
        }
    } catch (error) {
        console.log(error)
        return res.status(401).json('failure');
    }
});

const teacherRouter = require("./routes/teachers");
app.use('/teachers', teacherRouter);

const adminRouter = require("./routes/admins");
app.use('/admins', adminRouter);

app.listen(5000, ()=> {
    console.log("server has started on port 5000")
})