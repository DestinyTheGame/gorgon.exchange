```
Please note that this project and the site has now been deprecated. The code is only 
here for historical purposes and might not work on new environments.
```

# gorgon.exchange

The source code for the `http://gorgon.exchange` URL. 

## Installation

Simply run `npm install` in the root of this repository and create a custom
`config.js` which exports the following configuration values:

- port: Port number to run the server on.
- userAgent: user agent that is send to the reddit server.
- oauth: Your oauth configuration.
- interval: Fetch interval.

## Running

To run the server simply run `npm start`.

## API endpoints

### `/gee`

Access the dump of the Gorgon Exchange Emitter's data which contains the list of
all platforms.

```
GET http://gorgon.exchange/gee
```

### `/gee/:platform`

Access the data dump but filtered by platform. The platforms can either be:

- ps4
- ps
- xbox
- xbox one
- xbox 360

It uses a naieve matching pattern so if you pass in 360, it will still only
return the results for xbox 360.

```
GET http://gorgon.exchange/gee/ps4
```
