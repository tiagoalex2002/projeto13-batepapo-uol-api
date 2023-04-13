import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"

//API's structure configurations
const app= express()
app.use(cors())
app.use(express.json())
app.listen(5000, () => console.log("Servidor rodando"))
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
    .then(participants => db.collection("messages").insertOne({from: name, to: 'Todos', text: 'entra na sala...', type:'status', time: now.format("HH:mm:ss")})
    .then(messages => res.sendStatus(201))
    .catch(err=>console.log(err.message)))
    .catch(err=> console.log(err.message))
})
app.post("/messages",(req,res)=> {
    const {to,text,type}= req.body;

})
app.post("/status",(req,res))


app.get("/participants",(req,res) => {
    db.collection("participants").find().toArray()
    .then(participants => res.send(participants))
    .catch(err=> console.log(err.message))
})
app.get("/messages",(req,res))
