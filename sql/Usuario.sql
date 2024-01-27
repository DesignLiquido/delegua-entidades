CREATE TABLE Usuarios (
  id INT,
  nome VARCHAR(255)
);

INSERT INTO Usuarios (id, nome)
VALUES (1, 'João');


UPDATE Usuarios
SET nome = 'Maria'
WHERE id = 1;


DELETE FROM Usuarios
WHERE id = 1;


SELECT * FROM Usuarios;

