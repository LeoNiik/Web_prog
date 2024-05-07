'use strict';
const path = require('path');
const express = require('express');
const axios = require('axios');
const { Client } = require('pg');
var aes256 = require('aes256');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// DB connection
const client = new Client({
	user: 'postgres',
	password: 'password',
	host: '172.25.0.1',
	port: 5433,
	database: 'prova',
});

client
	.connect()
	.then(() => {
		console.log('Connected to PostgreSQL database');
	})
	.catch((err) => {
		console.error('Error connecting to PostgreSQL database', err);
	});


const app = express();

app.use(express.static('public'));
app.get('/example', async (req, res) => {

    axios.get('http://host:8080/secret')
        .then( async (response) => { // Fix occurred here
            let data = response.data;
        })
        .catch(err => {
            // Handle Error Here
            res.send("Can't find host");
        });
});

//send index.html as response for GET /
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});


app.listen(PORT, HOST);
