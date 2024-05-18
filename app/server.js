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


const app = express();

app.use(express.static('public'));
app.use(express.static('src'));

app.post('/login',(req,res) => {
	
});

// app.post("/api/post/message", (res,res) =>{


// });

// app.get("/api/get/convs/:id", async (req, res) => {
	
// 	if(isNaN(req.params.id)){
// 		res.send(error)
// 	}

// 	client.query('SELECT * FROM conve', (err, result) => {
// 		if (err) {
// 			console.error('Error executing query', err);
// 		} else {
// 			console.log('Query result:', result.rows);
// 		}
// 	});
// });

//send index.html as response for GET /
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});





// Placeholder for POST /login route
app.post('/login', async (req, res) => {
	// Handle login logic here
	const { username, password } = req.body;
	try {

		if (!username || !password) {
			return res.status(400).send('Username e password sono obbligatori');
		}
	
		// Cerca l'utente nel database
		const result = client.query('SELECT * FROM Users WHERE username = $1', [username]);
		const user = result.rows[0];
	
		// Verifica che l'utente esista
		if (!user) {
			return res.status(401).send('Credenziali non valide');
		}
	
		// Confronta la password inserita con quella salvata nel database
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).send('Credenziali non valide');
		}
	
		// Se le credenziali sono valide, autentica l'utente (puoi usare JWT o sessioni)
		res.status(200).send('Login effettuato con successo');
  
	} catch (error) {
	  console.error('Errore durante il login:', error);
	  res.status(500).send('Errore interno del server');
	}
	res.sendFile(path.join(__dirname, 'public/hello_world.html'));
});

// Placeholder for POST /signup route
app.post('/signup', async (req, res) => {
	const { username, password } = req.body;

	try {
	  // Hash della password
	  const hashedPassword = await bcrypt.hash(password, 10);
  
	  // Inserisci il nuovo utente nel database
	  await client.query(
		'INSERT INTO Users (username, password) VALUES ($1, $2, $3)',
		[username, email, hashedPassword]
	  );
  
	  res.status(201).send('Registrazione avvenuta con successo');
  
	} catch (error) {
	  console.error('Errore durante la registrazione:', error);
	  res.status(500).send('Errore interno del server');
	}

	res.sendFile(path.join(__dirname, 'public/index.html'));	
});

app.get('/login', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'))
});
app.get('/easter_egg', (req,res) => {
	res.redirect('https://www.youtube.com/watch?v=2HKbbDukbJE&list=RD2HKbbDukbJE');
});

app.listen(PORT, HOST);


// CREATE TABLE Users (
//     id SERIAL PRIMARY KEY,
//     username VARCHAR(50) NOT NULL UNIQUE,
//     email VARCHAR(100) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE Conversations (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE Conversation_Participants (
//     id SERIAL PRIMARY KEY,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     user_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE Messages (
//     id SERIAL PRIMARY KEY,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     content TEXT NOT NULL,
//     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     status VARCHAR(50) DEFAULT 'sent'
// );

