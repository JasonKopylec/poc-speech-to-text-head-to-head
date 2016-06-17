var fs = require('fs');
var watsonSdk = require('watson-developer-cloud');

var configFilePath = "./input/config.json";
var Config = {}; 

function step0_loadConfig() {
  fs.readFile(configFilePath, "utf8", function(err, configContent) {
    if (err) throw err;
    Config = JSON.parse(configContent);
    step1_checkForRawWatsonTranscript();
  });
}

function step1_checkForRawWatsonTranscript() {
  // To avoid multiple calls to the Watson API for the same source audio, if the Watson Speech-to-Text raw transcript already exists, we'll use that.

  // Check if the raw watson transcript file exists using fs.stat()
  fs.stat(Config.watsonRawTranscriptFilePath, function(err) {
    if (err) {
      // Raw transcript doesn't exist, call Watson Speech-to-Text API to generate it      
      step2_callWatsonSpeechToTextAPIWithInputAudio();
    } else {
      // Raw transcript exists, so we'll use it and skip calling the Watson API and jump ahead
      console.log("Skipping call to Watson Speech-to-Text API. Using " + Config.watsonRawTranscriptFilePath);
      step4_loadRawWatsonTranscriptFromFile();
    }
  });
}

function step2_callWatsonSpeechToTextAPIWithInputAudio() {
    // Call the Watson API using the Node.js Watson SDK
    
    var audioFilePath = Config.audioFilePath;

    console.log("Calling Watson Speech-to-Text API for file " + audioFilePath);
    
    var watsonSdkParams = {
      username: Config.watsonSpeechToTextUser, 
      password: Config.watsonSpeechToTextPass, 
      version: 'v1'
    };
    var watsonSpeechToText = watsonSdk.speech_to_text(watsonSdkParams);

    var contentType; // See options at https://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/speech-to-text/api/v1/#recognize_audio_sessions18
    if (audioFilePath.endsWith(".wav")) contentType = "audio/wav";
    else if (audioFilePath.endsWith(".flac")) contentType = "audio/flac";
    else if (audioFilePath.endsWith(".ogg")) contentType = "audio/ogg";
    else throw "Unsupported file format " + audioFilePath;

    var watsonSpeechToTextParams = {
      audio: fs.createReadStream(audioFilePath),
      content_type: contentType,
      continuous: true // returns the whole transcript, instead of just the first utterance
    };
    watsonSpeechToText.recognize(watsonSpeechToTextParams, function(err, rawTranscript) {
      if (err) throw err;
      step3_saveRawWatsonTranscript(rawTranscript);
    });
}

function step3_saveRawWatsonTranscript(data) {
  fs.writeFile(Config.watsonRawTranscriptFilePath, JSON.stringify(data, null, 2), "utf8", function(err) {
    if (err) throw err;
    step5_cleanAndSaveWatsonTranscript(data);
  })
}

function step4_loadRawWatsonTranscriptFromFile() {
  fs.readFile(Config.watsonRawTranscriptFilePath, "utf8", function(err, rawTranscript) {
    if (err) throw err;
    step5_cleanAndSaveWatsonTranscript(JSON.parse(rawTranscript));
  });
}

function step5_cleanAndSaveWatsonTranscript(data) {
  // Convert the raw JSON Watson Speech-to-Text results into a one-word-per-line clean text transcript
  /* data example:
    { "results": [{ "alternatives": [ { "confidence": 0.558, 
                                         "transcript": "thank you for calling"
                                       }
                                     ],
                     "final": true
                    }, ...
  */

  if (!data || !data.results) throw "Unable to parse raw transcript: " + JSON.stringify(data);

  var cleanTranscript = "";
  data.results.forEach(function(item) {
    if (!item.alternatives || !item.alternatives[0] || !item.alternatives[0].transcript) throw "Unable to process raw transcript item " + JSON.stringify(item);
    cleanTranscript += " " + item.alternatives[0].transcript.toLowerCase();
  });
  cleanTranscript = cleanTranscript.replace(/\s\s/g, ' ');
  cleanTranscript = cleanTranscript.trim();
  cleanTranscript = cleanTranscript.replace(/\s/g, '\n');
  cleanTranscript += "\n";
  
  fs.writeFile(Config.watsonCleanTranscriptFilePath, cleanTranscript, "utf8", function(err) {
    if (err) throw err;
    step6_loadGroundTruthTranscript({watsonTranscript: cleanTranscript});
  });
}

function step6_loadGroundTruthTranscript(data) {
  fs.readFile(Config.groundTruthTranscriptFilePath, "utf8", function(err, groundTruth) {
    if (err) throw err;
    groundTruth = groundTruth.replace(/\r/g,''); // strip Windows-style line breaks
    data.groundTruthTranscript = groundTruth;
    step7_loadCompetitorTranscript(data);
  });
}

function step7_loadCompetitorTranscript(data) {
  fs.readFile(Config.competitorTranscriptFilePath, "utf8", function(err, competitorTranscript) {
    if (err) throw err;
    competitorTranscript = competitorTranscript.replace(/\r/g,''); // strip Windows-style line breaks
    data.competitorTranscript = competitorTranscript;
    step8_loadReportTemplate(data);
  });
}

