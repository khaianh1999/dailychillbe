const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const sql = require('mssql');
const { poolPromise, sql } = require('../config/db');
const jwt = require("jsonwebtoken");


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI,
  }, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const fullName = profile.displayName;
    const id_fb = profile.id;
  
    try {
    const pool = await poolPromise;
      let result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM users WHERE email = @email');
  
      if (result.recordset.length === 0) {
        const avatar = "uploads/avatar.jpg";
        const coin = 0;
        const code = generateRandomUppercaseCode(8);

        await pool.request()
          .input('email', sql.VarChar, email)
          .input('full_name', sql.NVarChar, fullName)
          .input('password', sql.VarChar, null)
          .input('id_fb', sql.NVarChar, id_fb)
          .input('avatar', sql.NVarChar, avatar)
          .input('coin', sql.Int, coin)
          .input('code', sql.NVarChar, code)
          .query('INSERT INTO users (email, full_name, password, id_fb, avatar, coin, code) VALUES (@email, @full_name, @password, @id_fb, @avatar, @coin, @code)');
        
        // Lấy lại user vừa tạo
        result = await pool.request()
          .input('email', sql.VarChar, email)
          .query('SELECT * FROM users WHERE email = @email');
      }
  
      const user = result.recordset[0];
      done(null, user); // truyền sang route callback
    } catch (err) {
      done(err, null);
    }
}));

function generateRandomUppercaseCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Chỉ chứa chữ cái in hoa và số
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
