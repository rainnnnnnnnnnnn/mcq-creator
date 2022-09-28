const router = require('express').Router()
const e = require('express')
const passport = require('passport')
const genPassword = require('../lib/passwordUtils').genPassword
const connection = require('../config/database')

const User = connection.models.User
const Test = connection.models.Test
const Score = connection.models.Score
//--------------------------------------------------POST--------------------------------------------------------
router.post('/login',
    passport.authenticate('local', {
        failureRedirect: './login',
        successRedirect: './profile'
}))

router.post('/register', (req, res, next) => {
    const saltHash = genPassword(req.body.password)

    //check if user already exists
    User.findOne({username: req.body.username})
        .then((user) => {
            if(!user) {
                const newUser = new User({
                    full_name: req.body.full_name,
                    username: req.body.username,
                    salt: saltHash.salt,
                    hash: saltHash.hash,
                    role: req.body.role
                })
                newUser.save()
            } else {
                console.log("User already exists")
            }
        })
        .catch((err) => console.log(err))

    res.redirect('./home')
})

router.post('/create-test', (req, res, next) => {
    if(req.isAuthenticated()) {
        //req.body
        let test_id = '';
        const ingredient = '0AaBbCc1DdEeFf2GgHhIi3JjKkLl4MmNnOo5PpQqRr6SsTtUu7VvWwXx8YyZz9'
        for(let i=0; i<15; i++) {
            let index = Math.random()*62;
            test_id+=ingredient.charAt(index);
        }
        let test_name = req.body[0]
        req.body.shift()
        
        const newTest = new Test({
            test_id: test_id,
            test_name: test_name,
            created_by: req.user.username,
            questions: req.body,
            given_by: 0
        })

        newTest.save()
    } else res.redirect('./login')
})

router.post('/take-test', (req, res, next) => {
    if(!req.isAuthenticated()) {
        res.redirect('./login')
        return
    }
    
    //get test from db
    let substance = "";
    Score.findOne({test_id: req.body.test_id,submitted_by: req.user.username})
        .then((score) => {
            if(!score) {
                Test.findOne({test_id: req.body.test_id})
                    .then((test) => {
                        if(!test) {
                            res.send(`<h3>Invalid test id</h3>`)
                        } else {
                            let num = 1;
                            test.questions.forEach((item) => {
                                let tag_ques = 
                                    `<div class="ques">
                                        <h3>${num + ". " + item.statement}</h3>
                                        <fieldset style="border: none">
                                            <input type="radio" id="${num}A" name="${num}ans" value="${item.options[0]}" required>
                                            <label for="${num}A">${item.options[0]}</label><br>
                                            <input type="radio" id="${num}B" name="${num}ans" value="${item.options[1]}" required>
                                            <label for="${num}B">${item.options[1]}</label><br>
                                            <input type="radio" id="${num}C" name="${num}ans" value="${item.options[2]}" required>
                                            <label for="${num}C">${item.options[2]}</label><br>
                                            <input type="radio" id="${num}D" name="${num}ans" value="${item.options[3]}" required>
                                            <label for="${num}D">${item.options[3]}</label><br>
                                        </fieldset>
                                    </div>
                                    `
                                
                                substance = substance.concat(tag_ques)
                                num++;
                            })

                            //send to user
                            const form = `
                            <head>
                                <meta charset="utf-8">
                                <title>Take test</title>
                                <link rel="preconnect" href="https://fonts.googleapis.com">
                                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap" rel="stylesheet">
                                <link rel="stylesheet" href="styles-test.css">
                            </head>
                            <body>
                                <div class="test-container">
                                    <h4>${test.test_name} <br><br> ${test.test_id}</h4>
                                    <form method="POST" action="test-eval">
                                        <input type="text" name="test_id" value="${req.body.test_id}" hidden>
                                        ${substance}
                                        <input id="sbmt" type="submit" value="Submit Test">
                                    </form>
                                </div>
                                <script defer>
                                    window.history.forward()
                                </script>
                            </body>`

                            res.send(form)
                        }   
                    }).catch((err) => console.log(err))
            } else {
                res.send("<h3>No further attempts allowed</h3><a href='./profile'>Profile")
            }
        })
})

router.post('/test-eval', (req, res, next) => {
    if(!req.isAuthenticated()) {
        res.redirect('./login')
        return
    }

    let answers_submitted = req.body
    let score = 0

    Score.findOne({test_id:req.body.test_id, submitted_by: req.user.username})
        .then((item) => {
            if(!item) {                  
                //find test, caluclate score, add in score db
                Test.findOne({test_id: req.body.test_id})
                .then((test) => {
                    let i = 1
                    while(answers_submitted[`${i}ans`]) {
                        if(answers_submitted[`${i}ans`] == test.questions[i-1].options[test.questions[i-1].answer.charCodeAt(0)-65]) score+=1

                        i++
                    }
                    score+=`/${i-1}`

                    let newScore = new Score({
                        test_id: req.body.test_id,
                        test_name: test.test_name,
                        submitted_by: req.user.username,
                        score: score
                    })
                    
                    newScore.save()
                }).catch((err) => console.log(err))


                //Update
                Test.updateOne({test_id: req.body.test_id}, {$inc: {given_by: 1}})
                    .then()
                    .catch((err) => console.log(err))
            }
        })

    res.redirect('./profile')
})

// router.post('/details', (req, res, next) => {
//     if(req.isAuthenticated()) res.send(OKKK)
// })

