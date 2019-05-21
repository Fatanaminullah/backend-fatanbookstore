const express = require('express')
const cors = require("cors");
const userRouter = require('./router/userRouter')
const productRouter = require('./router/productRouter')
const genreRouter = require('./router/genreRouter')

const ex = express()
const port = process.env.PORT

ex.get('/', (req,res) => {
    res.send(`<h1>API runnning on ${port}</h1>`)
})

ex.use(cors())
ex.use(express.json())
ex.use(userRouter)
ex.use(productRouter)
ex.use(genreRouter)

ex.listen(port, () => {
    console.log("Running at ", port);
    
})