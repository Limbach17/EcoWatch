var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;


var app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

var MONGODB_URI = process.envMONGODB_URI || "mongodb://localhost/EcoWatch";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape", function(req, res) {

  axios.get("http://www.ahs.dep.pa.gov/NewsRoomPublic/").then(function(response) {
    
    var $ = cheerio.load(response.data);

    $("div[style='font-weight:bold;']").each(function(i, element) {

      var titleBlock = $(element).parentsUntil("div.ContentWidth").children("div.nrListingTitle");
      var result = {};  

      result.title = titleBlock
      .children("a")
      .text();
      result.link = titleBlock
      .children("a")
      .attr("href");
      result.date = titleBlock
      .children("span")
      .text();
      result.preview = $(element)
      .children("span")
      .text();
    
      db.Article.create(result)
        .then(function(dbArticle) {
       
          console.log(dbArticle);
        })
        .catch(function(err) {
      
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  
  db.Article.find({})
    .then(function(dbArticle) {
     
      res.json(dbArticle);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});


app.get("/articles/:id", function(req, res) {
 
  db.Article.findOne({ _id: req.params.id })
 
    .populate("note")
    .then(function(dbArticle) {
    
      res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});


app.post("/articles/:id", function(req, res) {
 
  db.Comment.create(req.body)
    .then(function(dbComment) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbComment._id }, { new: true });
    })
    .then(function(dbArticle) {
   
      res.json(dbArticle);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});


app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
