`use strict`;

const express = require(`express`);
const axios = require("axios");
const pg = require("pg");
const dotEnv = require("dotenv");

dotEnv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);

const PORT = process.env.PORT;
const APIKEY = process.env.APIKEY;

const movieData = require("./Movie Data/data.json");
const { port } = require("pg/lib/defaults");

const app = express();

app.use(express.json());

function Movie(id, title, release_date, posterPath, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = posterPath;
  this.overview = overview;
}

app.get("/hello", helloWorldHandler);

app.get("/", homeHandler);

app.get("/favorite", favoriteHandler);

app.get("/trending", trendingHandler);

app.get("/search", searchHandler);

app.get("/genre", genreHandler);

app.get("/tv", tvHandler);

app.get("/tv/top_rated", topRatedTvHandler);

app.post("/addMovie", addMovieHandler);

app.get("/getMovies", getMoviesHandler);

app.get("/getMovie/:id", getMovieHandler);

app.put("/UPDATE/:id", updateHandler);

app.delete("/DELETE/:id", deleteHandler);

app.use("*", noEndPointHandler);

function helloWorldHandler(req, res) {
  return res.status(200).send("Hello World");
}

function homeHandler(req, res) {
  let oneMovie = new Movie(
    movieData.title,
    movieData.poster_path,
    movieData.overview,
  );
  return res.status(200).json(oneMovie);
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
        let oneMovie = new Movie(
          element.id,
          element.title,
          element.release_date,
          element.poster_path,
          element.overview,
        );
        movies.push(oneMovie);
      });
      return res.status(200).send(movies);
    })
    .catch((error) => {
      errorHandler(error, req, res);
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
  let nameSearch = req.query.name;
  let pageReq = req.query.page;
  let movies = [];
  axios
    .get(
      `https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&language=en-US&query=${nameSearch}&page=${pageReq}`,
    )
    .then((value) => {
      value.data.results.forEach((element) => {
        let oneMovie = new Movie(
          element.id,
          element.title,
          element.release_date,
          element.poster_path,
          element.overview,
        );
        movies.push(oneMovie);
      });
      return res.status(200).send(movies);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function genreHandler(req, res) {
  let movies = [];
  axios
    .get(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${APIKEY}&language=en-US`,
    )
    .then((value) => {
      value.data.genres.forEach((element) => {
        let oneMovie = element;
        movies.push(oneMovie);
      });
      return res.status(200).send(movies);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function addMovieHandler(req, res) {
  let reqBody = req.body;
  let sql = `INSERT INTO favmovies(title, release_date, poster_path, overview, comment) VALUES($1, $2, $3, $4, $5) RETURNING *;`;
  let values = [
    reqBody.title,
    reqBody.release_date,
    reqBody.poster_path,
    reqBody.overview,
    reqBody.comment,
  ];

  client
    .query(sql, values)
    .then((data) => {
      return res.status(201).json(data.rows[0]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function getMoviesHandler(req, res) {
  const reqBody = req.body;
  let sql = `SELECT * FROM favMovies;`;
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
  console.log(req);
  const sql = `SELECT * FROM favMovies WHERE id=${id}`;

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
  const reqBody = req.body;
  const sql = `UPDATE favMovies SET title=$1, release_date=$2, poster_path=$3, overview=$4, comment=$5 WHERE id=${id} RETURNING *;`;
  let values = [
    reqBody.title,
    reqBody.release_date,
    reqBody.poster_path,
    reqBody.overview,
    reqBody.comment,
  ];

  client
    .query(sql, values)
    .then((data) => {
      return res.status(200).json(data.rows[0]);
    })
    .catch((error) => {
      errorHandler(error, req, res);
    });
}

function deleteHandler(req, res) {
  const id = req.params.id;
  const sql = `DELETE FROM favMovies WHERE id=${id};`;
  client
    .query(sql)
    .then(() => {
      return res.status(204).send([]);
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

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Listen to port ${PORT}`);
  });
});
