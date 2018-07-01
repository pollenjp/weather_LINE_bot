// getapi.js

var request = require("sync-request");
require('dotenv').load(); 

const config = {
  apiKey: process.env.API_KEY,
  baseUrl: "http://api.openweathermap.org/data/2.5/forecast"
}

var city = 'Tokyo'

var data;
var i = 0;
var weather_info = {};

getWeatherInfo();

function getWeatherInfo(){
  var body = request(
    'GET',          // Method
    config.baseUrl, // URL
    {
      qs: {
        q: city + ',jp',
        APPID: config.apiKey
      }
    }
  );
  console.log(body);
  body = body.getBody();
  console.log(body);
  console.log(typeof(body));


  //
  //console.log(body);
  var jsonBody = JSON.parse(body);
  console.log(jsonBody);
  console.log(typeof(jsonBody));
  //console.log(jsonBody);
  console.log(jsonBody.city.name);
  //--------------------
  //--------------------
  data = jsonBody;
  var Week = new Array("（日）","（月）","（火）","（水）","（木）","（金）","（土）");
  var date = new Date(data.list[i].dt_txt);
  date.setHours(date.getHours() + 9);
  var month = date.getMonth()+1;
  var day = month + "月" + date.getDate() + "日" + Week[date.getDay()] + date.getHours() + "：00";
  //console.log(day);
  //console.log(data.list[i].main.temp);
  //console.log(data.list[i].weather);
  //console.log(data.list[i].weather[0].main);
  //console.log(data.list[i].weather[0].description);
  //console.log(Math.round(data.list[i].main.temp));
  //console.log();

  weather_info = {
    city_name: "return" + data.city.name,
    forecast: data.list[i].weather[0].main,
    time: day
  }

  console.log(weather_info);
  return weather_info;

}

//--------------------
//  export
//--------------------
exports.getWeatherInfo = getWeatherInfo;



