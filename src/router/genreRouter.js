const router = require('express').Router()
const conn = require('../connection/connection')

//show genre
router.get('/genre',(req,res) => {
    const sql = `SELECT * FROM genre`
    
    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        res.send(result)
    })
})
//edit genre
router.patch('/genre/edit/:genreid',(req,res) => {
    const sql = `UPDATE genre SET ? WHERE id = ?`
    const sql2 = `SELECT * FROM genre`

    const data = [req.body,req.params.genreid]
    
    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        conn.query(sql2,(err,result) => {
            if (err) return res.send(err.sqlMessage);

            res.send(result)
        })
        
    })
})
//edit genre products
router.patch('/genreproducts/edit/:id',(req,res) => {
    const sql = `UPDATE product_genre SET ? WHERE id = ?`
    const sql2 = `SELECT * FROM product_genre`

    const data = [req.body,req.params.id]
    
    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        conn.query(sql2,(err,result) => {
            if (err) return res.send(err.sqlMessage);

            res.send(result)
        })
        
    })
})
//genre products
router.get('/genre/products',(req,res) => {
    const sql = `SELECT pg.id,product_name,name FROM product_genre pg JOIN products p ON p.id = pg.product_id JOIN genre g ON g.id = pg.genre_id`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result)
    })
})
//genre users
router.get('/genre/users',(req,res) => {
    const sql = `SELECT u.id,username,name FROM user_genre ug JOIN user u ON u.id = ug.user_id JOIN genre g ON g.id = ug.genre_id`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result)
    })
})

module.exports = router