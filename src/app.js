import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

const app= express()
app.use(cors())
app.use(express.json())
app.listen(5000)

let db
const mongoclient= new MongoClient("mongodb://localhost27017/dbUOL")
mongoclient.connect().then(()=> db=mongoclient.db())
mongoclient.connect().catch((er)=>console.log(er.message))



app.post("/participants",(req,res))
app.post("/messages",(req,res))
app.post("/status",(req,res))


app.get("/participants",(req,res))
app.get("/messages",(req,res))
