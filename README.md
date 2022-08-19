# RaceAssist-API
API for saving and retrieving RaceAssist results, betting history, etc.

## Setup

run:

```sh
$ npm run deploy
```

## Usage
> **Note:** * indicates that authentication is required

GET ```https://example.com/v1/result/record/<key>.json```<br>
Retrieves the race result specified by the key.

GET ```https://example.com/v1/result/list```<br>
Get a list of race result keys

POST* ```https://example.com/v1/result/push/<key>```<br>
Send race result

GET* ```https://example.com/v1/bet/record/<key>.json```<br>
Retrieves the betting history specified by the key.

GET* ```https://example.com/v1/bet/list```<br>
Get a list of betting history keys

POST* ```https://example.com/v1/bet/push/<key>```<br>
Send betting history

