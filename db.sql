-- Crea il database
CREATE DATABASE esempio;

-- Connetti al database appena creato
\c esempio;

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Conversations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Conversation_Participants (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent'
);


-- Inserisce alcuni valori di esempio nella tabella Utenti
INSERT INTO Utenti (nome, cognome, email) VALUES
('Mario', 'Rossi', 'mario.rossi@example.com'),
('Luigi', 'Verdi', 'luigi.verdi@example.com'),
('Giovanna', 'Bianchi', 'giovanna.bianchi@example.com');

