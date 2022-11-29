const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()

const port = process.env.PORT || 5001;

const app = express();

// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqp6ngz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//jwt verify function
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized Access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        const categoryCollection = client.db('motoResellar').collection('categories');
        const productsCollection = client.db('motoResellar').collection('allProducts');
        const bookingsCollection = client.db('motoResellar').collection('bookings');
        const usersCollection = client.db('motoResellar').collection('users');

        // this api is for loading 3 types of bike in the home page
        app.get('/category', async (req, res) => {
            const query = {}
            const options = await categoryCollection.find(query).toArray()
            res.send(options)
        })

        // this api for loading category wise product in category:id route
        // this api for loading category wise product in category:id route
        app.get('/category/:id', async (req, res) => {
            let query = {};
            if (req.params.id)
                query = {
                    categoryId: req.params.id,
                }
            const cursor = await productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        // this api for recive data from booking modal to database
        app.post('/bookings', async (req, res) => {
            const booking = req.body
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
        // {MyOrders component} this api for loading data for users from booking collection to see booking list and pay money email wise
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        // db te jodi user thake taile jwttoken ta dibe eijonne ei api
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ acessToken: '' })
        })

        // load all user data to AllUsers component
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        //====================
        // app.get('/users', async (req, res) => {
        //     const name = req.query.name
        //     const query = {}
        //     const options = await usersCollection.filter(user => user.name).toArray(query)
        //     res.send(options);
        // })
        // app.get('/users', async (req, res) => {
        //     let query = {};
        //     if (req.query.name) {
        //         query = {
        //             email: req.query.name
        //         }
        //     }
        //     const cursor = usersCollection.find(query);
        //     const users = await cursor.toArray();
        //     res.send(users);
        // });
        //====================

        //send logged in users data to mongodb {from signup component} role can be set in future
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)

        })

        //make admin apatoto AllUser component
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            // const decodedEmail = req.decoded.email;
            // const query = { email: decodedEmail }
            // const user = await usersCollection.findOne(query);
            // if (user?.role !== 'admin') {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        //make seller api
        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'seller'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        //admin check
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })

        //seller check
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isSeller: user?.role === 'seller' })
        })



    }
    finally {

    }

}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('Moto reseller Server is Running')
})

app.listen(port, () => console.log(`Moto resale Running on ${port}`))
