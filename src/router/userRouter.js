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

        if(!user.verified) return res.send("Please, verify your email") 

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

router.patch('/users/:userid', (req, res) => { // UPDATE USER
    const sql = `UPDATE users SET ? WHERE id = ?`
    const data = [req.body, req.params.userid]

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)

        res.send(result)
    })
})



module.exports = router