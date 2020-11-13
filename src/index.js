const plugin = require('./plugin')
const schema =  require('./schema')
const config =  require('./config')

module.exports = {
  id: 'twitch',
  name: 'Twitch for EvntBoard',
  description: 'Twitch for EvntBoard',
  plugin,
  schema,
  config
}
