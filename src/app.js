import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"

//API's structure configurations
const app= express()
app.use(cors())
app.use(express.json())
dotenv.config()

//Mongo Database configurantions and setup
let db
const mongoclient= new MongoClient(process.env.DATABASE_URL)
mongoclient.connect().then(()=> db=mongoclient.db())
mongoclient.connect().catch((er)=>console.log(er.message))



app.post("/participants",(req,res)=>{
    const {name} = req.name;
    let now= dayjs()
    db.collection("participants").insertOne({name:name, lastStatus: Date.now()})
    .then(participants => {res.sendStatus(201);db.collection("messages").insertOne({from: name, to: 'Todos', text: 'entra na sala...', type:'status', time: now.format("HH:mm:ss")})
    .then(messages => res.sendStatus(201))
    .catch(err=>console.log(err.message))})
    .catch(err=> console.log(err.message))
})
app.post("/messages",(req,res)=> {
    const {to,text,type}= req.body;
    const user= req.headers.user;
    let now= dayjs()
    db.collection("messages").insertOne({from: user, to: to, text: text, type: type, time:now.format("HH:mm:ss")})
    .then(messages => res.sendStatus(201))
    .catch(err=> console.log(err.message))

})

app.post("/status",(req,res) => {
    const user=req.headers.user;
    if (!user){
        res.sendStatus(404)
    }
    else{
        db.collection("participants").findOne({name: user})
        .then(participants => participants.lastStatus= Date.now())
        .catch(err => res.sendStatus(404))
    }
})


app.get("/participants",(req,res) => {
    db.collection("participants").find().toArray()
    .then(participants => res.send(participants))
    .catch(err=> console.log(err.message))
})
//app.get("/messages",(req,res))



app.listen(5000, () => console.log("Servidor rodando"))
