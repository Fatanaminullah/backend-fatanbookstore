const express = require('express')
const cors = require("cors");
const userRouter = require('./router/userRouter')
const productRouter = require('./router/productRouter')
const genreRouter = require('./router/genreRouter')
const cartRouter = require('./router/cartRouter')
const orderRouter = require('./router/orderRouter')
const bankRouter = require('./router/bankRouter')

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
ex.use(cartRouter)
ex.use(orderRouter)
ex.use(bankRouter)

ex.listen(port, () => {
    console.log("Running at ", port);
    
})