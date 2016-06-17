## IBM Watson Speech-to-Text Head-to-Head Comparison

This is a quick-and-dirty, POC-quality utility for comparing the transcription results of IBM Watson Speech-to-Text to 1.) the manually generated ground truth, and 2.) A competitor speech-to-text service.

It uses the IBM Watson SDK and [jsdifflib](https://github.com/cemerick/jsdifflib) to generate a HTML report that shows the side-by-side accuracy and visualization of the transcript word-by-word comparisons.

### Getting Started:

* Get code locally and download library dependencies
```
> git clone https://github.com/JasonKopylec/poc-speech-to-text-head-to-head.git
> cd poc-speech-to-text-head-to-head
> npm install
```

* Add your Watson Speech-to-Text credentials to /input/config.json  (note: this assumes you have already subscribed to the IBM Watson Speech-to-Text service)
```
{
  "watsonSpeechToTextUser": "EDIT_USERNAME",
  "watsonSpeechToTextPass": "EDIT_PASSWORD",
  ...
```

* Run the sample file (/input/test.wav) as a dry run, takes about a minute to run
```
> node app.js
Output:
Calling Watson Speech-to-Text API for file ./input/test.wav
Done. See ./output/report.html
```
* Review the dry run report, ./output/report.html

* Add your data, replace the following files with your own
  * ./input/test.wav  (.wav, .flac and .ogg are supported)
  * ./input/transcript-ground-truth.txt
  * ./input/transcript-competitor.txt

* Delete everything in the ./output folder
```
> rm ./output/*
```

* Run the app  (this will take a while, on average about 50-75% of the time of your recording)
```
> node app.js
```

* Review the real report, ./output/report.html




