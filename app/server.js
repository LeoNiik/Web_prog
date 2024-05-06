'use strict';
const path = require('path');
const express = require('express');
const axios = require('axios');
var aes256 = require('aes256');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App


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
