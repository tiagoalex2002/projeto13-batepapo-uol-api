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
    try{
        const us= await db.collection("participants").findOne({name: req.body.name})
        if(us){
            return res.sendStatus(409)
       }
    } catch(err){
        console.log(err.message)
    }
    let now= dayjs()
    try{
        await db.collection("participants").insertOne({name: req.body.name, lastStatus: Date.now()})
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
    if(!user){
        return res.sendStatus(422)
    }
    const messageSchema= joi.object({
        to: joi.string().required(),
        text:joi.string().required(),
        type: joi.string().valid('private_message','message').required()
    })
    const validate= messageSchema.validate(req.body)
    if(validate.error){
        return res.sendStatus(422)
    }
    try{
        let us= await db.collection("participants").findOne({name: user})
        if(!us){return res.sendStatus(422)}
    } catch(err){
        console.log(err.message)
   }
    let now= dayjs()
   try{
        await  db.collection("messages").insertOne({from: user, to: req.body.to, text: req.body.text, type: req.body.type, time:now.format("HH:mm:ss")})
        return res.sendStatus(201)
   } catch(err){
    console.log(err.message)
   }

})

app.post("/status", async (req,res) => {
    const {user}=req.headers;
    let lastStatus= Date.now()
    const usuarioEditado = { name: user, lastStatus }
    if (!user){
        return res.sendStatus(404)
    }
    else{
        try{
            const u=await db.collection("participants").findOne({name: user})
            if (!u){
                return res.sendStatus(404)
            }
        } catch(err){
            console.log(err.message)
        }
        try{
            await db.collection("participants").updateOne({name: user}, {$set: usuarioEditado })
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

app.get('/messages', async (req, res) => {
    const { user } = req.headers;
    const limit = req.query.limit;
    try {
      if (limit) {
        if (limit <= 0 || isNaN(limit)) {
          return res.sendStatus(422);
        }
        let messages = await db
          .collection('messages')
          .find({ $or: [{ to: 'Todos' }, { to: `${user}` }, { from: `${user}` }] })
          .toArray();
        const newmens = messages.slice(messages.length - limit, messages.length);
        return res.status(200).send(newmens);
      } else {
        let messages = await db
          .collection('messages')
          .find({ $or: [{ to: 'Todos' }, { to: `${user}` }, { from: `${user}` }] })
          .toArray();
        return res.status(200).send(messages);
      }
    } catch (err) {
      console.log(err.message);
    }
  });

//Métodos Bônus - Delete e Put
app.delete("/messages/:ID_DA_MENSAGEM",async (req,res) =>{
    const {user}= req.headers;
    const {ID_DA_MENSAGEM} = req.params;
    try{
        const men= await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)})
        if (!men){
            return res.sendStatus(404)
        }
        else if(men.from !== user){
            return res.sendStatus(401)
        }
        else{
            res.sendStatus(200)
        }
    } catch(err){
        console.log(err.message)
    }

    try{
        await db.collection("messages").deleteOne({_id: new ObjectId(ID_DA_MENSAGEM)})
    } catch(err){
        console.log(message)
    }
})

app.put("/messages/:ID_DA_MENSAGEM", async (req, res) => {
    const {to, type, text}= req.body
    const {ID_DA_MENSAGEM} = req.params;
    const {user}= req.headers;
    const usuarioEditado= {to, type, text}

     const messageSchema= joi.object({
        to: joi.string().required(),
        text:joi.string().required(),
        type: joi.string().valid('private_message','message').required()
    })
    const validate= messageSchema.validate(req.body)
    if(validate.error){
        return res.sendStatus(422)
    }

    try{
        const us=await db.collection("participants").findOne({name: user})
        if(!us){
            return res.sendStatus(422)
        }
       
    } catch(err){
        console.log(err.message)
    }

    try{
       const men= await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)})
       if(!men){ return res.sendStatus(404)}
       else if(men.from !== user){
        return res.sendStatus(401)
       }
    } catch(err){
        console.log(err.message)
    }
    try{
        await db.collection("messages").updateOne({to: to, type: type, text: text}, {$set : usuarioEditado})
        return res.sendStatus(200)
    } catch(err){
        console.log(err.message)
    }
})

//Remoção de usuários inativos

setInterval(async () => {
    let time= Date.now() - 10000
    let now= dayjs()
    try{
        const users= await db.collection("participants").find({ lastStatus: { $lt: time } }).toArray()
        for (let i=0; i< users.length;i++){
            await db.collection("participants").deleteOne({name:users[i].name})
            await db.collection("messages").insertOne({ 
                from: users[i].name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: now.format("HH:mm:ss")
            })
        }

    }catch(err){
        console.log(err.message)
    }}, 15000)



app.listen(5000, () => console.log("Servidor rodando"))
