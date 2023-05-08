import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;
const __dirname = path.resolve();
const server = http.createServer(app);
const io = new Server(server);

// Add a new array to keep track of active rooms
const activeRooms = [];

// Link the templating engine to the express app
app.set('view engine', 'hbs');
app.set('views', 'views');


app.use(express.static(__dirname + '/static')); //Css, images en javascript
app.use('/', express.static(__dirname + '/'));

app.engine('hbs', handlebars.engine({
    layoutsDir: __dirname + '/views/layouts',
    extname: 'hbs',
    defaultLayout: 'index',
    partialsDir: __dirname + '/views/partials'
}));

app.get('/', (req, res) => {
    res.render('main', { layout: 'index' });
})

app.get("/room/:roomNumber", (req, res, next) => {
    const { roomNumber } = req.params;
    console.log(roomNumber)
    console.log(io.sockets.adapter.rooms)

    // Check if the room is active
    if (!activeRooms.includes(roomNumber)) {
        console.log("Heb even gekeken, maar dit roomnummer staat niet in de array")
        // If the room does not exist, render an error page or redirect the user
        // return res.render("error", { layout: "index", message: "Room not found" });
    }

    // If the room exists, render the room page with the room number passed as a parameter
    res.render("room", { layout: "index", roomNumber });
});


// app.get("/quiz", async (req, res) => {
//     try {
//       const response = await fetch("https://the-trivia-api.com/questions?limit=10");
//       console.log('response: ' + response)
//       const data = await response.text(); // convert the response to a string
//       console.log('data: ' + data)
//       const questions = JSON.parse(data); // parse the string into JSON
//         console.log('questions: ' + questions)


//       res.json({ question: questions[0].question });
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send("An error occurred while retrieving the questions.");
//     }
// });



io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on("createRoom", (room) => {
        console.log(socket.rooms);
        const roomNumber = room;
        socket.join(roomNumber);
        console.log(socket.rooms);
        console.log(`Room ${roomNumber} created`);
    
        // Add the room to the activeRooms array
        activeRooms.push(roomNumber);
        console.log('activeRooms updated', activeRooms);
    
        // Emit the roomCreated event only to the socket that triggered the createRoom event
        socket.emit("roomCreated", roomNumber);
    });

    socket.on("joinRoom", ({ username, roomNumber }) => {
        // Check if the room is active
        const socketRooms = socket.rooms;
        console.log('joinRoom', socketRooms);
        if (activeRooms.includes(roomNumber)) {
            console.log(`User ${username} joined room ${roomNumber}`);
            socket.join(`${roomNumber}`);
            socket.emit("roomJoined", { roomNumber, username });
        } else {
            console.log(`Room ${roomNumber} does not exist`);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

