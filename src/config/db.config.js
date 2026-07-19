import mongoose from "mongoose";

const MONGODB_URI = `mongodb://bhelavevicky66_db_user:vickybhelave123@ac-0vyeinu-shard-00-00.fcgy0ob.mongodb.net:27017,ac-0vyeinu-shard-00-01.fcgy0ob.mongodb.net:27017,ac-0vyeinu-shard-00-02.fcgy0ob.mongodb.net:27017/?ssl=true&replicaSet=atlas-1la0sp-shard-0&authSource=admin&appName=Chat-Bot`;

mongoose.connect(MONGODB_URI).then(()=>{
    console.log("DB Connected")
}).catch((error)=>{
    console.log("something went wrong DB not connected", error)
})
