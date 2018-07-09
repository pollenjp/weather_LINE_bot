// index.js

//--------------------
//  Require
//--------------------
const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').load();               // require and load dotenv

var getWeather = require("./openWeatherMap/getWeatherInfo_sync.js");


//--------------------
//  config
//--------------------
const config = {
  channelAccessToken : process.env.MY_CHANNEL_ACCESS_TOKEN,  // .env
  channelSecret      : process.env.MY_CHANNEL_SECRET         // .env
}


//--------------------------------------------------------------------------------
//  Main
//--------------------------------------------------------------------------------
const app = express();
const client = new line.Client(config);

app.post("/webhook", line.middleware(config),
  function(req, res)
  {
    console.log("get");
    Promise
      .all(req.body.events.map(handleEvent))
      .then(function(result){ res.json(result); });
  }
);


//--------------------------------------------------------------------------------
//  handleEvent
//--------------------------------------------------------------------------------
function handleEvent(event)
{
  console.log(event);
  console.log(event.type);
  console.log(event.timestamp);
  console.log(event.source);
  //if (event.type !== "message" || event.message.type !== "text"){
  //  // ignore non-text-message event
  //  return Promise.resolve(null);
  //}

  //----------------------------------------
  // reply
  //----------------------------------------
  var reply;
  //--------------------
  //  type : message
  //--------------------
  if (event.type == "message" && event.message.type == "text"){
    reply = replyToMessageEvent(event);
  }
  //--------------------
  //  type : postback
  //--------------------
  if (event.type == "postback"){
    reply = replyToPostbackEvent(event);
  }

  return client.replyMessage(event.replyToken, reply);
}


//--------------------------------------------------------------------------------
//  replyToMessageEvent
//--------------------------------------------------------------------------------
function replyToMessageEvent(event)
{
  //----------
  //  reply : Text Message
  //----------
  //var weatherInfo = getWeather.getWeatherInfo("Tokyo");
  //console.log(weatherInfo);
  //const reply = {  // Text Message
  //  type: "text",
  //  text: weatherInfo[0].city_name
  //};
  //----------
  //  reply : Button Template Message
  //----------
  var reply = {  // Button Template Message
    "type": "template",
    "altText": "This is a buttons template",
    "template": {
      "type": "buttons",
      //"thumbnailImageUrl": "http://openweathermap.org/img/w/01d.png",
      "thumbnailImageUrl":
        "https://raw.githubusercontent.com/pollenjp/learning_linebot/feature/line-sdk/image/umbrella01.gif",
      //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
      "imageAspectRatio": "rectangle",
      "imageSize": "cover",
      "imageBackgroundColor": "#FFFFFF",  // white
      "title": "傘の有無を調べますか？",
      "text": "選択してください。",
      "defaultAction": {
        "type": "uri",
        "label": "View detail",
        "uri": "http://example.com/page/123"
      },
      "actions": [
        {
          "type": "postback",
          "label": "はい",
          "data": "question=needUmbrella&action=yes"
        },
        {
          "type": "postback",
          "label": "いいえ",
          "data": "question=needUmbrella&action=no"
        }
      ]
    }
  };
  return reply;
}


