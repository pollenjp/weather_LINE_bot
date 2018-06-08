// getapi.js

var parser = require('xml2json');
var request = require("request");

request.get(
  {
    url: "https://map.yahooapis.jp/weather/V1/place",
    qs: {
      coordinates: "139.732293,35.663613",
      appid: "dj00aiZpPTFRM1M5MUxCVXl1YyZzPWNvbnN1bWVyc2VjcmV0Jng9Yjg-"
    }
  },
  function (error, response, body)
  {
    console.log(body);
    //info = JSON.parse(body);
    //console.log(info);
    var json = parser.toJson(body);
    console.log(json);
  }
);