//--------------------------------------------------GET---------------------------------------------------------

router.get('/home', (req, res, next) => {
    res.sendFile("home.html", {root: "static_files"})
})

router.get('/register', (req, res, next) => {
    res.sendFile("register.html", {root: "static_files"})
})

router.get('/login', (req, res, next) => {  
    if(req.isAuthenticated()) {
        res.redirect('/profile')
    }else res.sendFile("login.html", {root: "static_files"})
})

router.get('/protected-route', (req, res, next) => {
    if(req.isAuthenticated()) {
        res.send('<h1>You are authenticated</h1><p> <a href="/logout">Logout and reload</a></p>')
    }else res.send('<h1>You are not authenticated</h1><a href="/login">Login</a></p>')
})

router.get('/profile', (req, res, next) => {
    if(req.isAuthenticated()) {
        //check role
        let substance = ""
        if(req.user.role==="Instructor") {
            //get the tests created by the user
            Test.find({created_by: req.user.username})
                .then((test) => {
                    if(test) {
                        test.forEach((item) => {
                            substance+=`<tr>
                                <td><h3>${item.test_id}</h3></td>
                                <td><h3>${item.test_name}</h3></td>
                                <td><h3>${item.given_by}</h3></td>
                            </tr>`
                        })
    
                        //send to client
                        res.send(`
                        <head>
                            <meta charset="utf-8">
                            <title>${req.user.username}'s Profile | Quizzer</title>
                            <link rel="preconnect" href="https://fonts.googleapis.com">
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                            <link href="https://fonts.googleapis.com/css2?family=Lato&family=Montserrat:wght@500&family=Open+Sans:wght@500&display=swap" rel="stylesheet">
                            <link rel="stylesheet" href="styles-profile.css">
                        </head> 
                        <body>
                            <div class="header">
                                <img src="guy.png">
                                <h2>Hi, ${req.user.username}<h2>
                                <a href="./create-test">Create test</a>
                                <a href="./logout">Logout</a>
                            </div>
                            <div class="table-bg">
                                <table>
                                    <tr class="col_names">
                                        <td><h3>TEST ID</h3></td>
                                        <td><h3>NAME</h3></td>
                                        <td><h3>#given</h3></td>
                                    </tr>
                                    ${substance}
                                </table>
                            </div>  
                            <script defer>
                                let a = document.getElementsByTagName('a')[0]
                                a.addEventListener('click', (e) => {
                                    if(localStorage.getItem('Test')) {
                                        if(confirm('Do you want to discontinue creating the previous test?')) {
                                            localStorage.clear();
                                        }
                                    }
                                })

                                let rows = document.getElementsByTagName('tr')
                                Array.from(rows).forEach((row) => {
                                    row.addEventListener("click", () => {
                                        fetch('http://localhost:3000/details', {
                                            method: 'POST',
                                            body: row.innerText.split("\\n")[0],
                                            headers: {
                                                'Content-type': 'application/json; charset=UTF-8'
                                            }
                                        })
                                        .then(console.log("OK"))
                                    })
                                })
                            </script>
                        </body>`)}
                    }
                )
            } else {
                Score.find({submitted_by: req.user.username})
                    .then((score) => {
                        if(score) {
                            score.forEach((item) => {
                                substance+=`<tr><td><h3>${item.test_name}</h3></td><td><h3>${item.score}</h3></td></tr>`
                            })

                            //send to client
                            res.send(`
                                <head>
                                    <meta charset="utf-8">
                                    <title>${req.user.username}'s Profile | Quizzer</title>
                                    <link rel="preconnect" href="https://fonts.googleapis.com">
                                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                                    <link href="https://fonts.googleapis.com/css2?family=Lato&family=Montserrat:wght@500&family=Open+Sans:wght@500&display=swap" rel="stylesheet">
                                    <link rel="stylesheet" href="styles-profile.css">
                                </head>
                                <body>
                                    <div class="header">
                                        <img src="guy.png">
                                        <h2>Hi, ${req.user.username}<h2>
                                        <a href="./logout">Log Out</a>
                                    </div>
                                    <div class="main-container">
                                        <div class="table-container">
                                            <div class="table-bg">
                                                <table>
                                                    <tr class="col_names">
                                                        <td><h3>NAME</h3></td>
                                                        <td><h3>SCORE</h3></td>
                                                    </tr>
                                                    ${substance}
                                                </table>
                                            </div>
                                        </div>
                                        <div class="form-container">
                                            <div class="form-bg">
                                                <form method="POST" action="take-test">
                                                    <div class="text_field">
                                                        <input type="text" name="test_id" required>
                                                        <span></span>
                                                        <label>Enter test ID</label>
                                                    </div>
                                                    <input type="submit" value="Start test">
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </body>
                            `)
                        }
                    })
            }
        
    }else {
        res.send('<h1>You are not authenticated</h1><p> <a href="/login">Login</a></p>')
    }
})

router.get('/create-test', (req, res, next) => {
    if(req.isAuthenticated()) {
        if(req.user.role==="Instructor") res.sendFile("create-test.html", {root: "static_files"})
        else res.redirect('./profile')
    } else res.redirect('./login')
})

router.get('/take-test', (req, res, next) => {
    res.redirect('/login')
})

router.get('/logout', (req, res, next) => {
    req.logout((err) =>
        console.log(err)
    )
    res.redirect('./login')
})

//
module.exports = router