"use strict";
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./public/styles'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index')
})
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
            if (data.body.totalItems) {
                books = data.body.items.map(item => {
                    let book = new Book(item);
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