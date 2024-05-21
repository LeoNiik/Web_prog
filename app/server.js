'use strict';
const path = require('path');
const express = require('express');
const axios = require('axios');
const { Client } = require('pg');
var bodyParser = require('body-parser')
const { createHash } = require('crypto');



//const result = createHash('sha256').update("bacon").digest('hex');
// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// DB connection
const client = new Client({
	user: 'postgres',
	password: 'password',
	host: '172.25.0.1',
	port: 5433,
	database: 'esempio',
});

client
.connect()
.then(() => {
	console.log('Connected to PostgreSQL database');
})
.catch((err) => {
	console.error('Error connecting to PostgreSQL database', err);
});
//setting search_path
client.query('SET search_path to prova');

const app = express();

app.use(express.static('public'));
app.use(express.static('src'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//TODO trovare un modo per assegnare
app.get("/api/convs/:id", async (req, res) => {
	console.log('hello');
	const id = req.params.id;
	client.query('SELECT conversation_id,name,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id WHERE user_id = ($1)'
	,[id], (err, result) => {
		if (err) {
			console.error('Error executing query', err);
			res.status(401).send(			
				{status : "error",
				content : "error loading chats click to retry"
			})
		}
		//return the conversation as HTML
		let dinamicContent = '';
		result.rows.forEach(element => {
			const {conv_id,conv_name, lastUpdate} = element;
			dinamicContent += 
			"<div class='sidebar-entry'>\
				<label id="+conv_id+">"+conv_name +" "+lastUpdate+"</label>\
			</div>";
		});
		res.status(201).send({
			status : "success",
			content : dinamicContent
		});
	});
});

app.get("/api/chat/:id", async (req, res) => {
	console.log('hello');
	const id = req.params.id;
	client.query('SELECT conversation_id,name,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id WHERE user_id = ($1)'
	,[id], (err, result) => {
		if (err) {
			console.error('Error executing query', err);
			res
		}
		//return the conversation as HTML
		let dinamicContent = '';
		result.rows.forEach(element => {
			const {conv_id,conv_name, lastUpdate} = element;
			dinamicContent += 
			"<div class='sidebar-entry'>\
				<label>"+conv_name +" "+lastUpdate+"</label>\
			</div>";
		});
		res.status(201).send({
			stasus : "success",
			content : dinamicContent
		});
	});
});

			
app.get('/home', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/home.html'));
});

//send index.html as response for GET /
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});
					
async function getUser(username){

	if (!username) {
		return null;
	}

	// Cerca l'utente nel database
	const result = await client.query('SELECT * FROM Users WHERE username = $1', [username]);
	const user = result.rows[0];

	// Verifica che l'utente esista
	return user;
}
	
function comparePasswd(passwd, hash){
	const hashedPassword = createHash('sha256').update(passwd).digest('hex');
	return hashedPassword === hash;
}

// Placeholder for POST /api/login route
app.post('/api/login', async (req, res) => {
	
	// Handle login logic here
	
	const { username, password } = req.body;
	try {

		let user = await getUser(username);
		console.log(user);
		if (!user) {
			return res.status(401).send({
				status : "User "+username+" does not exist"
			});
		}
		
		const isPasswordValid = comparePasswd(password, user.password);
		// Confronta la password inserita con quella salvata nel database
		if (!isPasswordValid) {
			return res.status(401).send({status : "wrong credentials"});
		}
		
		// Se le credenziali sono valide, autentica l'utente
		let id = user.id;
		res.status(200).send({
			status : "success",
			sessid : id
		});
		
	} catch (error) {
		console.error('Errore durante il login:', error);
		res.status(500).send({status : "internal error"});
	}
});

// Placeholder for POST /signup route
app.post('/api/signup', async (req, res) => {
	
	const { username, password } = req.body;

	if(getUser(username)){
		return res.status(401).send({status : 'User '+username+' already exists'})
	}
	
	try {
		// Hash della password
	  const hashedPassword = createHash('sha256').update(password).digest('hex');
	  console.log(password,hashedPassword)
	  // Inserisci il nuovo utente nel database
	  await client.query(
		  'INSERT INTO Users (username, password) VALUES ($1,$2)',
		  [username,hashedPassword]
		);
		
		res.status(200).send({status : "success"});
		
	} catch (error) {
		console.error('Errore durante la registrazione:', error);
		res.status(500).send({status : "internal error"});
	}	
});

app.get('/login', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'))
});

app.get('/signup', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/signup.html'))
});

app.get('/easter_egg', (req,res) => {
	res.redirect('https://www.youtube.com/watch?v=2HKbbDukbJE&list=RD2HKbbDukbJE');
});

app.listen(PORT, HOST);


// CREATE TABLE Users (
//     id int,
//     username VARCHAR(50) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (id)
// );

// CREATE TABLE Conversations (
//     id int,
//     name VARCHAR(255),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (id)
// );

// CREATE TABLE Conversation_Participants (
//     id int,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     user_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (id, conversation_id, user_id)
// );

// CREATE TABLE Messages (
//     id int,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     content TEXT NOT NULL,
//     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     status VARCHAR(50) DEFAULT 'sent',
//     PRIMARY KEY (id,conversation_id,sender_id)
// );

//seleziono solo le conversazioni di cui faccio parte

//SELECT conversation_id FROM Conversations JOIN Conversation_Participants where user_id = ($1) [id_utente] 

//seleziono tutti i messaggi data una conversazione 

//SELECT content,timestamp FROM Messages JOIN conversation WHERE Conversations.id = ($1) [conversation_id] 

//INSERT INTO Conversations (name) VALUES ($1) RETURNING id [conv_name]
//SELECT 
//INSERT INTO Conversation_Participants () VALUES ($1) [ 

