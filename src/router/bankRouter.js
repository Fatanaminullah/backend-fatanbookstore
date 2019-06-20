const router = require('express').Router()
const conn = require('../connection/connection')

router.get(`/bank`, (req,res) => {
    const sql = `select * from bank_ref`
    
    conn.query(sql, (err,result) => {
        if(err) return console.log(err.message);

        res.send(result)
    })
})

//edit author
router.patch('/bank/edit/:bankid',(req,res) => {
    const sql = `UPDATE bank SET ? WHERE id = ?`
    const data = [req.body, req.params.authorid]

    conn.query(sql,data,(err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
    })
})
//add bank
router.post('/bank/add', (req,res) => {
    sql = `INSERT INTO bank_ref SET ?`
    sql2 =  `SELECT * FROM bank_ref`
    data = req.body

    conn.query(sql,data, (err,result) => {
        if(err) return res.send(err.sqlMessage)
        
        conn.query(sql2, (err,result) => {
            if(err) return res.send(err.sqlMessage)
            
            res.send(result)
        })
    })
})

module.exports = router