const moduleTwitch = require('./module')
const schema =  require('./schema')

module.exports = {
  evntboard: 'twitch',
  name: 'Twitch',
  description: 'Twitch module',
  module: moduleTwitch,
  schema,
  defaultConfig: {
    clientId: 'gp762nuuoqcoxypju8c569th9wz7q5',
    accessToken: '',
  }
}
