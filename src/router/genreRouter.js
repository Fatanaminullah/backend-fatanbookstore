const router = require('express').Router()
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads

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

router.get('/genre/images/:images', (req,res) => {
    res.sendFile(`${uploadDir}/${req.params.images}`)
})
//show genre
router.get('/genre/:userid',(req,res) => {
    const sql = `SELECT * FROM genre  WHERE id NOT IN(SELECT g.id FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${req.params.userid})`
    
    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        result.map(item => {
            item.genre_image = (`http://localhost:2000/genre/images/${item.genre_image}?v=` +Date.now())
        })
        
        
        res.send(result)
    })
})
//show al genre
router.get('/genre',(req,res) => {
    const sql = `SELECT * FROM genre `
    
    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        result.map(item => {
            item.genre_image = (`http://localhost:2000/genre/images/${item.genre_image}?v=` +Date.now())
        })
        
        
        res.send(result)
    })
})
//add genre
router.post('/genre/add', upload.single('images'), (req,res) => {
    sql = `INSERT INTO genre SET ?`
    sql3 =  `SELECT * FROM genre`
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)

        const sql2 = `UPDATE genre SET genre_image  = '${req.file.filename}' WHERE id = '${result.insertId}'`
        
        conn.query(sql2, (err,result2) => {
            if(err) return res.send(err.sqlMessage)
            
            conn.query(sql3,(err,result3) => {
                if(err) return res.send(err.sqlMessage)

                res.send(result3)
            })
        })
    })
})
//edit genre
router.patch('/genre/edit/:genreid', upload.single('genre_image'),(req,res) => {
    const data = [req.body,req.params.genreid]
    const sql = `UPDATE genre SET ? WHERE id = ?`
    const sql2 = `UPDATE genre SET genre_image  = '${req.file.filename}' WHERE id = '${data[1]}'` 
    const sql3 = `SELECT * FROM genre`

    console.log(data);
    

    
    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        conn.query(sql2,(err,result) => {
            if (err) return res.send(err.sqlMessage);
            
            conn.query(sql3,(err,result) => {
                if (err) return res.send(err.sqlMessage);
    
                res.send(result)
                console.log(result);
                
            })
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
router.get('/genreproducts',(req,res) => {
    const sql = `SELECT pg.id,product_name,name FROM product_genre pg JOIN products p ON p.id = pg.product_id JOIN genre g ON g.id = pg.genre_id`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        console.log(result);
        
        res.send(result)
    })
})
//genre users
router.get('/genreusers',(req,res) => {
    const sql = `SELECT u.id,username,name FROM user_genre ug JOIN user u ON u.id = ug.user_id JOIN genre g ON g.id = ug.genre_id WHERE u.role = 2`

    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        res.send(result)
    })
})

//genre not user
router.get('/genrenotuser/:userid',(req,res) => {
    const sql = `SELECT * FROM genre WHERE id NOT IN(SELECT id FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${req.params.userid})`
    
    conn.query(sql,(err,result) => {
        if (err) return res.send(err.sqlMessage);
        
        res.send(result)
    })
})

module.exports = router