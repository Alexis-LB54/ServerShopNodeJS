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
const nodemailer = require("nodemailer");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "listeDeCourse"
});

// const saltRounds = 2;
// const myPlaintextPassword = 'alexis';
// const someOtherPlaintextPassword = 'not_bacon';

// (async function () {
//     var password = "toto"
//     var user1 = {}
//     bcrypt.hash(password, 2, async function (err, hash) {
//         // Store hash in your password DB.
//         user1 = await prisma.user.create({
//             data: {
//                 email: "tzta@toto.fr",
//                 name: "Toto Le Bail",
//                 password: hash,
//                 role: "ADMIN",
//             },
//         })
//     });

//     const foundUser = prisma.user.findUnique({
//         where : {
//             email: "tutu@toto.fr"
//         }
//     })

//     if (!foundUser) {
//     console.warn("non trouvé");        
//     }

//     var isValid = false;
//     bcrypt.compare(password, foundUser.password, function(err, result) {
//         isValid = result;
//         result && console.log("c'est trouvé");
//     });

//     console.log("voici user", user1);
// })()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.post("/login_check", async (req, res) => {
    var username = req.body.username
    var password = req.body.password
    const foundUser = await prisma.accounts.findMany({
        where: {
            username: username,
        }
    })
    console.log("username :", username, "password :", password);
    // console.log("user a tester :", foundUser);

    if (!foundUser) {
        console.warn("non trouvé");
    }

    console.log("user a vérifier :", foundUser, "mp dans la bdd :", JSON.stringify(foundUser[0]["password"]).replaceAll('"', ''));

    bcrypt.compare(password, JSON.stringify(foundUser[0]["password"]).replaceAll('"', ''), function (err, result) {
        console.log("je suis dans bcrypt  ", "password dans vue :", password, "password dans bd :", JSON.stringify(foundUser[0]["password"]).replaceAll('"', ''), "result :", result);
        // if (result == true) {
        //     res.send("connécté")
        // } else {
        //     res.send("c'est pas les bon id")
        // }

        if (result == true) {
            res.status(300).json({
                token: jwt.sign(
                    {
                        id: foundUser.id,
                        email: foundUser.email,
                        username: foundUser.email,
                    },
                    'RANDOM_TOKEN_SECRET',
                    {
                        expiresIn: '24h',
                    }
                )
            })
        } else {
            res.send("Erreur nous n'avons pas trouvé vos identifiants dans la base de données")
        }

    });

})

app.post("/signup", async (req, res) => {

    var username = req.body.username
    var password = req.body.password
    var email = req.body.email

    console.log("email :", email, "username :", username, "password :", password);

    var user1 = {}
    bcrypt.hash(password, 2, async function (err, hash) {
        // Store hash in your password DB.
        user1 = await prisma.accounts.create({
            data: {
                email: email,
                username: username,
                password: hash
            },
        })
    });


    res.send("inscrit")
})

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
    res.send("ajout User in account ok")
})

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.post("/auth", function (request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        db.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                // Authenticate the user
                request.session.loggedin = true;
                request.session.username = username;
                console.log("je suis connecté");
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

app.get("/mail", (req, res) => {
    let email = req.body.email;
    let username = req.body.username;
    // async..await is not allowed in global scope, must use a wrapper
    async function main() {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Alexis LB" <alexis.lebail@laposte.net>', // sender address
            to: email, // list of receivers
            subject: `Hello ${username} ✔`, // Subject line
            text: "Amélie n'a aucune utilité, je veux rentrer à la maison tout de suite", // plain text body
            html: "<b>Au secrous ! Amélie est dengereuse ! C'est une mega giga folle-dingue !</b>", // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }

    main().catch(console.error);
    res.send("mail envoyé");
})



app.listen(port, () => {
    console.log("coucou le server tourne" + port);
})
