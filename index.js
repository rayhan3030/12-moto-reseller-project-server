const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5001;

const app = express();

// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqp6ngz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoryCollection = client.db('motoResellar').collection('categories');
        const productsCollection = client.db('motoResellar').collection('allProducts');

        app.get('/category', async (req, res) => {
            const query = {}
            const options = await categoryCollection.find(query).toArray()
            res.send(options)
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