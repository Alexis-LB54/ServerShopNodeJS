const express = require("express");
var inventory = require("./inventory.json")
const fs = require('fs')
var cors = require('cors')
var bodyParser = require('body-parser');
var app = express()
const port = "96"
var data = fs.readFileSync("inventory.json");
var myObject = JSON.parse(data);

const mysql = require('mysql');
const { title } = require("process");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "listeDeCourse"

});


app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get("/articles", (req, res) => {
    res.json(inventory)
})

app.post("/articles", (req, res) => {
    const id = Number(req.body.id)
    const title = req.body.title
    const price = req.body.price

    let articleFound = {}
    inventory.articles.forEach((article) => {
        if (article.id === id) {
            article.title = title
            article.price = price
            articleFound = article
        }
    })
    fs.writeFileSync("./inventory.json", JSON.stringify(inventory))
    res.json(articleFound);
    console.log("test 3", articleFound);
})

app.post("/add", (req, res) => {
    const article = {
        id: Number((inventory.articles.length) + 1),
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        currency: req.body.currency,
        brand: req.body.brand,
    }
    inventory.articles.push(article)
    fs.writeFileSync("./inventory.json", JSON.stringify(inventory))
    res.json(article);
})

db.connect(function (err) {
    if (err) throw err;
    console.log("Connecté à la base de données MySQL!");
    db.query("CREATE TABLE IF NOT EXISTS articles(id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, price INT, currency varchar(255) DEFAULT '€', brand VARCHAR(255))", function (err, result) {
        if (err) throw err;
        console.log("table créée ou déjà créée mais connécté quoi qu'il arrive !");
    });
    db.query("CREATE TABLE IF NOT EXISTS informations(id INT AUTO_INCREMENT PRIMARY KEY, compagnie_name VARCHAR(255) NOT NULL, number_of_employees INT, turnover INT)", function (err, result) {
        if (err) throw err;
        console.log("table créée ou déjà créée mais connécté quoi qu'il arrive !");
    });
    db.query("CREATE TABLE IF NOT EXISTS accounts(id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL)", function (err, result) {
        if (err) throw err;
        console.log("table créée ou déjà créée mais connécté quoi qu'il arrive !");
    });

});

app.get("/mybdd", (req, res) => {
    inventory.articles.forEach((article) => {
        var insert = `INSERT INTO articles (title, description, price, currency, brand) VALUES('${article.title}', '${article.description}', '${article.price}', '${article.currency}', '${article.brand}')`;
        console.log("mon insert en bdd", insert);
        console.log("insert d'un user", insert2);
        db.query(insert, function (err, results) {
            if (err) throw err;
            console.log("Elements ajoutés " + article.id);
        });
    });
})

app.get("/myuser", (req, res) => {
    var insert2 = `INSERT INTO accounts (username, password, email) VALUES ('alexis', 'alexis', 'alexis@alexis.eu')`;
    db.query(insert2, function (err, results) {
        if (err) throw err;
        console.log("User ajouté");
    });
})



app.listen(port, () => {
    console.log("coucou le server tourne" + port);
})
