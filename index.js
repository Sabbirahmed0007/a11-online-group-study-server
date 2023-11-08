const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());



// Connecting to MongoDB


const uri = `mongodb+srv://${ process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jlbgmzv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const bannerCollection= client.db('data').collection('banner');


    // Auth jwt related API

    app.post('/jwt',  async(req, res)=>{
        const user= req.body;
        console.log(user);
        const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2hr' })
        console.log(token)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            
        }).send({success: true})
    })

   


    

    // /// Assignment related 

    // Banner's data 
    app.get('/banners', async(req, res)=>{
        const cursor =await bannerCollection.find().toArray();
        res.send(cursor);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res)=>{
    res.send('Hello world! Online group study platform ')
})

app.listen(port, ()=>{
    console.log('Group study is going on ', port);
})



