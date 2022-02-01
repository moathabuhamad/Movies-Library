`use strict`;

const express = require("express");

const app = express();
const myData = require("./Movie Data/data.json");

function MyMovie (title,poster_path,overview){
this.title=title;
this.poster_path=poster_path;
this.overview=overview;
}

app.get("/", indexHandler);
app.get("/favorite", favHandler);

function favHandler(req,res){
    return res.status(200).send("Welcome to Favorite Page");
    }

function indexHandler(req,res){
    let movie = new MyMovie(myData.title,myData.poster_path,myData.overview);
    return res.status(200).json(movie);
}

app.listen(3001,()=>{
    console.log("listening to port 3001");
})