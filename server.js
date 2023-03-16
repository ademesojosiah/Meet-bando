const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server,{cors:{}})

app.set('view engine','ejs')
app.set('views','views')


io.on('connection',(socket)=>{
    console.log('connected to socket')

    const introMessage = `
        Select 1 to Place an order<br>
        Select 99 to checkout order<br>
        Select 98 to see order history<br>
        Select 97 to see current order<br>
        Select 0 to cancel order
    `
    socket.emit('message',introMessage)



    socket.on('disconnect',()=>{
        console.log('disconnected');
    })
})

app.get('/home',(req,res)=>{
    res.render('home')
})
server.listen(3003,()=>{
    console.log('server is running.......');
})