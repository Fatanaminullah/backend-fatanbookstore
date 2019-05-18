
const express = require('express')
const userRouter = require('./router/userRouter')
const productRouter = require('./router/productRouter')

const ex = express()
const port = process.env.PORT

ex.get('/', (req,res) => {
    res.send(`<h1>API runnning on ${port}</h1>`)
})

ex.use(express.json())
ex.use(userRouter)
ex.use(productRouter)

ex.listen(port, () => {
    console.log("Running at ", port);
    
})