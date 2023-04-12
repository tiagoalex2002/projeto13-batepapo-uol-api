import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

//API's structure configurations
const app= express()
app.use(cors())
app.use(express.json())
app.listen(5000)
dotenv.config()

//Mongo Database configurantions and setup
let db
const mongoclient= new MongoClient()
mongoclient.connect().then(()=> db=mongoclient.db())
mongoclient.connect().catch((er)=>console.log(er.message))



app.post("/participants",(req,res))
app.post("/messages",(req,res))
app.post("/status",(req,res))


app.get("/participants",(req,res))
app.get("/messages",(req,res))
