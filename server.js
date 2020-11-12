const express = require("express")
const mongoose = require("mongoose")
const Pusher = require("pusher");
const cors = require("cors")
const Messages = require("./dbMessages")

const pusher = new Pusher({
  appId: "1106074",
  key: "165dc3f631c8929e67ee",
  secret: "5a83a14b7d8bef4ab6a5",
  cluster: "ap1",
  useTLS: true
});


const app = express()
const port = process.env.PORT || 9000

app.use(express.json())
app.use(cors())

const user_db = "admin"
const password_db = "WQ0kPvJM6n8UN9k3"
const name_db = "whatsappdb"
const connection_url = `mongodb+srv://${user_db}:${password_db}@cluster0.jy10a.mongodb.net/${name_db}?retryWrites=true&w=majority`

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection

db.once("open", () => {
  console.log("DB Connected")

  const msgCollection = db.collection("messagecontents")
  const changeStream = msgCollection.watch()

  changeStream.on("change", (change) => {
    console.log("on change",change)

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received
      })
    } else {
      console.log("Error triggering Pusher")
    }
  })
})

app.get("/", (req, res) => {
  res.status(200).send("Hello World")
})


app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  })
})

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  })
})

app.listen(port, () => console.log(`Listening on localhost:${port}`))
