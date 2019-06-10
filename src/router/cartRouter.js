const router = require('express').Router()
const conn = require('../connection/connection')

//add to cart
router.post('/cart/add',(req,res) => {
    const data = req.body
    const sql = `SELECT * FROM shopping_cart WHERE user_id = ${data.user_id} AND product_id = ${data.product_id}`
    const sql2 = `INSERT INTO shopping_cart SET ?`
    const sql3 = `SELECT * FROM shopping_cart WHERE user_id = ${data.user_id}`

    conn.query(sql, (err,result) => {
        if (err) return res.send(err.message)
        
        if(result.length !== 0) return res.status(400).send("Sudah ada di cart")
        
        conn.query(sql2, data, (err, result2) => {
            if (err) return res.send(err.sqlMessage);
            
            conn.query(sql3,(err,result3) => {
                if (err) return res.send(err.sqlMessage);
                

                res.send(result3);
            })
            
        });

    })
})

//show cart
router.get(`/cart/:userid`,(req,res) => {
    const sql = ` SELECT p.id,p.product_name,p.price,p.stock,p.image, author_name, s.quantity, p.stock FROM shopping_cart s JOIN products p ON p.id = s.product_id JOIN author a ON a.id = p.author WHERE s.user_id = ${req.params.userid}`

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