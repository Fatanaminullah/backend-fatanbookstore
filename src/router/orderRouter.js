const router = require('express').Router()
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar

const uploadDir = path.join(__dirname + '/../paymentConfirm' )

const storages = multer.diskStorage({
    filename: function(req, file, cb) {
      cb(null, Date.now() + file.fieldname + path.extname(file.originalname));
    },
    // Destination
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    }
  });
  
  const upload = multer({
    storage: storages,
    limits: {
      fileSize: 10000000 // Byte
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        // will be error if the extension name is not one of these
        return cb(new Error("Please upload image file (jpg, jpeg, or png)"));
      }
      cb(undefined, cb);
    }
  });


router.post('/orders/:userid',(req,res) => {
    const d = new Date()
    const order_code = `${req.params.userid}${d.getMilliseconds()}${d.getDate()}${d.getMonth()}${d.getFullYear()}${Math.floor((Math.random() * 100) - 1)}`
    // const data = [req.body]
    const sql = `INSERT INTO orders (order_code,user_id,order_status) values (${order_code},${req.params.userid},1)`
    const sql3 = `SELECT * FROM orders`

    conn.query(sql,(err,result) => {
        if(err) return console.log(err.message+" 1");

        const orderid = result.insertId
        
            conn.query(sql3,(err,result3) => {
                if(err) return console.log(err.message+ ' 3');
                
                res.send({orderid,result3})
            })
    })
})

router.post('/orderitem',(req,res) => {
    const data = req.body
    var results = {}
    data[0].forEach(item =>{
        const sql = `INSERT INTO order_item (product_id,price,quantity,order_id) VALUES (${item})`
        conn.query(sql,[data],(err,result) => {
            
            if(err) return console.log(err.message);
            
            result2 = result
        })
    })
    res.send(results)
    
})
//get order by user
router.get(`/order/:userid`, (req,res) => {
    const sql = `select o.order_code, os.order_status_description, o.order_date, o.order_destination, count(o.id) as quantity from orders o join order_status os on o.order_status = os.id join order_item oi on oi.order_id = o.id where user_id = ${req.params.userid} group by o.id;`
    
    conn.query(sql, (err,result) => {
        if(err) return console.log(err.message);

       

        res.send(result)
    })
})

//get orderitem by user
router.get(`/orderitem/:ordercode`, (req,res) => {
    const sql = `select p.id,p.product_name,p.price,p.stock,p.image, author_name, oi.quantity from order_item oi join  products p on p.id = oi.product_id join shopping_cart s on p.id = s.product_id JOIN author a ON a.id = p.author join orders o on o.id = oi.order_id where o.order_code = ${req.params.ordercode}`
    
    conn.query(sql, (err,result) => {
        if(err) return console.log(err.message);

        result.map(item =>{
            item.image = (`http://localhost:2000/product/images/${item.image}?v=` +Date.now())
        })
        
        res.send(result)
    })
})

//upload payment
router.post("/payment/uploads/:ordercode", upload.single("payment_confirmation"), (req, res) => {
    const sql = `UPDATE orders SET payment_confirm  = '${req.file.filename}', bank = ${req.body.id} WHERE order_code = '${req.params.ordercode}' AND order_status = 1`;
    const sql2 = `update orders set order_status = 2 where order_code = '${req.params.ordercode}'`
  
    conn.query(sql, (err, result) => {
      if (err) return res.send(err.sqlMessage);
      
      conn.query(sql2, (err,result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result)
      })

    });
})

module.exports = router