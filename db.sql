-- Crea il database
CREATE DATABASE esempio;

-- Connetti al database appena creato
\c esempio;

-- Crea la tabella Utenti
CREATE TABLE Utenti (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50),
    cognome VARCHAR(50),
    email VARCHAR(100)
);

-- Inserisce alcuni valori di esempio nella tabella Utenti
INSERT INTO Utenti (nome, cognome, email) VALUES
('Mario', 'Rossi', 'mario.rossi@example.com'),
('Luigi', 'Verdi', 'luigi.verdi@example.com'),
('Giovanna', 'Bianchi', 'giovanna.bianchi@example.com');

