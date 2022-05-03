const express = require("express");
var inventory = require("./inventory.json")
const fs = require('fs')
var cors = require('cors')
var bodyParser = require('body-parser');
var app = express()
const port = "96"
const mysql = require('mysql');
const csvtojson = require('csvtojson');
const session = require('express-session');

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
        console.log("table articles créée ou déjà créée mais connécté quoi qu'il arrive !");
    });
    db.query("CREATE TABLE IF NOT EXISTS informations(id INT AUTO_INCREMENT PRIMARY KEY, compagnie_name VARCHAR(255) NOT NULL, number_of_employees INT, turnover INT)", function (err, result) {
        if (err) throw err;
        console.log("table informations créée ou déjà créée mais connécté quoi qu'il arrive !");
    });
    db.query("CREATE TABLE IF NOT EXISTS accounts(id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL)", function (err, result) {
        if (err) throw err;
        console.log("table accounts créée ou déjà créée mais connécté quoi qu'il arrive !");
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

//pour supprimer un élément
app.delete("/delete/:id", (req, res) => {
    const id = req.params.id
    console.log("mon id d'article à supprimer:", id)
    let articleFound = {}
    
    const findId = (article) => article.id == id;
    
    let MyIndex = inventory.articles.findIndex(findId);
    console.log(MyIndex);

    inventory.articles.splice(MyIndex, 1);
    
    fs.writeFileSync("./inventory.json", JSON.stringify(inventory))
    res.json(articleFound);
})

// CSV file name
const fileName = "tableau.csv";

// csvtojson().fromFile(fileName).then(source => {
    
//     // Fetching the data from each row 
//     // and inserting to the table "tableau"
//     for (var i = 0; i < source.length; i++) {
//         var Name = source[i]["Nom"],
//         Employees = source[i]["Nombre de salarié"],
//         CA = source[i]["CA (Chiffre d’affaire) en €"]
  
//         var insertStatement = `INSERT INTO informations(compagnie_name, number_of_employees, turnover) VALUES (?, ?, ?)`;
//         var items = [Name, Employees, CA];
  
//         // Inserting data of current row
//         // into database
//         db.query(insertStatement, items, 
//             (err, results, fields) => {
//                 if (err) {
//                 console.log(
//                     "Unable to insert item at row ", i + 1);
//                 return console.log(err);
//             }
//         });
//     }
//     console.log(
// "All items stored into database successfully");
// });


// système de connection
app.get("/myuser", (req, res) => {
    var insert2 = `INSERT INTO accounts (username, password, email) VALUES ('alexis', 'alexis', 'alexis@alexis.eu')`;
    db.query(insert2, function (err, results) {
        if (err) throw err;
        console.log("User ajouté");
    });
})

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.post("/auth", function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		db.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
                console.log("user connecté");
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


app.listen(port, () => {
    console.log("coucou le server tourne" + port);
})
