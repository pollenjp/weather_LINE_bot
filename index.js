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


//--------------------
//  database
//--------------------
const pgp = require('pg-promise')({
    // Initialization Options
});
const cn = {
      host     : 'pollenjp.com',
      port     : 55432,
      database : 'linebot',
      user     : 'pguser01',
      password : 'pguser01passwd'
};
const db = pgp(cn);


//--------------------------------------------------------------------------------
//  Main
//--------------------------------------------------------------------------------
const app = express();
const client = new line.Client(config);

app.post("/webhook", line.middleware(config), (req, res) => {
  console.log("get");
  // 各イベントに対して処理を実行
  req.body.events.forEach( (event) => {
    handleEvent(event, req, res);
  });
  //Promise
  //  .all( req.body.events.map(handleEvent) )
  //  .then( function(result){ res.json(result); } );
});


//----------------------------------------
//  Listen Port
//----------------------------------------
const port = process.env.PORT || 3000;
app.listen(port, function()
  {
    console.log("Listening on ${port}");
  }
);



//--------------------------------------------------------------------------------
//  handleEvent
//--------------------------------------------------------------------------------
async function handleEvent(event, req, res)
{
  //----------------------------------------
  //  Event
  //----------------------------------------
  //    source.userId
  console.log("event\n", event, "\n");
  console.log("event.type\n", event.type, "\n");
  console.log("event.timestamp", event.timestamp, "\n");
  console.log("event.source\n", event.source, "\n");
  //if (event.type !== "message" || event.message.type !== "text"){
  //  // ignore non-text-message event
  //  return Promise.resolve(null);
  //}
  //

  //----------------------------------------
  // reply
  //----------------------------------------
  //--------------------
  //  type : follow
  //  type : message
  //  type : postback
  //--------------------
  switch ( event.type ){
    case "follow"   : replyToFollowEvent(event, req, res); break;
    case "unfollow" : replyToUnfollowEvent(event, req, res); break;
    case "message"  : replyToMessageEvent(event, req, res); break;
    case "postback" : replyToPostbackEvent(event, req, res); break;
    default:
  }
}


