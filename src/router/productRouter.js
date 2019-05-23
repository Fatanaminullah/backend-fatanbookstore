const router = require('express').Router()
const bcrypt = require('bcryptjs')
const isEmail = require('validator/lib/isEmail')
const {sendMail} = require('../email/nodemailer')
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar

const uploadDir = path.join(__dirname + '/../images' )

const storagE = multer.diskStorage({
    
    filename : function(req, file, cb) {
        cb(null, Date.now() + file.fieldname + path.extname(file.originalname))
    },
    // Destination
    destination : function(req, file, cb) {
        cb(null, uploadDir)
    }
})

const upload = multer ({
    storage: storagE,
    limits: {
        fileSize: 100000000 // Byte
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
            return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
        }
        cb(undefined, cb)
    }
})

//add product
router.post('/products/add', upload.single('images'), (req,res) => {
    const sql = `INSERT INTO products SET ?`
    
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        const sql2 = `UPDATE products SET image  = '${req.file.filename}' WHERE id = '${result.insertId}'`
        
        conn.query(sql2, (err,result2) => {
            if(err) return res.send(err.sqlMessage)

            const sql3 =  `SELECT * FROM products WHERE id = '${result.insertId}'`
            
            conn.query(sql3, (err,result3) => {
                if(err) return res.send(err.sqlMessage)
                
                res.send(result3)
            })
        })


    })
})
//link images
router.get('/product/images/:images', (req,res) => {
    res.sendFile(`${uploadDir}/${req.params.images}`)
})
//show all product
router.get('/products', (req,res) => {
    const sql = `SELECT p.id,product_name,stock,price,page,a.author_name,ps.publisher_name, image FROM products p JOIN author a ON a.id = p.author JOIN publisher ps ON ps.id = p.publisher`
    
    
    
    conn.query(sql, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        console.log(result);

        var images = []
        result.map(item =>{
            item.image = (`http://localhost:2000/product/images/${item.image}?v=` +Date.now())
        })

        console.log(result )
        
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
router.post('/product/addgenre', (req,res) => {
    const data = [req.body]
    
    const sql = `SELECT product_id, genre_id FROM product_genre WHERE product_id=${data[0].product_id} AND genre_id=${data[0].genre_id}`
    const sql2 = 'INSERT INTO product_genre SET ?';
    const sql3 = `SELECT * FROM product_genre`;

            conn.query(sql,data, (err,result) => {
                if(err) return res.send(err.sqlMessage)
                if(result.length !== 0) return res.status(400).send("Genre is already choosen")
                conn.query(sql2, data, (err, result2) => {
                    if(err) return res.send(`result2 : ${err.sqlMessage} ${data[0].product_id}`)
    
                    conn.query(sql3, (err, result3) => {
                        if(err) return res.send(err.sqlMessage)
    
                        res.send(result3)

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

//show author
router.get('/author',(req,res) => {
    const sql = `SELECT * FROM author`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
    })
})
//edit author
router.patch('/author/edit/:authorid',(req,res) => {
    const sql = `UPDATE author SET ? WHERE id = ?`
    const data = [req.body, req.params.authorid]

    conn.query(sql,data,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
    })
})
//add author
router.post('/author/add', (req,res) => {
    sql = `INSERT INTO author SET ?`
    sql2 =  `SELECT * FROM author`
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result) => {
            if(err) return res.send(err.sqlMessage)
            
            res.send(result)
        })
    })
})
//add publisher
router.post('/publisher/add', (req,res) => {
    sql = `INSERT INTO publisher SET ?`
    sql2 =  `SELECT * FROM publisher`
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result) => {
            if(err) return res.send(err.sqlMessage)
            
            res.send(result)
        })
    })
})
//edit publisher
router.patch('/publisher/edit/:publisherid',(req,res) => {
    const sql = `UPDATE publisher SET ? WHERE id = ?`
    const data = [req.body, req.params.publisherid]

    conn.query(sql,data,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
    })
})
//show publisher
router.get('/publisher',(req,res) => {
    const sql = `SELECT * FROM publisher`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
    })
})


module.exports = router