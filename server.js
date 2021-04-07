"use strict";
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const app = express();
require('dotenv').config();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const methodOverride = require('method-override');

const pg = require('pg');
const dbClient = new pg.Client(process.env.DATABASE_URL)
dbClient.connect();
app.use(methodOverride('_methode'))
app.use(express.static('./public/styles'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.put('/books/update/:id', updateBook);
app.delete('/books/:id', deleteBook);

function updateBook(req, res) {
    const id = req.params.id;
    let safeValues = [req.body.author, req.body.title, req.body.isbn, req.body.image_url, req.body.description];

    const updateBooks = 'UPDATE books SET author=$1, title=$2, isbn=$3, image_url=$4 description=$5 WHERE id=$6;';

    dbClient.query(updateBooks, safeValues).then(result => {
            res.redirect(`/books/${id}`);
        })
        // .catch(error, res);
}


function deleteBook(req, res) {
    const id = req.params.id;
    dbClient.query('DELETE FROM books WHERE id=$1', [id]).then(() => {
        res.redirect('/');
    }).catch(error => {console.log(error); handleError(error, res)});
    
}
app.set('view engine', 'ejs');
app.get('/', (req, res) => {

    dbClient
        .query('SELECT * FROM books;')
        .then((data => {
            console.log('ayman', data.rows);
            res.render('pages/index', { books: data.rows })
        }));
})
app.post('/books', addBook);
app.get('/books/:id', getBook);

function addBook(req, res) {
    let title = req.body.title;
    let author = req.body.author;
    let description = req.body.description;
    let image_url = req.body.image_url;
    let isbn = req.body.isbn;

    let bindValues = [author, title, isbn, image_url, description];
    dbClient
    .query('INSERT INTO books (author, title, isbn, image_url, description) VALUES($1, $2, $3,$4,$5) RETURNING id;', bindValues)
    .then((data) => {
        res.redirect(`/books/${data.rows[0].id}`);
    })
}
function getBook(req, res) {
    const bookId = req.params.id;
    console.log(bookId, req.params);
    let bindValues = [bookId];

    dbClient.query('SELECT * FROM books WHERE id=$1;', bindValues).then(data => {
        res.render('pages/books/show', { book: data.rows[0] });
    }).catch(error => {
        handleError(error, res);
    });
}


app.get('/searches/new', (req, res) => {

    res.render('pages/searches/new');
})
app.post('/searches', (req, res) => {

    let type = req.body.type;
    let name = req.body.name;
    let query = `${name}+inauthor`;
    if (type === 'title') {
        query = `${name}+intitle`;
    }
    let url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
    superagent.get(url)
        .then(data => {
            let books = [];
            console.log(data.body.items);
            if (data.body.totalItems) {
                books = data.body.items.map(item => {
                    let book = new Book(item);
                    console.log('book.isbn', book.isbn);
                    return book;
                });
            }

            res.render('pages/searches/show', { booksResult: books.slice(0, 11) });
        })
        .catch(err => errorHandler(err, req, res));
})
function Book(obj) {
    let imageLinks = obj.volumeInfo.imageLinks;
    this.title = obj.volumeInfo.title || '';
    this.img = (imageLinks && imageLinks.thumbnail && imageLinks.thumbnail.replace('http:', 'https:')) || 'https://i.imgur.com/J5LVHEL.jpg';
    this.author = obj.volumeInfo.authors || '';
    this.description = obj.volumeInfo.description || '';
    let industryIdentifiers = obj.volumeInfo.industryIdentifiers;
    this.isbn = industryIdentifiers && industryIdentifiers[0] && (`${industryIdentifiers[0].type} ${industryIdentifiers[0].identifier}`);
}
app.get('/hello', (req, res) => {

    res.render('pages/index');
});
app.get('*', (req, res) => {
    res.send('Not found')
})

const errorHandler = (err, req, res) => {
    console.log('err', err);
    res.status(500).render('pages/error', { err: err });
}

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})