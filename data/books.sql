DROP TABLE IF EXISTS books;
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author VARCHAR(300),
  title TEXT,
  isbn VARCHAR(250),
  image_url VARCHAR(500),
  description TEXT
);