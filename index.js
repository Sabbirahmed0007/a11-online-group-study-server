const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const featuresCollection= client.db('data').collection('featuresdata');
    const faqCollection= client.db('data').collection('faq');


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

    // Features data
    app.get('/features', async(req, res)=>{
        const query = await featuresCollection.find().toArray();
        res.send(query);
    })

    // faq collection
    app.get('/faqs', async(req, res)=>{
        const query = await faqCollection.find().toArray();
        res.send(query);
    })

    // Assignments data

    app.get('/allassignments', async(req, res)=>{
        const page= parseInt(req.query.page);
        const size= parseInt(req.query.size);
        console.log('pagination query', req.query)
        const difficultyLevel = req.query.level;

        const query = difficultyLevel ? { level: difficultyLevel } : {}; 
        
        const cursor = await assignmentCollection.find(query).skip(page * size).limit(size).toArray();
        res.send(cursor);


        // const cursor= await assignmentCollection.find().skip(page * size).limit(size).toArray();
        // res.send(cursor);
    })


    /// Pagination data

    app.get('/assignmentCount', async(req, res)=>{
        const count =await assignmentCollection.estimatedDocumentCount();
        res.send({count});

    })



    // individual users's all assignment data
    app.get('/myassignments', async(req, res)=>{
        
        let query={};
        if(req.query?.email){
            query= {email: req.query?.email}
        }
        const result = await assignmentCollection.find(query).toArray();
        res.send(result);
    })

    // single data for updating
    app.get('/singleassignment/:id', async(req, res)=>{


        const id= req.params.id;
        console.log(id)
        const query={ _id : new ObjectId(id)};
        const result=await assignmentCollection.findOne(query);
        console.log(result);
        res.send(result);
    })
        //create Assignment
    app.post('/createassignments', async(req, res)=>{
        const query= req.body;
        console.log(query);
        const result= await assignmentCollection.insertOne(query);
        res.send(result);
    })

    //Update the assignment data
    app.put('/updateassignment/:id', async(req, res)=>{

        const id= req.params.id;
        const filter={_id: new ObjectId(id)};
        const options= {upsert:true};
        const updatedData= req.body;
        const currentData={
            $set:{
                title: updatedData.title,
                email: updatedData.email,
                description: updatedData.description,
                img: updatedData.img,
                level: updatedData.level,
                marks: updatedData.marks,
                date: updatedData.date

            }
        }
        const result= await assignmentCollection.updateOne(filter, currentData, options)
        res.send(result);

    })

    // // Delete assignment
    // app.delete('/allassignment/:id', async(req, res)=>{
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)};
    //     const result= await assignmentCollection.deleteOne(query);
    //     res.send(result);

    // })

    // Delete assignment
app.delete('/allassignment/:id',gateMan, verifyToken, async (req, res) => {
    const id = req.params.id;
    const userEmail = req.user.email;
    const query = { _id: new ObjectId(id), email: userEmail };
    try {
        const result = await assignmentCollection.deleteOne(query);
        if (result.deletedCount > 0) {
            res.send({ success: true, message: 'Assignment deleted successfully' });
        } else {
            res.status(404).send({ success: false, message: 'Assignment not found or unauthorized' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});





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



