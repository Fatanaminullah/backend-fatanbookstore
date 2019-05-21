const router = require('express').Router()
const bcrypt = require('bcryptjs')
const isEmail = require('validator/lib/isEmail')
const {sendMail} = require('../email/nodemailer')
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar

//add product
router.post('/products/add', (req,res) => {
    sql = `INSERT INTO products SET ?`
    sql2 =  `SELECT * FROM products`
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result) => {
            if(err) return res.send(err.sqlMessage)
            
            res.send(result)
        })
    })
})
//show all product
router.get('/products', (req,res) => {
    sql = `SELECT * FROM products`
    
    conn.query(sql, (err,result) => {
        if(err) return res.send(err.sqlMessage)

        res.send(result)
    })
})
//edit product
router.patch('/products/edit/:idproduct', (req,res) => {
    const data = [req.body, req.params.idproduct]
    const sql = `UPDATE products SET ? WHERE id = ?`
    const sql2 = `SELECT * FROM products WHERE id = ${data[1]}`

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)
        console.log(result);
        
        
        conn.query(sql2, (err,result) => {
            if (err) return res.send(err.mess)

            res.send(result)
        })

    })
})

//show genre product
router.get('/product/genre/:idproduct',(req,res) => {
    const data = req.params.idproduct
    const sql = `SELECT * FROM products WHERE id=${data}`;
    const sql2 = `SELECT name FROM genre g JOIN product_genre pg ON g.id = pg.genre_id WHERE pg.product_id = ${data}`;

    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.mess)

        console.log(result[0]);
        

        const product = result[0]
        conn.query(sql2,data, (err,result2) => {
            res.send({
                product,
                result2
            })
        })
    })
})

//add genre product
router.post('/product/addgenre/:idproduct', (req,res) => {
    const data = {}
    const idproduct = req.params.idproduct
    const genreid = req.body.id
    const sql = `SELECT id FROM products WHERE id = '${idproduct}'`;
    const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
    const sql3 = `SELECT product_id, genre_id FROM product_genre WHERE product_id = '${idproduct}' AND genre_id = '${genreid}'`
    const sql4 = 'INSERT INTO product_genre SET ?';
    const sql5 = `SELECT * FROM products WHERE id = '${idproduct}'`;
    const sql6 = `SELECT name FROM genre g JOIN product_genre ug ON g.id = ug.genre_id WHERE ug.product_id = ${idproduct}`;


    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)
        if(result.length === 0) return res.status(400).send("product Not Found")
        
        data.product_id = result[0].id

        conn.query(sql2, (err, result2) => {
            if(err) res.send(err.sqlMessage)
            if(result2.length === 0) return res.status(400).send("Genre Not Found")
            
            data.genre_id = result2[0].id

            conn.query(sql3, (err,result3) => {
                if(err) return res.send(err.sqlMessage)
                if(result3.length !== 0) return res.status(400).send("Genre is already choosen")
                conn.query(sql4, data, (err, result4) => {
                    if(err) return res.send(err.sqlMessage)
    
                    conn.query(sql5, (err, result5) => {
                        if(err) return res.send(err.sqlMessage)
    
                        const product = result5[0]
                        
                        conn.query(sql6, (err,result6) => {
                            if(err) return res.send(err.sqlMessage)
    
                            res.send({
                                product,result6
                            })
                        })
                    })
                })
            })

        })
})
})

//edit genre product
router.patch('/product/editgenre/:idproduct', (req,res) => {
    const data = {}
    const idproduct = req.params.idproduct
    const genreid = req.body.id
    const genreidnew = req.body.idnew
    const sql = `SELECT id FROM products WHERE id = '${idproduct}'`;
    const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
    const sql3 = `SELECT product_id, genre_id FROM product_genre WHERE product_id = '${idproduct}' AND genre_id = '${genreid}'`
    const sql4 = `UPDATE product_genre SET genre_id = '${genreidnew}' WHERE product_id = '${idproduct}' AND genre_id = '${genreid}'`
    const sql5 = `SELECT * FROM products WHERE id = '${idproduct}'`;
    const sql6 = `SELECT name FROM genre g JOIN product_genre ug ON g.id = ug.genre_id WHERE ug.product_id = ${idproduct}`;


    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)
        if(result.length === 0) return res.status(400).send("product Not Found")
        
        data.product_id = result[0].id

        conn.query(sql2, (err, result2) => {
            if(err) res.send(err.sqlMessage)
            if(result2.length === 0) return res.status(400).send("Genre Not Found")
            
            data.genre_id = result2[0].id

            conn.query(sql3, (err,result3) => {
                if(err) return res.send(err.sqlMessage)
                if(result3.length === 0) return res.status(400).send("Genre Not Found")
                conn.query(sql4, data, (err, result4) => {
                    if(err) return res.send(err.sqlMessage)
    
                    conn.query(sql5, (err, result5) => {
                        if(err) return res.send(err.sqlMessage)
    
                        const product = result5[0]
                        
                        conn.query(sql6, (err,result6) => {
                            if(err) return res.send(err.sqlMessage)
    
                            res.send({
                                product,result6
                            })
                        })
                    })
                })
            })

        })
})
})

//delete genre product
router.delete('/product/deletegenre/:idproduct', (req,res) => {
    const idproduct = req.params.idproduct
    const genreid = req.body.id
    const sql = `DELETE FROM product_genre WHERE product_id = '${idproduct}' AND genre_id = '${genreid}'`
    const sql2 = `SELECT * FROM products WHERE id = ${idproduct}`;
    const sql3 = `SELECT name FROM genre g JOIN product_genre ug ON g.id = ug.genre_id WHERE ug.product_id = ${idproduct}`;

    conn.query(sql, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result2) => {
            if(err) return res.send(err.sqlMessage)

            const product = result2[0]
            
            conn.query(sql3, (err,result3) => {
                if(err) return res.send(err.sqlMessage)
                
                res.send({product,result3})
                
            })
        })
    })
})

//product by genre
router.get('/products/:genre',(req,res) => {
    const data = req.query.name
    const sql = `SELECT id FROM genre WHERE name = '${data}'`
    
    
    conn.query(sql, (err,result) => {
        
        const genreid = result[0].id
        console.log(genreid);
        
        const sql2 = `SELECT * FROM products p JOIN product_genre pg ON p.id = pg.product_id WHERE pg.genre_id = ${genreid}`
        
        conn.query(sql2, (err,result2) => {
            if(err) return res.send(err.sqlMessage)
            
            res.send(result2)
        })
        
    })
})

//product by user genre
router.get("/product/recommended", (req, res) => {
    const data = req.body.id;
    const sql = `SELECT * FROM products p JOIN product_genre pg ON p.id = pg.product_id WHERE pg.genre_id IN(SELECT genre_id FROM user_genre WHERE user_id = ${data})`;
    conn.query(sql, (err, result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
      });
});


module.exports = router