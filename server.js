const express = require("express");
const multer  = require("multer");
const bodyParser = require('body-parser');
const path = require("path")
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/")
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

function checkFileType(file, cb){
  const filetypes = /jpeg|png|jpg|gif/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if(mimetype && extname){
    return cb(null,true)
  } else {
    cb("Carica solo immagini")
  }
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  }
}).any()

// scelgo di puntare alla porta
const port = process.env.PORT || 8081;

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: false}))

// Per settare template engine
app.set("view engine", "ejs");

// Accesso alla cartella public
app.use(express.static("public"));

app.get("/", (req, res) => {
  let images = []
  fs.readdir("./public/uploads/", (err, files) => {
    if(!err){
      files.forEach(file => {
        images.push(file);
      })
      res.render("index", { images: images})
    } else {
      console.log(err)
    }
  });  
})

app.get("/about", (req, res) => {
  let images = []
  fs.readdir("./public/uploads/", (err, files) => {
    if(!err){
      files.forEach(file => {
        images.push(file);
      })
      res.render("about", { images: images})
    } else {
      console.log(err)
    }
  });  
})

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if(!err && req.files != "") { 
      res.status(200).send()
    } else if (!err && req.files == ""){
      res.statusMessage = "Seleziona immagini da caricare ";
      res.status(400).end()
    } else {
      res.statusMessage = (err === "Carica solo immagini" ? err : "Hai superato il limite di 1MB") ;
      res.status(400).end()
    }
  })  
})

app.put("/delete", (req, res) => {
  const deleteImages = req.body.deleteImages

  if(deleteImages == ""){
    res.statusMessage = "Seleziona immagini da cancellare";
    res.status(400).end()
  } else {
    deleteImages.forEach( image => {
      unlinkFile("./public/uploads/" + image);
    })
    res.statusMessage = "Cancellato correttamente";
    res.status(200).end()
  }
})

// Run server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
