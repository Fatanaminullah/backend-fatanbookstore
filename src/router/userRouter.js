const router = require('express').Router()
const bcrypt = require('bcryptjs')
const isEmail = require('validator/lib/isEmail')
const {sendMail} = require('../email/nodemailer')
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar
//create users
router.post('/user/register', async (req, res) => { // CREATE USER
    var sql = `INSERT INTO user SET ?;` // Tanda tanya akan digantikan oleh variable data
    var sql2 = `SELECT * FROM user;`
    var data = req.body 

    // validasi untuk email
    if(!isEmail(req.body.email)) return res.send("Email is not valid")
    // ubah password yang masuk dalam bentuk hash
    req.body.password = await bcrypt.hash(req.body.password, 8)

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.sqlMessage) // Error pada post data

        // sendVerify(req.body.username, req.body.name, req.body.email)
        sendMail(req.body.username, req.body.name, req.body.email)

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err) // Error pada select data

            res.send(result)
        })
    })
})
//verify users
router.get('/verify', (req, res) => {
    const username = req.query.username
    const sql = `UPDATE user SET status = true WHERE username = '${username}'`
    const sql2 = `SELECT * FROM user WHERE username = '${username}'`

    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err.sqlMessage)

            res.send('<h1>Verifikasi berhasil</h1>')
        })
    })
})

//login users
router.post('/users/login', (req, res) => { 
    const {username, password} = req.body

    const sql = `SELECT * FROM user WHERE username = '${username}'`

    conn.query(sql, async (err, result) => {
        if(err) return res.send(err.message) 

        const user = result[0] 

        if(!user) return res.send("User not found") 

        if(!user.status) return res.send("Please, verify your email") 

        const hash = await bcrypt.compare(password, user.password) 

        if(!hash) return res.send("Wrong password") 

        res.send(user) 
    })
})

const uploadDir = path.join(__dirname + '/../uploads' )


const storagE = multer.diskStorage({
    
    filename : function(req, file, cb) {
        cb(null, Date.now() + file.fieldname + path.extname(file.originalname))
    }
})

const upstore = multer ({
    storage: storagE,
    limits: {
        fileSize: 10000000 // Byte
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
            return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
        }
        cb(undefined, cb)
    }
})

//upload avatar
router.post('/avatar/uploads', upstore.single('avatar'), (req, res) => {
    const sql = `SELECT * FROM user WHERE username = ?`
    const sql2 = `UPDATE user SET avatar  = '${req.file.filename}' WHERE username = '${req.body.username}'`
    const data = req.body.username
    
    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err)
        
        conn.query(sql2, (err , result) => {
            if (err) return res.send(err)
            
            res.send({filename: req.file.filename})
        })
    })
})

//delete avatar
router.get('/avatar/delete', (req,res) => {
    const sql = `SELECT * FROM user WHERE username = ?`
    const sql2 = `UPDATE user SET avatar = NULL WHERE username = ?`
    var data = req.body.username

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err)

        fs.unlink(`${uploadDir}/${result[0].avatar}`, (err) => {
            if(err) throw err
        })
        conn.query(sql2, data ,(err , result) => {
            if (err) return res.send(err)

            res.send("Delete Success")
        })
    })

})

//get avatar
router.get('/avatar', (req,res) => {
    const sql = `SELECT * FROM user WHERE username = ?`
    var data = req.body.username
    
    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err)
        res.send({
            users:result[0],
            photo: `http://localhost:2000/avatar/${result[0].avatar}`
        })
    })
})
//link avatar
router.get('/avatar/:avatarId', (req,res) => {
    res.sendFile(`${uploadDir}/${req.params.avatarId}`)
})
//read profile
router.get('/users/profile', (req,res) => {
    
    const data = req.body.username

    const sql = `SELECT * FROM user WHERE username = '${data}'`


    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.message)

        const user = result[0] // Result berupa array of object

        if(!user) return res.send("User not found") // User tidak ditemukan

        res.send({
            user,
            photo: `http://localhost:2000/avatar/${result[0].avatar}`
})
        
    })
})

// UPDATE USER
router.patch('/users/:userid', (req, res) => { 
    const sql = `UPDATE users SET ? WHERE id = ?`
    const data = [req.body, req.params.userid]

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)

        res.send(result)
    })
})

//show genre user
router.get('/users/genre/:userid',(req,res) => {
    const data = req.params.userid
    const sql = `SELECT * FROM user WHERE ?`;
    const sql2 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${data}`;

    conn.query(sql,data, (err,result) => {
        if (err) return res.send(err.mess)

        const user = result[0]
        conn.query(sql2,data, (err,result) => {
            res.send({
                user,
                result
            })
        })
    })
})

//add genre user
router.post('/users/addgenre/:userid', (req,res) => {
    const data = {}
    const userid = req.params.userid
    const genreid = req.body.id
    const sql = `SELECT id FROM user WHERE id = '${userid}'`;
    const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
    const sql3 = `SELECT user_id, genre_id FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`
    const sql4 = 'INSERT INTO user_genre SET ?';
    const sql5 = `SELECT * FROM user WHERE id = '${userid}'`;
    const sql6 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;


    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)
        if(result.length === 0) return res.status(400).send("User Not Found")
        
        data.user_id = result[0].id

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
    
                        const user = result5[0]
                        
                        conn.query(sql6, (err,result6) => {
                            if(err) return res.send(err.sqlMessage)
    
                            res.send({
                                user,result6
                            })
                        })
                    })
                })
            })

        })
})
})

//edit genre user
router.patch('/users/editgenre/:userid', (req,res) => {
    const data = {}
    const userid = req.params.userid
    const genreid = req.body.id
    const genreidnew = req.body.idnew
    const sql = `SELECT id FROM user WHERE id = '${userid}'`;
    const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
    const sql3 = `SELECT user_id, genre_id FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`
    const sql4 = `UPDATE user_genre SET genre_id = '${genreidnew}' WHERE user_id = '${userid}' AND genre_id = '${genreid}'`
    const sql5 = `SELECT * FROM user WHERE id = '${userid}'`;
    const sql6 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;


    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)
        if(result.length === 0) return res.status(400).send("User Not Found")
        
        data.user_id = result[0].id

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
    
                        const user = result5[0]
                        
                        conn.query(sql6, (err,result6) => {
                            if(err) return res.send(err.sqlMessage)
    
                            res.send({
                                user,result6
                            })
                        })
                    })
                })
            })

        })
})
})

//delete genre user
router.delete('/users/deletegenre/:userid', (req,res) => {
    const userid = req.params.userid
    const genreid = req.body.id
    const sql = `DELETE FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`
    const sql2 = `SELECT * FROM user WHERE id = ${userid}`;
    const sql3 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;

    conn.query(sql, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result2) => {
            if(err) return res.send(err.sqlMessage)
            
            conn.query(sql3, (err,result3) => {
                if(err) return res.send(err.sqlMessage)

                res.send(result3)

            })
        })
    })
})



module.exports = router