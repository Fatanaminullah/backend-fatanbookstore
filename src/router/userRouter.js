const router = require("express").Router();
const bcrypt = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const { sendMail } = require("../email/nodemailer");
const conn = require("../connection/connection");
const multer = require("multer");
const path = require("path"); // Menentukan folder uploads
const fs = require("fs"); // menghapus file gambar

const uploadDir = path.join(__dirname + "/../uploads");
const uploadDirr = path.join(__dirname + '/../images' )

//create users
router.post("/user/register", async (req, res) => {
  // CREATE USER
  var sql = `INSERT INTO user SET ?`; // Tanda tanya akan digantikan oleh variable data
  var data = req.body
  

  // validasi untuk email
  if (!isEmail(req.body.email)) return res.status(400).send("Email is not valid") 
  
  // ubah password yang masuk dalam bentuk hash
  req.body.password = await bcrypt.hash(req.body.password, 8);

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage); // Error pada post data

    // sendVerify(req.body.username, req.body.name, req.body.email)
    sendMail(req.body.username, req.body.email);

    const sql2 = `UPDATE user SET role = '2' WHERE id = ${result.insertId}`;

    conn.query(sql2, (err, result) => {
      if (err) return res.status(400).send(err +"2");

      console.log(result);

      res.send(result);
    });
  });
});
//verify users
router.get("/verify", (req, res) => {
  const username = req.query.username;
  const sql = `UPDATE user SET status = true WHERE username = '${username}'`;
  const sql2 = `SELECT * FROM user WHERE username = '${username}'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    conn.query(sql2, (err, result) => {
      if (err) return res.send(err.sqlMessage);

      res.sendFile(path.join(__dirname + "/verifikasi.html"));
    });
  });
});

//login users
router.post("/users/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT u.id, firstname,lastname,email,password,status,role,birthday,avatar,username,address,kodepos,phone_number,gender, count(s.user_id) AS cart FROM user u LEFT JOIN shopping_cart s ON u.id = s.user_id WHERE username = '${username}' GROUP BY u.id`;

  conn.query(sql, async (err, result) => {
    console.log(username);
    
    if (err) return res.send(err.message + " - 1");

    result.map(item =>{
      item.avatar = (`http://localhost:2000/users/avatar/${item.avatar}?v=` +Date.now())
    })

    const user = result[0];
    
    
    if (!user) return res.status(400).send("User not found");
    
    if (!user.status) return res.status(400).send("Please, verify your email");
    
    const hash = bcrypt.compareSync(password, user.password);
    
    // if (!hash) return res.status(400).send("Wrong password");

    if (user.role !== 2) return res.status(400).send("User Not Found");

    res.send(user);
  });
});
//login admin
router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM user WHERE username = '${username}'`;

  conn.query(sql, async (err, result) => {
    if (err) return res.send(err.message);

   

    const user = result[0];

    if (!user) return res.status(400).send("User not found");

    if (!user.status) return res.status(400).send("Please, verify your email");

    const hash = await bcrypt.compare(password, user.password);

    if (!hash) return res.status(400).send("Wrong password");

    if (user.role !== 1)
      return res
        .status(400)
        .send("Your Account is not registered as an Administrator");

    res.send(user);
  });
});

const storagE = multer.diskStorage({
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.fieldname + path.extname(file.originalname));
  },
  // Destination
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  }
});

const upload = multer({
  storage: storagE,
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

//upload avatar
router.post("/avatar/uploads/:userid", upload.single("avatar"), (req, res) => {
  const sql = `UPDATE user SET avatar  = '${req.file.filename}' WHERE id = '${
    req.params.userid
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send({ filename: req.file.filename });
  });
});

//link avatar
router.get("/users/avatar/:avatar", (req, res) => {
  res.sendFile(`${uploadDir}/${req.params.avatar}`);
});

