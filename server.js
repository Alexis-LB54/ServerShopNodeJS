const express = require("express");
var inventory = require("./inventory.json")
const fs = require('fs')
var cors = require('cors')
var bodyParser = require('body-parser');
var app = express()
const port = "96"

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

app.listen(port, () => {
    console.log("coucou le server tourne" + port);
})