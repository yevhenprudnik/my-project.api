const express = require('express');
const cors = require('cors');
let port = process.env.PORT || 3000;
const knex = require('knex');


    const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'jekaprudnik',
        password : '',
        database : 'my-project'
    }
});

const app = express();
app.use(express.json());
app.use(cors());
const database = {
    users: [
        {
            id: '123',
            name: 'John',
            email: 'john@example.com',
            password: '1903', 
            entries: 0,
            joined: new Date()
        }
    ]
}

app.get('/', (req, res) => {
    res.json(database)
})

app.post('/signIn', (req, res) => {
    db.select('email', 'password').from('login')
    .where('email', '=', req.body.email)
    .then(data =>{
        if (req.body.password === data[0].password) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(404).json('not found'))
        }
    })
    .catch(err => res.status(404).json('not found'))
})

app.post('/register', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    if(name && email && password){
        db.transaction(trx => {
            trx.insert({
                password: password,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                .returning('*')
                .insert({
                    name: name,
                    email: loginEmail[0].email,
                    joined: new Date()
                })
                .then(user => {
                    res.json(user[0])
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(404).json('unique'))
    }
    else{
        res.status(404).json('no');
    }
})


app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user => {
        if(user.length){
            res.json(user[0]);
        }
        else{
            res.status(404).json('not found')
        }
    })
    // if(!find){
    //     res.status(404).json('not found')
    // }
})

app.put('/click', (req, res) => {
    let id = req.body.id;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(404).json('not found'));
})

app.listen(port, () =>{
    console.log(`listening on port ${port}`);
});