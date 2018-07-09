// getWeatherInfo_sync.js

//----------------------------------------
//  Setting
//----------------------------------------
var request = require("sync-request");
require('dotenv').load(); 


const config = {
  apiKey: process.env.OPEN_WEATHER_MAP_API_KEY,
  baseUrl: "http://api.openweathermap.org/data/2.5/forecast"
}

var city = 'Sapporo'

var data;
var i = 0;

//----------------------------------------
//  Main
//----------------------------------------
var weatherInfo = getWeatherInfo(city);
console.log("After get");
console.log(weatherInfo);


//----------------------------------------
//  getWeatherInfo
//----------------------------------------
function getWeatherInfo(city){
  var body = request(
    'GET',          // Method
    config.baseUrl, // URL
    {
      qs: {
        q     : city + ',jp',
        APPID : config.apiKey
      }
    }
  );
  console.log(body);
  body = body.getBody();
  console.log(body);
  console.log(typeof(body));

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
  //--------------------
  // get 8 data (8 = 24h/3h)
  weatherInfo = [];
  for(i=0;i<8;i++){
    var date = new Date(data.list[i].dt_txt);
    date.setHours(date.getHours() + 9);
    var month = date.getMonth()+1;
    var day = month + "月" + date.getDate() + "日" + Week[date.getDay()];
    var time = date.getHours() + ":00"

    weatherInfo.push(
      {
        city_name : data.city.name,
        forecast  : data.list[i].weather[0].main,
        icon      : data.list[i].weather[0].icon,
        date      : day,
        time      : time
      }
    );
  }
  //--------------------

  console.log("return");
  return weatherInfo;
}


//--------------------
//  export
//--------------------
exports.getWeatherInfo = getWeatherInfo;