//--------------------------------------------------------------------------------
//  replyToPostbackEvent
//--------------------------------------------------------------------------------
function replyToPostbackEvent(event)
{
  var postback_data_obj = queryStringToJSON(event.postback.data);
  console.log(postback_data_obj);
  var reply;
  //--------------------------------------------------------------------------------
  //  Switch
  //    - needUmbrella
  //    - region
  //    - prefecture
  //--------------------------------------------------------------------------------
  switch (postback_data_obj.question){
      //------------------------------------------------------------
      //  needUmbrella
      //------------------------------------------------------------
    case "needUmbrella":
      switch (postback_data_obj.action){
        case "yes":
          // Button Template Message
          // Question "Which region in Japan"
          reply = [
            {
              // 1st Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの地方ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "北海道・東北",
                    "data" : "question=region" + "&" + "region=HokkaidouTouhoku"
                  },
                  {
                    "type" : "postback",
                    "label": "関東",
                    "data" : "question=region" + "&" + "region=Kantou"
                  },
                  {
                    "type" : "postback",
                    "label": "中部",
                    "data" : "question=region" + "&" + "region=Chubu"
                  },
                  {
                    "type" : "postback",
                    "label": "近畿",
                    "data" : "question=region" + "&" + "region=Kinki"
                  }
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "中国",
                    "data" : "question=region" + "&" + "region=Chugoku"
                  },
                  {
                    "type" : "postback",
                    "label": "四国",
                    "data" : "question=region" + "&" + "region=Shikoku"
                  },
                  {
                    "type" : "postback",
                    "label": "九州・沖縄",
                    "data" : "question=region" + "&" + "region=KyushuOkinawa"
                  }
                ]
              }
            },
          ];
          break;
      }
      break;

    case "region":
      //------------------------------------------------------------
      //  Region
      //  TODO:
      //    - 近畿地方
      //    - 中部地方の中央高知（アルプス？）
      //------------------------------------------------------------
      switch (postback_data_obj.region){
          // Button Template Message
          // Question "Which prefecture is there in the region"
        case "HokkaidouTouhoku":
          //----------------------------------------
          //  北海道・東北
          //----------------------------------------
          reply = [
            {
              // 1st Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの都道府県ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "北海道",
                    "data" : "question=prefecture" + "&" + "prefecture=Hokkaidou" + "&" + "capital=Sapporo"
                  },
                  {
                    "type" : "postback",
                    "label": "青森",
                    "data" : "question=prefecture" + "&" + "prefecture=Aomori" + "&" + "capital=Aomori"
                  },
                  {
                    "type" : "postback",
                    "label": "岩手",
                    "data" : "question=prefecture" + "&" + "prefecture=Iwate" + "&" + "capital=Morioka"
                  },
                  {
                    "type" : "postback",
                    "label": "宮城",
                    "data" : "question=prefecture" + "&" + "prefecture=Miyagi" + "&" + "capital=Sendai"
                  }
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "秋田",
                    "data" : "question=prefecture" + "&" + "prefecture=Akita" + "&" + "capital=Akita"
                  },
                  {
                    "type" : "postback",
                    "label": "山形",
                    "data" : "question=prefecture" + "&" + "prefecture=Yamagata" + "&" + "capital=Yamagata"
                  },
                  {
                    "type" : "postback",
                    "label": "福島",
                    "data" : "question=prefecture" + "&" + "prefecture=Fukushima" + "&" + "capital=Fukushima"
                  }
                ]
              }
            }
          ];
          break;
        case "Kantou":
          //----------------------------------------
          //  関東
          //----------------------------------------
          reply = [
            {
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの都道府県ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "東京",
                    "data" : "question=prefecture" + "&" + "prefecture=Tokyo" + "&" + "capital=Tokyo"
                  },
                  {
                    "type" : "postback",
                    "label": "神奈川",
                    "data" : "question=prefecture" + "&" + "prefecture=kanagawa" + "&" + "capital=Yokohama"
                  },
                  {
                    "type" : "postback",
                    "label": "埼玉",
                    "data" : "question=prefecture" + "&" + "prefecture=Saitama" + "&" + "capital=Saitama"
                  }, 
                  {
                    "type" : "postback",
                    "label": "千葉",
                    "data" : "question=prefecture" + "&" + "prefecture=Chiba" + "&" + "capital=Chiba"
                  }
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "茨城",
                    "data" : "question=prefecture" + "&" + "prefecture=Ibaraki" + "&" + "capital=Mito"
                  }, 
                  {
                    "type" : "postback",
                    "label": "群馬",
                    "data" : "question=prefecture" + "&" + "prefecture=Gunma" + "&" + "capital=Maebashi"
                  }, 
                  {
                    "type" : "postback",
                    "label": "栃木",
                    "data" : "question=prefecture" + "&" + "prefecture=Tochigi" + "&" + "capital=Utsunomiya"
                  }
                ]
              }
            }
          ];
          break;
        case "Chubu":
          //----------------------------------------
          //  中部
          //----------------------------------------
          reply = [
            {
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの都道府県ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "静岡",
                    "data" : "question=prefecture" + "&" + "prefecture=Shizuoka" + "&" + "capital=Shizuoka"
                  },
                  {
                    "type" : "postback",
                    "label": "愛知",
                    "data" : "question=prefecture" + "&" + "prefecture=Aichi" + "&" + "capital=Nagoya"
                  },
                  {
                    "type" : "postback",
                    "label": "岐阜",
                    "data" : "question=prefecture" + "&" + "prefecture=Gifu" + "&" + "capital=Gifu-shi"
                  }, 
                  {
                    "type" : "postback",
                    "label": "新潟",
                    "data" : "question=prefecture" + "&" + "prefecture=Niigata" + "&" + "capital=Niigata"
                  },
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "富山",
                    "data" : "question=prefecture" + "&" + "prefecture=Toyama" + "&" + "capital=Toyama"
                  },
                  {
                    "type" : "postback",
                    "label": "石川",
                    "data" : "question=prefecture" + "&" + "prefecture=Ishikawa" + "&" + "capital=Kanazawa"
                  },
                  {
                    "type" : "postback",
                    "label": "福井",
                    "data" : "question=prefecture" + "&" + "prefecture=Fukui" + "&" + "capital=Fukui"
                  }
                ]
              }
            }
          ];
          break;
        case "Kinki": 
          //----------------------------------------
          //  近畿
          //----------------------------------------
          reply = [
            { 
              "type": "template", 
              "altText": "This is a buttons template", 
              "template": {
                "type": "buttons", 
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg", 
                "imageAspectRatio": "rectangle", 
                "imageSize": "cover", 
                "imageBackgroundColor": "#FFFFFF", 
                "title": "どこの都道府県ですか？", 
                "text": "選択してください。", 
                "actions": [ 
                  { 
                    "type" : "postback", 
                    "label": "兵庫", 
                    "data" : "question=prefecture" + "&" + "prefecture=Hyogo" + "&" + "capital=Cobe" 
                  }, 
                  { 
                    "type" : "postback", 
                    "label": "京都", 
                    "data" : "question=prefecture" + "&" + "prefecture=Kyoto" + "&" + "capital=Kyoto" 
                  }, 
                  { 
                    "type" : "postback", 
                    "label": "大阪", 
                    "data" : "question=prefecture" + "&" + "prefecture=Osaka" + "&" + "capital=Osaka" 
                  },
                  { 
                    "type" : "postback", 
                    "label": "和歌山", 
                    "data" : "question=prefecture" + "&" + "prefecture=Wakayama" + "&" + "capital=Wakayama" 
                  }
                ] 
              } 
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  { 
                    "type" : "postback", 
                    "label": "滋賀", 
                    "data" : "question=prefecture" + "&" + "prefecture=Shiga" + "&" + "capital=Otsu" 
                  },
                  { 
                    "type" : "postback", 
                    "label": "奈良", 
                    "data" : "question=prefecture" + "&" + "prefecture=Nara" + "&" + "capital=Nara" 
                  },
                  { 
                    "type" : "postback", 
                    "label": "三重", 
                    "data" : "question=prefecture" + "&" + "prefecture=Mie" + "&" + "capital=Tsu" 
                  }
                ]
              }
            }
          ];
          break;
        case "Chugoku":
          //----------------------------------------
          //  中国
          //----------------------------------------
          reply = [
            {
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの都道府県ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "山口",
                    "data" : "question=prefecture" + "&" + "prefecture=Yamaguchi" + "&" + "capital=Yamaguchi"
                  },
                  {
                    "type" : "postback",
                    "label": "広島",
                    "data" : "question=prefecture" + "&" + "prefecture=Hiroshima" + "&" + "capital=Hiroshima"
                  },
                  {
                    "type" : "postback",
                    "label": "岡山",
                    "data" : "question=prefecture" + "&" + "prefecture=Okayama" + "&" + "capital=Okayama"
                  }
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "島根",
                    "data" : "question=prefecture" + "&" + "prefecture=Shimane" + "&" + "capital=Matsue"
                  },
                  {
                    "type" : "postback",
                    "label": "鳥取",
                    "data" : "question=prefecture" + "&" + "prefecture=Tottori" + "&" + "capital=Tottori"
                  }
                ]
              }
            }
          ];
          break;
        case "Shikoku":
          //----------------------------------------
          //  四国
          //----------------------------------------
          reply = {
            "type": "template",
            "altText": "This is a buttons template",
            "template": {
              "type": "buttons",
              "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
              "imageAspectRatio": "rectangle",
              "imageSize": "cover",
              "imageBackgroundColor": "#FFFFFF",
              "title": "どこの都道府県ですか？",
              "text": "選択してください。",
              "actions": [
                {
                  "type" : "postback",
                  "label": "香川",
                  "data" : "question=prefecture" + "&" + "prefecture=kagawa" + "&" + "capital=Takamatsu"
                },
                {
                  "type" : "postback",
                  "label": "徳島",
                  "data" : "question=prefecture" + "&" + "prefecture=Tokushima" + "&" + "capital=Tokushima"
                },
                {
                  "type" : "postback",
                  "label": "愛媛",
                  "data" : "question=prefecture" + "&" + "prefecture=Ehime" + "&" + "capital=Matsuyama"
                },
                {
                  "type" : "postback",
                  "label": "高知",
                  "data" : "question=prefecture" + "&" + "prefecture=Kochi" + "&" + "capital=Kochi"
                }
              ]
            }
          };
          break;
        case "KyushuOkinawa":
          //----------------------------------------
          //  九州・沖縄
          //----------------------------------------
          reply = [
            {
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "imageBackgroundColor": "#FFFFFF",
                "title": "どこの都道府県ですか？",
                "text": "選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "鹿児島",
                    "data" : "question=prefecture" + "&" + "prefecture=Kagoshima" + "&" + "capital=Kagoshima"
                  },
                  {
                    "type" : "postback",
                    "label": "熊本",
                    "data" : "question=prefecture" + "&" + "prefecture=Kumamoto" + "&" + "capital=Kumamoto"
                  },
                  {
                    "type" : "postback",
                    "label": "宮崎",
                    "data" : "question=prefecture" + "&" + "prefecture=Miyazaki" + "&" + "capital=Miyazaki"
                  },
                  {
                    "type" : "postback",
                    "label": "大分",
                    "data" : "question=prefecture" + "&" + "prefecture=Oita" + "&" + "capital=Oita"
                  }
                ]
              }
            },
            {
              // 2nd Message
              "type": "template",
              "altText": "This is a buttons template",
              "template": {
                "type": "buttons",
                "text": "上の項目か下の項目から選択してください。",
                "actions": [
                  {
                    "type" : "postback",
                    "label": "福岡",
                    "data" : "question=prefecture" + "&" + "prefecture=Fukuoka" + "&" + "capital=Fukuoka"
                  },
                  {
                    "type" : "postback",
                    "label": "佐賀",
                    "data" : "question=prefecture" + "&" + "prefecture=Saga" + "&" + "capital=Saga"
                  },
                  {
                    "type" : "postback",
                    "label": "長崎",
                    "data" : "question=prefecture" + "&" + "prefecture=Ngasaki" + "&" + "capital=Nagasaki"
                  },
                  {
                    "type" : "postback",
                    "label": "沖縄",
                    "data" : "question=prefecture" + "&" + "prefecture=Okinawa" + "&" + "capital=Naha-shi"
                  }
                ]
              }
            }
          ];
          break;
      }
      break;

    case "prefecture":
      //------------------------------------------------------------
      //  Prefecture
      //------------------------------------------------------------
      console.log("prefecture");
      reply = [];
      var weatherInfo = getWeather.getWeatherInfo(postback_data_obj.capital);
      var image_base_url = "https://raw.githubusercontent.com/pollenjp/learning_linebot/"
        + "d47733b421ddb5b5a6165b168a2807d5e0ad2a21/"
        + "image/";
      console.log(weatherInfo[0].icon);
      reply.push({
        type: "text",
        text: weatherInfo[0].city_name + " : " + weatherInfo[0].forecast
        // + ",url:" + image_base_url + weatherInfo[0].icon + ".png"
      });
      reply.push({
        "type": "image",
        "originalContentUrl": image_base_url + weatherInfo[0].icon + ".png",
        "previewImageUrl"   : image_base_url + weatherInfo[0].icon + ".png"
      });
      break;

    default:
      reply = {
        type: "text",
        text: "event:postback"
      };
  }
  return reply;
}


//--------------------------------------------------------------------------------
//  queryStringToJSON
function queryStringToJSON(qs) {
  // reference
  //    Carlo G
  //      - https://stackoverflow.com/questions/11557526/deserialize-query-string-to-json-object
  qs = qs || location.search.slice(1);

  var pairs = qs.split('&');
  var result = {};
  pairs.forEach(function(p) {
    var pair = p.split('=');
    var key = pair[0];
    var value = decodeURIComponent(pair[1] || '');

    if( result[key] ) {
      if( Object.prototype.toString.call( result[key] ) === '[object Array]' ) {
        result[key].push( value );
      } else {
        result[key] = [ result[key], value ];
      }
    } else {
      result[key] = value;
    }
  });

  return JSON.parse(JSON.stringify(result));
};

//--------------------------------------------------------------------------------
//  Listen Port
//--------------------------------------------------------------------------------
const port = process.env.PORT || 3000;
app.listen(port, function()
  {
    console.log("Listening on ${port}");
  }
);

