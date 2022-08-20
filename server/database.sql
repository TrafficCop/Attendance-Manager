/*admins can create database. database is downloadable*/
CREATE DATABASE attendance;

/*below is a table for a single teacher and associated students*/
CREATE TABLE teacher(
    student_id VARCHAR(255) PRIMARY KEY
);

\\each teacher has one table the table contains the student name, and for each day a new column is added containing tin, tout
CREATE TABLE teacher(
    student_id VARCHAR(255) PRIMARY KEY
);

/*below is a table for attendance for one day and class, includes teachers and students*/
/*attendance is only written in on submit*/
CREATE TABLE teachermmddyy(
    person_name VARCHAR(255) PRIMARY KEY,
    time_in time,
    time_out time
);

CREATE TABLE class_teacher(
    time_in time,
    time_out time,
    mmddyy date,
    person_name VARCHAR(255) PRIMARY KEY,
);

/* we keep only these two types of tables (data). sql queries are
capable of cross searching for certain criteria*/

/*The following is a login table (valid logins)*/
CREATE TABLE login(
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    admin BOOLEAN
);