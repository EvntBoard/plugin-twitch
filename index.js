const moduleTwitch = require('./module')
const schema =  require('./schema')

module.exports = {
  evntboard: 'twitch',
  name: 'Twitch',
  description: 'Twitch module',
  module: moduleTwitch,
  schema,
  defaultConfig: {
    host: '0.0.0.0',
    port: 4444,
    password: '',
  }
}
