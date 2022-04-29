const express = require("express");
var inventory = require("./inventory.json")
const fs = require('fs')
var cors = require('cors')
var bodyParser = require('body-parser');
var app = express()
const port = "96"

const mysql = require('mysql');

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

db.connect(function (err) {
    if (err) throw err;
    console.log("Connecté à la base de données MySQL!");
    db.query("CREATE TABLE IF NOT EXISTS articles(id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, price INT, currency varchar(255) DEFAULT '€', brand VARCHAR(255))", function (err, result) {
        if (err) throw err;
        console.log("table créée ou déjà créée mais connécté quoi qu'il arrive !");
    });
});

app.get("/mybdd", (req, res) => {
    inventory.articles.forEach((article) => {
        var insert = `INSERT INTO articles (title, description, price, currency, brand) VALUES('${article.title}', '${article.description}', '${article.price}', '${article.currency}', '${article.brand}')`;
        console.log("mon insert en bdd", insert);
        db.query(insert, function (err, results) {
            if (err) throw err;
            
            console.log("Elements ajoutés " + article.id);
        });
      }); 
})



app.listen(port, () => {
    console.log("coucou le server tourne" + port);
})
