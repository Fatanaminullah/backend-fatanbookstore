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

  //link image payment
  router.get("/paymentconfirm/:payment", (req, res) => {
    res.sendFile(`${uploadDir}/${req.params.payment}`);
  });


router.post('/orders/:userid',(req,res) => {
    const d = new Date()
    const order_code = `${req.params.userid}${d.getMilliseconds()}${d.getDate()}${d.getMonth()}${d.getFullYear()}${Math.floor((Math.random() * 100) - 1)}`
    // const data = [req.body]
    const sql = `INSERT INTO orders (order_code,user_id,order_status,total,order_destination,order_destination_address) values (${order_code},${req.params.userid},1,${req.body.total},${req.body.order_destination},'${req.body.order_destination_address}')`
    const sql3 = `SELECT * FROM orders`
    const sql2 = `DELETE FROM shopping_cart WHERE user_id = ${req.params.userid}`

    conn.query(sql,(err,result) => {
        if(err) return console.log(err.message+" 1");
        
        const orderid = result.insertId
        
        conn.query(sql2,(err,result2) => {
          if(err) return console.log(err.message+" 2");

          conn.query(sql3,(err,result3) => {
              if(err) return console.log(err.message+ ' 3');
              
              res.send({orderid,result3})
          })
        })
        
    })
})

router.post('/orderitem',(req,res) => {
    const data = req.body
    var results = {}
    data[0].forEach(item =>{
        const sql = `INSERT INTO order_item (product_id,price,quantity,order_id) VALUES (${item})`
        const sql2 = `update products set stock = stock - ${item[2]} where id = ${item[0]}`
        conn.query(sql,[data],(err,result) => {
          if(err) return console.log(err.message);  

          conn.query(sql2, (err,result) => {
            if(err) return console.log(err.message);
            
            result2 = result
          })
            
        })
    })
    res.send(results)
    
})
//get order by user
router.get(`/order/:userid`, (req,res) => {
    const sql = `select o.id, o.order_status, o.order_code, os.order_status_description, o.order_date, o.order_destination, count(o.id) as quantity from orders o join order_status os on o.order_status = os.id join order_item oi on oi.order_id = o.id where user_id = ${req.params.userid} and os.id != 7 group by o.id order by order_date desc;`
    
    conn.query(sql, (err,result) => {
        if(err) return console.log(err.message);

       

        res.send(result)
    })
})
//get order history by user
router.get(`/orderhistory/:userid`, (req,res) => {
    const sql = `select o.order_code, os.order_status_description, o.order_date, o.order_destination, count(o.id) as quantity from orders o join order_status os on o.order_status = os.id join order_item oi on oi.order_id = o.id where user_id = ${req.params.userid} and os.id = 7 group by o.id;`
    
    conn.query(sql, (err,result) => {
        if(err) return console.log(err.message);

       

        res.send(result)
    })
})

//get orderitem by user
router.get(`/orderitem/:ordercode`, (req,res) => {
    const sql = `select p.id,p.product_name,p.price,p.stock,p.image, author_name, oi.quantity from order_item oi join  products p on p.id = oi.product_id left join shopping_cart s on p.id = s.product_id JOIN author a ON a.id = p.author join orders o on o.id = oi.order_id where o.order_code = ${req.params.ordercode}`
    
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
    const sql = `SELECT * FROM orders WHERE order_code = '${req.params.ordercode}'`
    const sql2 = `UPDATE orders SET payment_confirm  = '${req.file.filename}', bank = ${req.body.id} WHERE order_code = '${req.params.ordercode}' AND order_status = 1`;
    const sql3 = `update orders set order_status = 2 where order_code = '${req.params.ordercode}'`
  
    conn.query(sql, (err, result) => {
      if (err) return res.send(err.sqlMessage);
      if(result.length == 0) return res.status(400).send('Order Code Not Found')
      
      
      conn.query(sql2,(err,result2) => {
        if (err) return res.send(err.sqlMessage);

        conn.query(sql3, (err,result3) => {
          if (err) return res.send(err.sqlMessage);
  
          res.send(result3)
        })
      })
      
      
    });
  })
  
  //get notification order
  router.get('/notification/order',(req,res) => {
    const sql = `select o.id,order_status, order_code, u.username, order_date,o.payment_confirm,b.bank_name from orders o join user u  on u.id = o.user_id join bank_ref b on b.id = o.bank where order_status in(2,6);`
    
    conn.query(sql,(err,result) => {
      
      if (err) return res.send(err.sqlMessage);
      
      result.map(item =>{
        item.payment_confirm = (`http://localhost:2000/paymentconfirm/${item.payment_confirm}?v=` +Date.now())
      })
      
      res.send(result)
    })
  })
  
  //user notification
  router.get('/user/notification/:userid',(req,res) => {
    const sql = `select o.id, order_code, u.username, order_date, os.order_status_description from orders o join user u  on u.id = o.user_id join bank_ref b on b.id = o.bank join order_status os on os.id = o.order_status where user_id = ${req.params.userid} and order_status in (1,3,4,5,7) and payment_confirm is not null order by order_date desc;`
    
    conn.query(sql, (err,result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result)
  })
})


//get on going orders
router.get('/orders/ongoing',(req,res) => {
  const sql = `select o.id, o.order_status,order_code, u.username, os.order_status_description,order_date,order_destination,b.bank_name,total,payment_confirm from orders o join user u on u.id = o.user_id join order_status os on os.id = o.order_status join bank_ref b on b.id = o.bank where order_status != 1 and order_status != 7;`
  conn.query(sql,(err,result) => {
    if (err) return res.send(err.sqlMessage);

    result.map(item =>{
      item.payment_confirm = (`http://localhost:2000/paymentconfirm/${item.payment_confirm}?v=` +Date.now())
    })
  
    res.send(result)
  })
})

//get history order
router.get('/historyorder',(req,res) => {
  const sql = `select o.id, order_code, u.username, os.order_status_description,order_date,order_destination,b.bank_name,total,payment_confirm from orders o join user u on u.id = o.user_id join order_status os on os.id = o.order_status join bank_ref b on b.id = o.bank where order_status = 7`
  
  conn.query(sql,(err,result) => {
    if (err) return res.send(err.sqlMessage);
  
    result.map(item =>{
      item.payment_confirm = (`http://localhost:2000/paymentconfirm/${item.payment_confirm}?v=` +Date.now())
    })
  
    res.send(result)
  })
})

//get order status description
router.get('/orderstatus',(req,res) => {
  const sql = `select * from order_status`

  conn.query(sql, (err,result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result)
  })
})

//update status order
router.patch('/updateorder/:orderid',(req,res) => {
  const sql = `update orders set ? where id = ${req.params.orderid}`
  const data = req.body

  conn.query(sql,data, (err,result) => {
    
    if (err) return res.send(err.sqlMessage);

    res.send(result)
  })
})



module.exports = router