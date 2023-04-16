import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"
import joi from "joi"

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



app.post("/participants",async (req,res)=>{
    const participant= req.body
    const  participantSchema= joi.object({
        name: joi.string().required()
    })
    const participants = {name: participant, lastStatus: Date.now()}
    const validation= participantSchema.validate(participant)
    if(validation.error){
        return res.sendStatus(422)
    }
    try{
        await db.collection("participants").findOne({name: name})
         res.sendStatus(409)
    } catch(err){
        console.log(err.message)
    }
    let now= dayjs()
    db.collection("participants").insertOne(participants)
    .then(participants => {db.collection("messages").insertOne({from: req.body.name, to: 'Todos', text: 'entra na sala...', type:'status', time: now.format("HH:mm:ss")})
    .then(messages => res.sendStatus(201))
    .catch(err=>console.log(err.message))})
    .catch(err=> console.log(err.message))
})
app.post("/messages", async (req,res)=> {
    const message= req.body;
    const user= req.headers.user;
    const messageSchema= joi.object({
        to: string().required(),
        text:string().required(),
        type: string().required("message" || "private_message")
    })
    const validate= messageSchema.validate(req.body)
    if(validate.error){
        return res.sendStatus(422)
    }
    try{
        await db.collection("participants").findOne({name: user})
         res.sendStatus(409)
    } catch(err){
        console.log(err.message)
    }
    let now= dayjs()
   try{
        await  db.collection("messages").insertOne({from: user, to: req.body.to, text: req.body.text, type: re.body.type, time:now.format("HH:mm:ss")})
        res.sendStatus(201)
   } catch(err){
    console.log(err.message)
   }

})

app.post("/status", async (req,res) => {
    const name=req.headers.user;
    let lastStatus= Date.now()
    const usuarioEditado = { name, lastStatus }
    if (!name){
        return res.sendStatus(404)
    }
    else{
        try{
            await db.collection("participants").findOne({name: name})
        } catch(err){
            res.sendStatus(404)
        }
        try{
            await db.collection("participants").updateOne({name: name}, {$set: usuarioEditado })
            res.sendStatus(200)

        } catch(err){
            res.sendStatus(404)
        }
    }
})


app.get("/participants",(req,res) => {
    db.collection("participants").find().toArray()
    .then(participants => res.send(participants))
    .catch(err=> console.log(err.message))
})

app.get("/messages",(req,res)=>{
    const user= req.headers.user;
    const limit = parseInt(req.query.limit);
    db.collection("messages").find({to:"Todos"}).toArray().then(messages=> res.send(messages))
    db.collection("messages").find({to:user}).toArray().then(messages=> res.send(messages))
    db.collection("messages").find({from:user}).toArray().then(messages=> res.send(messages))
})


//Métodos Bônus - Delete e Put
app.delete("/messages/ID_DA_MENSAGEM",async (req,res) =>{
    const user= req.headers.user;
    const {ID_DA_MENSAGEM} = req.params;
    try{
        await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)})
    } catch(err){
        res.sendStatus(404)
    }
    try{
        await db.collection("messages").deleteOne({_id: new ObjectId(ID_DA_MENSAGEM)})
        res.sendStatus(200)
    } catch(err){
        res.sendStatus(401)
    }
})

app.put("/messages/ID_DA_MENSAGEM", async (req, res) => {
    const {to, type, text}= req.body
    const {ID_DA_MENSAGEM} = req.params;
    const user= req.headers.user;
    const usuarioEditado= {to, type, text}


    try{
        await db.collection("messages").findOne({_from: user})
    } catch(err){
        res.sendStatus(401)
    }

    try{
        await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)})
    } catch(err){
        res.sendStatus(404)
    }
    try{
        await db.collection("messages").updateOne({to: to, type: type, text: text}, {$set : usuarioEditado})
        res.sendStatus(200)
    } catch(err){
        res.sendStatus(401)
    }
})



app.listen(5000, () => console.log("Servidor rodando"))
