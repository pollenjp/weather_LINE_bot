
//--------------------
var getWeather = require("./getWeatherInfo_sync");

//--------------------
var weatherInfo = getWeather.getWeatherInfo("Sapporo");
console.log(weatherInfo);
console.log(weatherInfo[0].city_name);
//console.log(weatherInfo.city_name.join(','));