//get avatar
router.get("/avatar", (req, res) => {
  const sql = `SELECT * FROM user WHERE username = ?`;
  var data = req.body.username;

  conn.query(sql, data, (err, result) => {
    if (err) return res.send(err);
    res.send({
      users: result[0],
      photo: `http://localhost:2000/avatar/${result[0].avatar}`
    });
  });
});
//delete avatar
router.get("/avatar/delete", (req, res) => {
  const sql = `SELECT * FROM user WHERE username = ?`;
  const sql2 = `UPDATE user SET avatar = NULL WHERE username = ?`;
  var data = req.body.username;

  conn.query(sql, data, (err, result) => {
    if (err) return res.send(err);

    fs.unlink(`${uploadDir}/${result[0].avatar}`, err => {
      if (err) throw err;
    });
    conn.query(sql2, data, (err, result) => {
      if (err) return res.send(err);

      res.send("Delete Success");
    });
  });
});
//read profile
router.get("/users/profile/:userid", (req, res) => {
  const data = req.params.userid;

  const sql = `SELECT *, YEAR(CURDATE()) - YEAR(birthday) AS age FROM user WHERE id = '${data}'`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.send(err.message);

    const user = result[0]; // Result berupa array of object

    if (!user) return res.status(400).send("User not found"); // User tidak ditemukan

    res.send({
      user,
      photo: `http://localhost:2000/users/avatar/${user.avatar}`
    });
  });
});

// UPDATE USER
router.patch("/users/:userid", (req, res) => {
  const sql = `UPDATE user SET ? WHERE id = ${req.params.userid}`;
  const sql2 = `SELECT * FROM USER WHERE id = ${req.params.userid}`;
  const data = [req.body];

  conn.query(sql, data, (err, result) => {
    if (err) return res.send(err.message);

    conn.query(sql2, (err, result) => {
      if (err) return res.send(err.message);
      
      res.send(result);
    });
  });
});

//update password
router.patch('/password/:userid',(req,res) => {
  const data = req.body
  const sql = `select password from user where id = ${req.params.userid}`
  
  conn.query(sql, async(err,result) => {
    
    if (err) return res.send(err.message);
    
    const hash = await bcrypt.compare(data.password, result[0].password);
    
    if (!hash) return res.status(400).send("Wrong password");
    
    
    if(data.newpass !== data.confirmpass) res.status(400).send("New Password and confirm password didn't match")
    
    data.confirmpass = await bcrypt.hash(data.confirmpass, 8);
    
    const sql2 = `update user set password = '${data.confirmpass}' where id = ${req.params.userid}`

    conn.query(sql2, (err,result) => {
      if (err) return console.log(err);
      
      
      res.send(result);
    })
  })

})

router.get('/genre/images/:images', (req,res) => {
  res.sendFile(`${uploadDirr}/${req.params.images}`)
})

//show genre user
router.get("/users/genre/:userid", (req, res) => {
  const data = req.params.userid;
  const sql2 = `SELECT g.id,name,genre_image FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${data}`;

  conn.query(sql2, data, (err, result) => {
    if (err) return res.send(err.message);

    result.map(item => {
      item.genre_image = (`http://localhost:2000/genre/images/${item.genre_image}?v=` +Date.now())
    })

    res.send(result);
  });
});

//show user
router.get("/users", (req, res) => {
  const sql = `SELECT user.id,firstname,lastname,username,email,status, r.name AS role_name,birthday,address,k.kodepos,avatar FROM user JOIN tbl_kodepos k ON user.kodepos = k.id JOIN role r ON user.role = r.id`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.mess);

    res.send(result);
  });
});

//add genre user
router.post("/users/addgenre/:userid/:genreid", (req, res) => {
  const data = {};
  const userid = req.params.userid;
  const genreid = req.params.genreid;
  const sql = `SELECT id FROM user WHERE id = '${userid}'`;
  const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
  const sql3 = `SELECT user_id, genre_id FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`;
  const sql4 = "INSERT INTO user_genre SET ?";
  const sql5 = `SELECT * FROM user WHERE id = '${userid}'`;
  const sql6 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);
    if (result.length === 0) return res.status(400).send("User Not Found");

    data.user_id = result[0].id;

    conn.query(sql2, (err, result2) => {
      if (err) res.send(err.sqlMessage);
      if (result2.length === 0) return res.status(400).send("Genre Not Found");

      data.genre_id = result2[0].id;

      conn.query(sql3, (err, result3) => {
        if (err) return res.send(err.sqlMessage);
        if (result3.length !== 0)
          return res.status(400).send("Genre is already choosen");
        conn.query(sql4, data, (err, result4) => {
          if (err) return res.send(err.sqlMessage);

          conn.query(sql5, (err, result5) => {
            if (err) return res.send(err.sqlMessage);

            const user = result5[0];

            conn.query(sql6, (err, result6) => {
              if (err) return res.send(err.sqlMessage);

              res.send({
                user,
                result6
              });
            });
          });
        });
      });
    });
  });
});

