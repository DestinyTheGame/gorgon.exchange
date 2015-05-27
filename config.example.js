//
// Example configuration for the gorgon exchange. Please replace the {....}
// placeholders with your own information. If you do not have an reddit API key
// you can get it from:
//
// https://www.reddit.com/prefs/apps
//
module.exports = {
  "userAgent": "gorgon.exchange@"+ require('./package.json').version +" /u/{your-username}",
  "analytics": "UA-62797605-1",
  "interval": 30000,
  "port": 8080,
  "oauth": {
    "type": "implicit",
    "key": "{reddit key}",
    "secret": "{reddit secret}",
    "username": "{reddit username}",
    "password": "{reddit password}",
    "redirectUri": "http://gorgon.exchange",
    "scope": [
      "read"
    ]
  }
};
