const nodemailer = require('nodemailer')

const sendMail = (username, name, email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth : {
            type: 'OAuth2',
            user: 'fatan.aminullah.j@gmail.com',
            clientId:process.env.CLIENT_ID,
            clientSecret:process.env.CLIENT_SECRET,
            refreshToken:process.env.REFRESH_TOKEN
        },
        tls: {
            rejectUnauthorized: false
        }
    })
    
    const mail = {
        from: 'Fatan Aminullah  <fatan.aminullah.j@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Email Verification", // Subject line
        html: `<h1><a href='http://localhost:2000/verify?username=${username}'>Click here to verification</h1>`
    }
    
    transporter.sendMail(mail, (err,res) => {
        if(err) return console.log(err);
        
        console.log("email terkirim");
        
    })
}

module.exports = {sendMail}