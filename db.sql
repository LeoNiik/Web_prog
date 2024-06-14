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
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(32) UNIQUE,
    verify_token VARCHAR(32) UNIQUE
);

DROP TABLE IF EXISTS Conversations;
CREATE TABLE Conversations (
    id SERIAL PRIMARY KEY,
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



-- Create custom type for status
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'declined','sent');

-- Drop the friends table if it exists
DROP TABLE IF EXISTS friends;

-- Create the friends table
CREATE TABLE friends (
    user_id INT,
    friend_id INT,
    status friend_status DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

-- DROP TABLE IF EXISTS friends; 
-- CREATE TABLE friends (
--     user_id INT,
--     friend_id INT,
--     status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
--     requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (user_id, friend_id),
--     FOREIGN KEY (user_id) REFERENCES users(user_id),
--     FOREIGN KEY (friend_id) REFERENCES users(user_id)
-- );

DROP TABLE IF EXISTS Messages;
CREATE TABLE Messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent'
);