function step8_loadReportTemplate(data) {
  fs.readFile(Config.reportTemplateFilePath, "utf8", function(err, reportTemplate) {
    if (err) throw err;
     step9_generateAndSaveReport(reportTemplate, data);
  }); 
}

function step9_generateAndSaveReport(reportTemplate, data) {
  var report = reportTemplate.replace("/// DATA PLACEHOLDER ///", "data = " + JSON.stringify(data));
  fs.writeFile(Config.reportFilePath, report, "utf8", function(err) {
    if (err) throw err;
    step10_finish();
  })
}

function step10_finish() {
  console.log("\nDone. See " + Config.reportFilePath);
}

function main() {
  step0_loadConfig();
}
main();




























// function fileExists(path) {
//   try {
//     fs.statSync(path);
//     return true;
//   } catch (err) {
//     return false;
//   }
// }

// function generateWatsonTranscript(data) {
//   return new Promise(function (fufill, reject) { 
//     // Skip call to Watson API if transcript already exists
//     if (fileExists(Config.watsonTranscriptFilePath)) {
//       console.log("Skipped Watson API call. Using existing " + Config.watsonTranscriptFilePath)
//       fufill(data);
//       return;
//     }

//     // Call the Watson API using the Node.js Watson SDK
//     console.log("Calling Watson Speech-to-Text API");
//     var audioFilePath = Config.audioFilePath;

//     var contentType;
//     if (audioFilePath.endsWith(".wav")) contentType = "audio/l16; rate=44100";
//     else if (audioFilePath.endsWith(".flac")) contentType = "";
//     else if (audioFilePath.endsWith(".ogg")) contentType = "";
//     else throw "Unsupported file format " + audioFilePath;


//     var watsonSdkParams = {
//       username: Config.watsonSpeechToTextUser, 
//       password: Config.watsonSpeechToTextPass, 
//       version: 'v1'
//     };
//     var watsonSpeechToText = watsonSdk.speech_to_text(watsonSdkParams);

//     var watsonSpeechToTextParams = {
//       audio: fs.createReadStream(audioFilePath),
//       content_type: contentType,
//       continuous: true // returns the whole transcript, instead of just the first utterance
//     };
//     watsonSpeechToText.recognize(watsonSpeechToTextParams, function(err, res) {
//       if (err) {
//         reject(err);
//         return;
//       }

//       res = res.toLowerCase().replace(/ /, "\n");
//       fs.writeFile()

//       console.log(res);      
//     });
//   });
// }

// function loadFileIntoMember(data, memberName, filePath) {  
//     return new Promise(function (fufill, reject) {      
//       fs.readFile(filePath, "utf8", function (err, res){
//         console.log("Loading " + memberName + " (" + filePath + ")");
        
//         if (err) {
//           reject(err);
//           return;
//         }
                
//         res = res.replace(/(?:\r)/g, ''); // remove Windows-style line breaks
//         res = res.toLowerCase();

//         data[memberName] = res;

//         fufill(data);
//       });      
//     });
// }

// function loadWatsonTranscript(data) {
//   return loadFileIntoMember(data, "watsonTranscript", Config.watsonTranscriptFilePath);
// }

// function loadCompetitorTranscript(data) {
//   return loadFileIntoMember(data, "competitorTranscript", Config.competitorTranscriptFilePath);
// }

// function loadGroundTruthTranscript(data) {
//   return loadFileIntoMember(data, "groundTruthTranscript", Config.groundTruthTranscriptFilePath);
// }

// function generateReport(data) {
//   return new Promise(function(fufill, reject) {    
//     fs.readFile(Config.reportTemplateFilePath, "utf8", function (err, res){
//         console.log("Generate report markup");
        
//         if (err) {
//           reject(err);
//           return;
//         }

//         var markup = res.replace("/// DATA PLACEHOLDER ///", "data = " + JSON.stringify(data));
//         data.reportMarkup = markup;
//         fufill(data);
//       });      
//   });
// }

// function saveReport(data) {
//   return new Promise(function(fufill, reject) {
    
//     if (!data.reportMarkup) {
//       reject("data.reportMarkup is missing. Cannot save report.");
//       return;
//     }
    
//     console.log("Writing report to " + Config.reportFilePath);
    
//     fs.writeFile(Config.reportFilePath, data.reportMarkup, "utf8", function(err) {
//       if (err) {
//         reject(err);
//         return;
//       }
//       console.log("\nDone. See " + Config.reportFilePath)
//       fufill(data);
//     });    
//   });
// }

// Promise.resolve({})
// .then(checkWatsonTranscriptExist)
// .then(callWatsonSpeechToText)
// .then(saveWatsonSpeechToTextRawTranscript)
// .then()

// .then(generateWatsonTranscript)
// .then(loadWatsonTranscript)
// .then(loadCompetitorTranscript)
// .then(loadGroundTruthTranscript)
// .then(generateReport)
// .then(saveReport)
// .done();