//edit genre user
router.patch("/users/editgenre/:userid", (req, res) => {
  const data = {};
  const userid = req.params.userid;
  const genreid = req.body.id;
  const genreidnew = req.body.idnew;
  const sql = `SELECT id FROM user WHERE id = '${userid}'`;
  const sql2 = `SELECT id FROM genre WHERE id = '${genreid}'`;
  const sql3 = `SELECT user_id, genre_id FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`;
  const sql4 = `UPDATE user_genre SET genre_id = '${genreidnew}' WHERE user_id = '${userid}' AND genre_id = '${genreid}'`;
  const sql5 = `SELECT * FROM user WHERE id = '${userid}'`;
  const sql6 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);
    if (result.length === 0) return res.status(400).send("User Not Found");

    data.user_id = result[0].id;

    conn.query(sql2, (err, result2) => {
      if (err) res.send(err.sqlMessage);
      if (result2.length === 0) return res.status(400).send("Genre Not Found");

      data.genre_id = result2[0].id;

      conn.query(sql3, (err, result3) => {
        if (err) return res.send(err.sqlMessage);
        if (result3.length === 0)
          return res.status(400).send("Genre Not Found");
        conn.query(sql4, data, (err, result4) => {
          if (err) return res.send(err.sqlMessage);

          conn.query(sql5, (err, result5) => {
            if (err) return res.send(err.sqlMessage);

            const user = result5[0];

            conn.query(sql6, (err, result6) => {
              if (err) return res.send(err.sqlMessage);

              res.send({
                user,
                result6
              });
            });
          });
        });
      });
    });
  });
});

//delete genre user
router.delete("/users/deletegenre/:userid/:genreid", (req, res) => {
  const userid = req.params.userid;
  const genreid = req.params.genreid;
  const sql = `DELETE FROM user_genre WHERE user_id = '${userid}' AND genre_id = '${genreid}'`;
  const sql2 = `SELECT * FROM user WHERE id = ${userid}`;
  const sql3 = `SELECT name FROM genre g JOIN user_genre ug ON g.id = ug.genre_id WHERE ug.user_id = ${userid}`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    conn.query(sql2, (err, result2) => {
      if (err) return res.send(err.sqlMessage);

      conn.query(sql3, (err, result3) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result3);
      });
    });
  });
});

//kodepos
router.get("/kodepos", (req, res) => {
  const sql = `SELECT * FROM tbl_kodepos`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

//detail address
router.get("/address/:id", (req, res) => {
  const sql = `SELECT * FROM tbl_kodepos WHERE id = '${req.params.id}'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//detail address user
router.get("/user/info/:iduser", (req, res) => {
  const sql = `SELECT address,kelurahan,kecamatan,kabupaten,provinsi,tbl_kodepos.kodepos,tbl_kodepos.id, phone_number FROM user LEFT JOIN tbl_kodepos ON user.kodepos = tbl_kodepos.id WHERE user.id = '${req.params.iduser}'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//show province
router.get("/province", (req, res) => {
  const sql = `SELECT DISTINCT provinsi FROM tbl_kodepos`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//show kabupaten
router.get("/kabupaten/:provinsi", (req, res) => {
  const sql = `SELECT DISTINCT kabupaten FROM tbl_kodepos WHERE provinsi = '${
    req.params.provinsi
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//show kecamatan
router.get("/kecamatan/:kabupaten", (req, res) => {
  const sql = `SELECT DISTINCT kecamatan FROM tbl_kodepos WHERE kabupaten ='${
    req.params.kabupaten
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//show kelurahan
router.get("/kelurahan/:kecamatan", (req, res) => {
  const sql = `SELECT kelurahan FROM tbl_kodepos WHERE kecamatan = '${
    req.params.kecamatan
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});
//show kodepos
router.get("/kodepos/:kelurahan", (req, res) => {
  const sql = `SELECt id,kodepos FROM tbl_kodepos WHERE kelurahan = '${
    req.params.kelurahan
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

module.exports = router;
