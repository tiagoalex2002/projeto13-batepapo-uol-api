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
    const  participantSchema= joi.object({
        name: joi.string().required()
    })
    const validation= participantSchema.validate(req.body)
    if(validation.error){
        return res.sendStatus(422)
    }
    //try{
        //let us= await db.collection("participants").findOne({name: req.body.name})
        //if(us != {}){
            //res.status(409).send("Usuário já cadastrado")
       // }
    //} catch(err){
    //}
    let now= dayjs()
    try{
        await db.collection("participants").insertOne({name: req.body.name, lastStatus: Date.now()})
        res.sendStatus(201)
    }catch(err){
        console.log(err.message)
    }
    try{
        await db.collection("messages").insertOne({from: req.body.name, to: 'Todos', text: 'entra na sala...', type:'status', time: now.format("HH:mm:ss")})
        return res.sendStatus(201)
    }catch(err){
        console.log(err.message)
    }

})
app.post("/messages", async (req,res)=> {
    const user= req.headers.user;
    const messageSchema= joi.object({
        to: joi.string().required(),
        text:joi.string().required(),
        type: joi.string().required()
    })
    const validate= messageSchema.validate(req.body)
    if(validate.error){
        return res.sendStatus(422)
    }
    //try{
      //  await db.collection("participants").findOne({name: user})
      //   res.sendStatus(409)
    //} catch(err){
       // console.log(err.message)
   // }
    let now= dayjs()
   try{
        await  db.collection("messages").insertOne({from: user, to: req.body.to, text: req.body.text, type: req.body.type, time:now.format("HH:mm:ss")})
        return res.sendStatus(201)
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

app.get("/messages", async (req,res)=>{
    const user= req.headers.user;
    const limit = parseInt(req.query.limit);
    let newmens=[]
    if (!limit){
        try{
            let messages= await db.collection("messages").find({to:"Todos"} || {to:user} || {from:user}).toArray()
            return res.status(200).send(messages)
        } catch(err){
            console.log(err.message)
        }
    }
    else if( limit === 0 || limit < 0 || typeof limit != "number"){
        return res.sendStatus(422)
    }
    else{
        try{
            let messages= await db.collection("messages").find({to:"Todos"} || {to:user} || {from:user}).toArray()
            if (messages.length >= limit){
                for(let i=0; i < limit;i++){
                    newmens.push(messages[i])
                }
            }
            return res.status(200).send(newmens)
        } catch(err){
            console.log(err.message)
        }
    }
    
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
