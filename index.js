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

/// jwt Middlewares


 const gateMan = (req, res, next)=>{
    console.log('Called: ', req.method, req.url, req.hostname, req.originalUrl);
    next()
 }

 const verifyToken=(req, res, next)=>{
    const token = req.cookies?.token;
    console.log('Token in the middle ware', token);
    if(!token){
        return res.status(401).send({message: 'Unauthorized Uses'});

    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({message: 'Unauthorized user access'})
        }
        req.user= decoded;
        next()
    })
    

 }




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const bannerCollection= client.db('data').collection('banner');
    const assignmentCollection= client.db('data').collection('assignment');


    // Auth jwt related API


    // jwt token
    app.post('/jwt',  async(req, res)=>{
        const user= req.body;
        // console.log(user);
        const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2hr' })
        // console.log(token)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            
        }).send({success: true})
    })


    /// jwt  logout and erase token
    app.post('/logout', async(req, res)=>{
        const user = req.body;
        console.log('logged out', user)
        res.clearCookie('token', {maxAge: 0 }).send({success: true})
    })

   


    

    // /// Assignment related 

    // Banner's data 
    app.get('/banners', async(req, res)=>{
        const cursor =await bannerCollection.find().toArray();
        res.send(cursor);
    })

    // Assignments data

    app.post('/createassignments', async(req, res)=>{
        const query= req.body;
        console.log(query);
        const result= await assignmentCollection.insertOne(query);
        res.send(result);
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