//--------------------------------------------------------------------------------
//  replyToFollowEvent
//--------------------------------------------------------------------------------
async function replyToFollowEvent(event, req, res)
{
  //----------------------------------------
  //  register on database
  //----------------------------------------
  var sqlText = 'INSERT INTO userinfo (userid) VALUES ($1);'
  var sqlValues = [event.source.userId]
  db.any(sqlText, sqlValues)
    .catch( (err) => {
      console.log("Error (replyToFollowEvent : register on database) : \n", err);
    });

  //----------------------------------------
  //  reply message
  //----------------------------------------
  let reply = askQuestion();
  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  replyToUnfollowEvent
//--------------------------------------------------------------------------------
async function replyToUnfollowEvent(event, req, res)
{
  //----------------------------------------
  //  register on database
  //----------------------------------------
  var sqlText = `DELETE FROM userinfo WHERE userid = $1;`;
  var sqlValues = [event.source.userId]
  db.any(sqlText, sqlValues)
    .catch( (err) => {
      console.log("Error (replyToUnfollowEvent) : \n", err);
    });
  return;
} 
//--------------------------------------------------------------------------------
//  replyToMessageEvent
//--------------------------------------------------------------------------------
async function replyToMessageEvent(event, req, res)
{
  let reply = askQuestion(event, req, res);
  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  replyToPostbackEvent
//--------------------------------------------------------------------------------
async function replyToPostbackEvent(event, req, res)
{
  let postback_data_obj = queryStringToJSON(event.postback.data);
  console.log(postback_data_obj);
  //--------------------------------------------------------------------------------
  //  Switch
  //    - needUmbrella
  //    - setPlace
  //    - region
  //    - prefecture
  //--------------------------------------------------------------------------------
  switch (postback_data_obj.question){

    case "pushMessage":
      switch (postback_data_obj.action){
        case "yes":
          let sqlText = `UPDATE userinfo SET pushmessage = 1  WHERE userid = $1`;
          let sqlValues = [ event.source.userId ];
          // savePlace (0: no, 1: want to save, 2: saved)
          let savePlace = await db.any( sqlText, sqlValues)
            .catch( (err) => {
              console.log("Error : ", err);
            });
          let reply = {
            type: "text",
            text: "毎朝６時に通知されます。解除したい場合は一度ブロックしてからブロック解除をおねがいします。"
          };
          let result = client.replyMessage(event.replyToken, reply);
          res.json(result);
          break;
      }
      break;
    case "needUmbrella":
      //------------------------------------------------------------
      //  needUmbrella
      //------------------------------------------------------------
      switch (postback_data_obj.action){
        case "yes":
          // データベースを確認してデフォルト地域がなければ
          // 地域を聞く.
          let sqlText = `SELECT savePlace FROM userinfo WHERE userid = $1`;
          let sqlValues = [ event.source.userId ];
          // savePlace (0: no, 1: want to save, 2: saved)
          let savePlace = await db.any( sqlText, sqlValues)
            .catch( (err) => {
              console.log("Error : ", err);
            });

          console.log(savePlace);
          console.log(savePlace[0].saveplace);
          if ( savePlace[0].saveplace == 2){
            let postback_data_obj = {};
            answerUmbrellaNecessity( postback_data_obj, event, req, res);
          } else {
            askSavePlace(event, req, res);
          }
          // if in database
          //  reply the answer
          // else
          //  ask place
          break;
      }
      break;

    case "setPlace":
      //------------------------------------------------------------
      //  setPlace
      //------------------------------------------------------------
      switch (postback_data_obj.action){
        case "yes":
          let sqlText = `UPDATE userinfo SET savePlace = 1 WHERE userid = $1`;
          let sqlValues = [ event.source.userId ];
          await db.any( sqlText, sqlValues )
            .catch( (err) => { console.log( "Error : ", err); } );
          askRegions(event, req, res);
          return;
        case "no":
          askRegions(event, req, res);
          return;
      }
      break;

    case "region":
      //------------------------------------------------------------
      //  Region
      //  TODO:
      //    - 中部地方の中央高知（アルプス？）
      //      - 長野
      //      - 山梨
      //------------------------------------------------------------
      switch (postback_data_obj.region){
          // Button Template Message
          // Question "Which prefecture is there in the region"
          //----------------------------------------
          //  北海道・東北
          //  関東
          //  中部
          //  近畿
          //  中国
          //  四国
          //  九州・沖縄
          //----------------------------------------
        case "HokkaidouTouhoku" : selectHokkaidouTouhoku(event, req, res); return;
        case "Kantou"           : selectKantou(event, req, res); return;
        case "Chubu"            : selectChubu(event, req, res); return;
        case "Kinki"            : selectKinki(event, req, res); return;
        case "Chugoku"          : selectChugoku(event, req, res); return;
        case "Shikoku"          : selectShikoku(event, req, res); return;
        case "KyushuOkinawa"    : selectKyushuOkinawa(event, req, res); return;
      }
      break;

    case "prefecture":
      //------------------------------------------------------------
      //  Prefecture
      //------------------------------------------------------------
      console.log("prefecture");
      answerUmbrellaNecessity(postback_data_obj, event, req, res);
      return;

    default:
      let reply = {
        type: "text",
        text: "event:postback"
      };
      let result = client.replyMessage(event.replyToken, reply);
      res.json(result);
  }
  return;
}


//--------------------------------------------------------------------------------
//  askQuestion
//--------------------------------------------------------------------------------
function askQuestion()
{
  //--------------------
  //  今すぐ傘の用不要を聞く
  //  デフォルトの地域設定をするかどうかを聞く
  //--------------------
  let reply = {  // Button Template Message
    "type": "template",
    "altText": "選択ボタン",
    "template": {
      "type": "buttons",
      "thumbnailImageUrl":
        "https://raw.githubusercontent.com/pollenjp/learning_linebot/feature/line-sdk/image/umbrella01.gif",
      "imageAspectRatio": "rectangle",
      "imageSize": "contain",
      "imageBackgroundColor": "#FFFFFF",
      "title": "何をしますか",
      "text": "以下の項目から選択してください。",
      "actions": [
        {
          "type": "postback",
          "label": "傘の要・不要を調べる",
          "data": "question=needUmbrella&action=yes"
        },
        {
          "type": "postback",
          "label": "地域の設定・変更",
          "data": "question=setPlace&action=yes"
        },
        {
          "type": "postback",
          "label": "朝６時にpush通知",
          "data": "question=pushMessage&action=yes"
        }
      ]
    }
  };

  return reply;
}


//--------------------------------------------------------------------------------
//  askSavePlace
//--------------------------------------------------------------------------------
async function askSavePlace(event, req, res)
{
  let reply = {  // Button Template Message
    "type": "template",
    "altText": "選択ボタン",
    "template": {
      "type": "buttons",
      "title": "地域保存",
      "text": "地域を保存すると次回から入力を省略できます。",
      "actions": [
        {
          "type": "postback",
          "label": "保存する",
          "data": "question=setPlace&action=yes"
        },
        {
          "type": "postback",
          "label": "保存しない",
          "data": "question=setPlace&action=no"
        }
      ]
    }
  };

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  askRegions
//--------------------------------------------------------------------------------
async function askRegions(event, req, res)
{
  // Button Template Message
  // Question "Which region in Japan"
  let reply = [
    {
      // 1st Message
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
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

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectHokkaidouTouhoku
//--------------------------------------------------------------------------------
async function selectHokkaidouTouhoku(event, req, res)
{
  let reply = [
    {
      // 1st Message
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
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
  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectKantou
//--------------------------------------------------------------------------------
async function selectKantou(event, req, res)
{
  let reply = [
    {
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
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

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectChubu
//--------------------------------------------------------------------------------
async function selectChubu(event, req, res)
{
  let reply = [
    {
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
        "title": "どこの都道府県ですか？",
        "text": "選択肢１",
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
        "text": "選択肢２",
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
          },
          {
            "type" : "postback",
            "label": "福井",
            "data" : "question=prefecture" + "&" + "prefecture=Nagano" + "&" + "capital=Nagano"
          }
        ]
      }
    },
    {
      // 3rd Message
      "type": "template",
      "altText": "3rd selection",
      "template": {
        "type": "buttons",
        "text": "選択肢３",
        "actions": [
          {
            "type" : "postback",
            "label": "富山",
            "data" : "question=prefecture" + "&" + "prefecture=Yamanashi" + "&" + "capital=Yamanashi"
          },
        ]
      }
    }
  ];

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectKinki
//--------------------------------------------------------------------------------
async function selectKinki(event, req, res)
{
  let reply = [
    { 
      "type": "template", 
      "altText": "This is a buttons template", 
      "template": {
        "type": "buttons", 
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg", 
        //"imageAspectRatio": "rectangle", 
        //"imageSize": "cover", 
        //"imageBackgroundColor": "#FFFFFF", 
        "title": "どこの都道府県ですか？", 
        "text": "選択してください。", 
        "actions": [ 
          { 
            "type" : "postback", 
            "label": "兵庫", 
            "data" : "question=prefecture" + "&" + "prefecture=Hyogo" + "&" + "capital=Kobe" 
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

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectChugoku
//--------------------------------------------------------------------------------
async function selectChugoku(event, req, res)
{
  let reply = [
    {
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
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

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectShikoku
//--------------------------------------------------------------------------------
async function selectShikoku(event, req, res)
{
  let reply = {
    "type": "template",
    "altText": "This is a buttons template",
    "template": {
      "type": "buttons",
      //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
      //"imageAspectRatio": "rectangle",
      //"imageSize": "cover",
      //"imageBackgroundColor": "#FFFFFF",
      "title": "どこの都道府県ですか？",
      "text": "選択してください。",
      "actions": [
        {
          "type" : "postback",
          "label": "香川",
          "data" : "question=prefecture" + "&" + "prefecture=Kagawa" + "&" + "capital=Takamatsu"
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
          "data" : "question=prefecture" + "&" + "prefecture=Kochi" + "&" + "capital=Kochi-shi"
        }
      ]
    }
  };

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  selectKyushuOkinawa
//--------------------------------------------------------------------------------
async function selectKyushuOkinawa(event, req, res)
{
  reply = [
    {
      "type": "template",
      "altText": "This is a buttons template",
      "template": {
        "type": "buttons",
        //"thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
        //"imageAspectRatio": "rectangle",
        //"imageSize": "cover",
        //"imageBackgroundColor": "#FFFFFF",
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

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  answerUmbrellaNecessity
//--------------------------------------------------------------------------------
async function answerUmbrellaNecessity(postback_data_obj, event, req, res)
{
  let reply = [];
  let weatherInfo = "";
  let sqlText = "";
  let sqlValues = [];
  let image_base_url = "https://raw.githubusercontent.com/pollenjp/learning_linebot/"
    + "d47733b421ddb5b5a6165b168a2807d5e0ad2a21/"
    + "image/";

  sqlText = `SELECT savePlace FROM userinfo WHERE userid = $1`;
  sqlValues = [ event.source.userId ];
  let savePlace = await db.any( sqlText, sqlValues )
    .catch( (err) => {
      console.log("Error : ", err);
    });

  switch ( savePlace[0].saveplace ){
    case 1:
      sqlText = `UPDATE userinfo SET savePlace = 2 WHERE userid = $1`;
      sqlValues = [ event.source.userId ];
      db.any( sqlText, sqlValues )
        .catch( (err) => {
          console.log("Error : ", err);
        });

      sqlText = `UPDATE userinfo SET place = $1 WHERE userid = $2`;
      sqlValues = [ postback_data_obj.capital, event.source.userId ];
      db.any( sqlText, sqlValues )
        .catch( (err) => {
          console.log("Error : ", err);
        });
      // no break
    case 2:
      sqlText = `SELECT place FROM userinfo WHERE userid = $1`;
      sqlValues = [ event.source.userId ];
      let place = await db.any( sqlText, sqlValues )
        .catch( (err) => {
          console.log("Error : ", err);
        });
      weatherInfo = getWeather.getWeatherInfo( place[0].place );
      break;
    case 0:
    default:
      weatherInfo = getWeather.getWeatherInfo(postback_data_obj.capital);
  }

  console.log(weatherInfo[0].icon);

  // get 18:00 weather
  let eveningWeather = {};
  for (var i in weatherInfo) {
    if ( weatherInfo[i].time == "18:00") {
      eveningWeather = weatherInfo[i];
      break;
    }
  }

  // get Japanese Prefecture name
  let prefectureName = "";
  for ( var i in capitalToJapanesePrefecture ) {
    if ( eveningWeather.city_name == capitalToJapanesePrefecture[i][0] ) {
      prefectureName = capitalToJapanesePrefecture[i][1];
      console.log(prefectureName);
      break;
    }
  }
  if ( prefectureName == "" ){
    prefectureName = eveningWeather.city_name;
  }

  // get Japanese weather name
  let weatherJp = "";
  for ( var i in weatherToJapanese ){
    if ( eveningWeather.forecast == weatherToJapanese[i][0] ){
      weatherJp = weatherToJapanese[i][1];
      break;
    }
  }
  if ( weatherJp == "" ){
      weatherJp = eveningWeather.forecast;
  }

  reply.push({
    type: "text",
    text: `${prefectureName}における${eveningWeather.date}${eveningWeather.time}の天気は${weatherJp}です。`
  });
  reply.push({
    type: "image",
    originalContentUrl : image_base_url + eveningWeather.icon + ".png",
    previewImageUrl    : image_base_url + eveningWeather.icon + ".png"
  });


  let umbrellaMessage = "";
  switch ( eveningWeather.forecast ) {
    case "Clear":

    case "Clouds":
      umbrellaMessage = `傘を持っていく必要は無いと思われます。`
      break
    default:
      umbrellaMessage = `傘を持って行ったほうがいいかもしれません。`
  }

  reply.push({
    type: "text",
    text: umbrellaMessage
  });

  let result = client.replyMessage(event.replyToken, reply);
  res.json(result);
}


//--------------------------------------------------------------------------------
//  capitalToJapanesePrefecture
//--------------------------------------------------------------------------------
const capitalToJapanesePrefecture = [
  // 北海道・東北
  ["Sapporo"     , "北海道"],
  ["Aomori"      , "青森"],
  ["Morioka"     , "岩手"],
  ["Sendai"      , "宮城"],
  ["Akita"       , "秋田"],
  ["Yamagata"    , "山形"],
  ["Fukushima"   , "福島"],
  // 関東
  ["Tokyo"       , "東京"],
  ["Chiba"       , "千葉"],
  ["Yokohama"    , "神奈川"],
  ["Saitama"     , "埼玉"],
  ["Utsunomiya"  , "栃木"],
  ["Maebashi"    , "群馬"],
  ["Mito"        , "茨城"],
  // 中部
  ["Shizuoka"    , "静岡"],
  ["Gifu-shi"    , "岐阜"],
  ["Nagoya"      , "愛知"],
  ["Niigata"     , "新潟"],
  ["Toyama"      , "富山"],
  ["Kanazawa"    , "石川"],
  ["Fukui"       , "福井"],
  ["Nagano"      , "長野"],
  ["Yamanashi"   , "山梨"],
  // 近畿
  ["Kobe"        , "兵庫"],
  ["Kyoto"       , "京都"],
  ["Osaka"       , "大阪"],
  ["Wakayama"    , "和歌山"],
  ["Otsu"        , "滋賀"],
  ["Tsu"         , "三重"],
  ["Nara"        , "奈良"],
  // 中国
  ["Yamaguchi"   , "山口"],
  ["Hiroshima"   , "広島"],
  ["Okayama"     , "岡山"],
  ["Matsue"      , "島根"],
  ["Tottori"     , "鳥取"],
  // 四国
  ["Takamatsu"   , "香川"],
  ["Tokushima"   , "徳島"],
  ["Matsuyama"   , "愛媛"],
  ["Kochi-shi"   , "高知"],
  // 九州・沖縄
  ["Kagoshima"   , "鹿児島"],
  ["Kumamoto"    , "熊本"],
  ["Miyazaki"    , "宮崎"],
  ["Oita"        , "大分"],
  ["Fukuoka"     , "福岡"],
  ["Saga"        , "佐賀"],
  ["Nagasaki"    , "長崎"],
  ["Okinawa"     , "沖縄"],
]


//--------------------------------------------------------------------------------
//  weatherToJapanese
//--------------------------------------------------------------------------------
const weatherToJapanese = [
  ["Thunderstorm"   , "雷雨"],
  ["Drizzle"        , "霧雨"],
  ["Rain"           , "雨"],
  ["Snow"           , "雪"],
  //["Atmosphere"     , ""],
  ["Clear"          , "快晴"],
  ["Clouds"         , "曇り"],
];


//--------------------------------------------------------------------------------
//  queryStringToJSON
//--------------------------------------------------------------------------------
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




