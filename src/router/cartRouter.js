const router = require('express').Router()
const conn = require('../connection/connection')

//add to cart
router.post('/cart/add',(req,res) => {
    const sql = `INSERT INTO shopping_cart SET ?`
    const data = req.body

    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result)
    })
})

//show cart
router.get(`/cart/:userid`,(req,res) => {
    const sql = ` SELECT p.id,p.product_name,p.price,p.stock,p.image, author_name, s.quantity FROM shopping_cart s JOIN products p ON p.id = s.product_id JOIN author a ON a.id = p.author WHERE s.user_id = ${req.params.userid}`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        result.map(item =>{
            item.image = (`http://localhost:2000/product/images/${item.image}?v=` +Date.now())
        })

        res.send(result)
    })
})

//delete cart
router.delete('/cart/delete/:productid/:userid', (req,res) => {
    const data = req.params
    const sql = `DELETE FROM shopping_cart WHERE product_id = ${data.productid} AND user_id = ${data.userid}`

    conn.query(sql, (err,result) => {
        
        if (err) return console.log(err);
        

        res.send(result)
    })  
})
module.exports = router