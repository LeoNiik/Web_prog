-- Crea il database
CREATE DATABASE esempio;

-- Connetti al database appena creato
\c esempio;

DROP SCHEMA IF EXISTS prova;
CREATE SCHEMA prova;
SET search_path to prova;

DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS Conversations;
CREATE TABLE Conversations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS Conversation_Participants; 
CREATE TABLE Conversation_Participants (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS Messages;
CREATE TABLE Messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent'
);

INSERT INTO Conversations (name) VALUES ('New Conversation') RETURNING id;
INSERT INTO Conversations (name) VALUES ('Francesco') RETURNING id;

INSERT INTO Conversation_Participants (conversation_id, user_id) VALUES (1, 1);
INSERT INTO Conversation_Participants (conversation_id, user_id) VALUES (2, 1);
