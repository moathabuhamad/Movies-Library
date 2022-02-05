`use strict`;

const express = require(`express`);
const axios = require("axios");
const dotEnv = require("dotenv");
dotEnv.config();
const PORT = process.env.PORT;
const APIKEY = process.env.APIKEY;
const movieData = require("./Movie Data/data.json");
const app = express();
const pg = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
/* const client = new pg.Client(DATABASE_URL); */
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
app.use(express.json());

function Movie(id, title, release_date, posterPath, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = posterPath;
  this.overview = overview;
}

app.get("/", homeHandler);
app.get("/favorite", favoriteHandler);
app.get("/trending", trendingHandler);
app.get("/topRatedTv", topRatedTvHandler);
app.get("/tv", tvHandler);
app.get("/search", searchHandler);
app.post("/addMovie", addMovieHandler);
app.get("/getMovies", getMoviesHandler);
app.get("/getMovie/:id", getMovieHandler);
app.put("/UPDATE/:id", updateHandler);
app.delete("/DELETE/:id", deleteHandler);
app.use("*", noEndPointHandler);

function homeHandler(req, res) {
  let myMovie = new Movie(
    movieData.title,
    movieData.poster_path,
    movieData.overview,
  );
  return res.status(200).json(myMovie);
}

function favoriteHandler(req, res) {
  return res.status(200).send("Welcome to Favorite page");
}

function trendingHandler(req, res) {
  let movies = [];
  axios
    .get(`https://api.themoviedb.org/3/trending/all/day?api_key=${APIKEY}`)
    .then((value) => {
      value.data.results.forEach((element) => {
        let myMovie = new Movie(
          element.id,
          element.title,
          element.release_date,
          element.poster_path,
          element.overview,
        );
        movies.push(myMovie);
      });
      return res.status(200).send(movies);
    })
    .catch((error) => {
      res.status(500).send(error);
      console.log(error);
    });
}

function topRatedTvHandler(req, res) {
  let pagReq = req.query.page;
  let tv = [];
  axios
    .get(
      `https://api.themoviedb.org/3/tv/top_rated?api_key=${APIKEY}&language=en-US&page=${pagReq}`,
    )
    .then((value) => {
      value.data.results.forEach((element) => {
        let oneTv = element;
        tv.push(oneTv);
      });
      return res.status(200).send(tv);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function tvHandler(req, res) {
  let pagReq = req.query.page;
  let tv = [];
  axios
    .get(
      `https://api.themoviedb.org/3/tv/popular?api_key=${APIKEY}&language=en-US&page=${pagReq}`,
    )
    .then((value) => {
      value.data.results.forEach((element) => {
        let oneTv = element;
        tv.push(oneTv);
      });
      return res.status(200).send(tv);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function searchHandler(req, res) {
  let name = req.query.name;
  let page = req.query.page;
  let movies = [];
  axios
    .get(
      `https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&language=en-US&query=${name}&page=${page}`,
    )
    .then((value) => {
      value.data.results.forEach((element) => {
        let myMovie = new Movie(
          element.id,
          element.title,
          element.release_date,
          element.poster_path,
          element.overview,
        );
        movies.push(myMovie);
      });
      return res.status(200).send(movies);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function noEndPointHandler(req, res) {
  return res.status(404).send("no end point with that name found");
}

function errorHandler(message, req, res) {
  const err = {
    status: 500,
    message: message.message,
  };
  return res.status(500).send(err);
}

function addMovieHandler(req, res) {
  const movie = req.body;
  const sql = `INSERT INTO favmovie(title,release_date,poster_path,overview,comment) VALUES($1,$2,$3,$4,$5) RETURNING *;`;
  let values = [
    movie.title,
    movie.release_date,
    movie.poster_path,
    movie.overview,
    movie.comment,
  ];
  client
    .query(sql, values)
    .then((data) => {
      console.log(data);
      return res.status(201).json(data.rows[0]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function getMoviesHandler(req, res) {
  const sql = `SELECT * FROM favmovie;`;
  client
    .query(sql)
    .then((data) => {
      return res.status(200).json(data.rows);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function getMovieHandler(req, res) {
  const id = req.params.id;
  const sql = `SELECT * FROM favMovie WHERE id=${id};`;
  client
    .query(sql)
    .then((data) => {
      return res.status(200).json(data.rows[0]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function updateHandler(req, res) {
  const id = req.params.id;
  const movie = req.body;
  const sql = `UPDATE favMovie SET title=$1, release_date=$2, poster_path=$3, overview=$4, comment=$5 WHERE id=${id} RETURNING *;`;
  let values = [
    movie.title,
    movie.release_date,
    movie.poster_path,
    movie.overview,
    movie.comment,
  ];
  client
    .query(sql, values)
    .then((data) => {
      return res.status(204).send([]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function deleteHandler(req, res) {
  const id = req.params.id;
  const sql = `DELETE FROM favMovie WHERE id=${id};`;
  client
    .query(sql)
    .then(() => {
      return res.status(204).send([]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`listening to port ${PORT}`);
  });
});
