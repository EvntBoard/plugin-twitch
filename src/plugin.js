const { ApiClient } = require('twitch')
const { StaticAuthProvider } = require('twitch-auth')
const { ChatClient } = require('twitch-chat-client')
const { PubSubClient } = require('twitch-pubsub-client')

class TwitchEvntBoard {
  constructor(options, { evntBus, logger }) {
    this.clientId = options.clientId;
    this.accessToken = options.accessToken;
    this.evntBus = evntBus;
    this.logger = logger;
    this.apiClient = null
    this.chatClient = null
    this.pubSubClient = null
    this.currentChannel = null
    this.currentId = null
    this.cpListener = null
  }

  async load() {
    try {
      this.evntBus?.newEvent('twitch-load')
      const authProvider = new StaticAuthProvider(this.clientId, this.accessToken);
      this.apiClient = new ApiClient({ authProvider })
      this.pubSubClient = new PubSubClient()
      const userId = await this.pubSubClient.registerUserListener(this.apiClient)


      const { _data: { login, id } }  = await this.apiClient.helix.users.getMe(false)

      this.currentChannel = login
      this.currentId = id

      this.chatClient = new ChatClient(authProvider, { channels: [this.currentChannel] });

      this.chatClient.onConnect(() => {
        this.evntBus?.newEvent('twitch-open')
      })

      this.chatClient.onDisconnect(() => {
        this.evntBus?.newEvent('twitch-close')
      })

      // Fires when a user redeems channel points
      this.cpListener = await this.pubSubClient.onRedemption(userId, message => {
        this.evntBus?.newEvent('twitch-channel-point-redeem', {userId, message})
      })

      // Fires when a user sends a message to a channel.
      this.chatClient.onMessage(async (channel, user, message, msg) => {
        this.evntBus?.newEvent('twitch-message', { user, message, msg })
      })

      // Fires when a user sends an action (/me) to a channel.
      this.chatClient.onAction(async (channel, user, message, msg) => {
        this.evntBus?.newEvent('twitch-action', { user, message, msg })
      })

      // Fires when a user is permanently banned from a channel.
      this.chatClient.onBan(async (channel, user) => {
        this.evntBus?.newEvent('twitch-ban', { user })
      })

      // Fires when a user upgrades their bits badge in a channel.
      this.chatClient.onBitsBadgeUpgrade(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-bits-badge-upgrade', { user, info, msg })
      })

      // Fires when the chat of a channel is cleared.
      this.chatClient.onChatClear(async (channel, user) => {
        this.evntBus?.newEvent('twitch-chat-clear', { user })
      })

      // Fires when a user pays forward a subscription that was gifted to them to the community.
      this.chatClient.onCommunityPayForward(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-community-pay-forward', { user, info, msg })
      })

      // Fires when a user gifts random subscriptions to the community of a channel.
      this.chatClient.onCommunitySub(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-community-sub', { user, info, msg })
      })

      // Fires when emote-only mode is toggled in a channel.
      this.chatClient.onEmoteOnly(async (channel, enabled) => {
        this.evntBus?.newEvent('twitch-emote-only', { enabled })
      })

      // Fires when followers-only mode is toggled in a channel.
      this.chatClient.onFollowersOnly(async (channel, enabled, delay) => {
        this.evntBus?.newEvent('twitch-follower-only', { enabled, delay })
      })

      // Fires when a user upgrades their gift subscription to a paid subscription in a channel.
      this.chatClient.onGiftPaidUpgrade(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-gift-paid-upgrade', { user, info, msg })
      })

      // Fires when a channel hosts another channel.
      this.chatClient.onHost(async (channel, target, viewers) => {
        this.evntBus?.newEvent('twitch-host', { target, viewers })
      })

      // Fires when a channel you're logged in as its owner is being hosted by another channel.
      this.chatClient.onHosted(async (channel, byChannel, auto, viewers) => {
        this.evntBus?.newEvent('twitch-hosted', { channel, auto, viewers })
      })

      // Fires when Twitch tells you the number of hosts you have remaining in the next half hour for the channel for which you're logged in as owner after hosting a channel.
      this.chatClient.onHostsRemaining(async (channel, numberOfHosts) => {
        this.evntBus?.newEvent('twitch-hosts-remaining', { numberOfHosts })
      })

      // Fires when a user joins a channel.
      this.chatClient.onJoin(async (channel, user) => {
        this.evntBus?.newEvent('twitch-join', { user })
      })

      // Fires when a user sends a message to a channel.
      this.chatClient.onPart(async (channel, user) => {
        this.evntBus?.newEvent('twitch-part', { user })
      })

      // Fires when a user gifts a Twitch Prime benefit to the channel.
      this.chatClient.onPrimeCommunityGift(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-prime-community-gift', { user, info, msg })
      })

      // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
      this.chatClient.onPrimePaidUpgrade(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-prime-paid-upgrade', { user, info, msg })
      })

      // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
      this.chatClient.onR9k(async (channel, enabled) => {
        this.evntBus?.newEvent('twitch-r9k', { enabled })
      })

      // Fires when a user raids a channel.
      this.chatClient.onRaid(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-raid', { user, info, msg })
      })

      // Fires when a user cancels a raid.
      this.chatClient.onRaidCancel(async (channel, msg) => {
        this.evntBus?.newEvent('twitch-raid-cancel', { msg })
      })

      // Fires when a user resubscribes to a channel.
      this.chatClient.onResub(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-resub', { user, info, msg })
      })

      // Fires when a user gifts rewards during a special event.
      this.chatClient.onRewardGift(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-reward-gift', { user, info, msg })
      })

      // Fires when a user performs a "ritual" in a channel. WTF ?!
      this.chatClient.onRitual(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-ritual', { user, info, msg })
      })

      // Fires when slow mode is toggled in a channel.
      this.chatClient.onSlow(async (channel, enabled, delay) => {
        this.evntBus?.newEvent('twitch-slow', { enabled, delay })
      })

      // Fires when a user pays forward a subscription that was gifted to them to a specific user.
      this.chatClient.onStandardPayForward(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-standard-pay-forward', { user, info, msg })
      })

      // Fires when a user subscribes to a channel.
      this.chatClient.onSub(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-sub', { user, info, msg })
      })

      // Fires when a user extends their subscription using a Sub Token.
      this.chatClient.onSubExtend(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-sub-extend', { user, info, msg })
      })

      // Fires when a user gifts a subscription to a channel to another user.
      this.chatClient.onSubGift(async (channel, user, info, msg) => {
        this.evntBus?.newEvent('twitch-sub-gift', { user, info, msg })
      })

      // Fires when sub only mode is toggled in a channel.
      this.chatClient.onSubsOnly(async (channel, enabled) => {
        this.evntBus?.newEvent('twitch-subs-only', { enabled })
      })

      // Fires when a user is timed out from a channel.
      this.chatClient.onTimeout(async (channel, user, duration) => {
        this.evntBus?.newEvent('twitch-timeout', { user, duration })
      })

      // Fires when host mode is disabled in a channel.
      this.chatClient.onUnhost(async (channel) => {
        this.evntBus?.newEvent('twitch-unhost', { channel })
      })

      // Fires when receiving a whisper from another user.
      this.chatClient.onWhisper(async (user, message, msg) => {
        this.evntBus?.newEvent('twitch-whisper', { user, message, msg })
      })

      this.chatClient.connect().then(() => {
        this.evntBus?.newEvent('twitch-chat-open')
      })

    } catch (e) {
      this.evntBus?.newEvent('twitch-error')
      this.logger.error(e)
    }
  }

  async unload() {
    if (this.chatClient) {
      this.chatClient?.quit();
    }
    this.apiClient = null
    this.chatClient = null
    this.currentChannel = null
    this.currentId = null
    this.pubSubClient = null
    this.cpListener.remove()
    this.cpListener = null
    this.evntBus?.newEvent('twitch-unload');
  }

  async reload() {
    await this.unload();
    await this.load();
  }

  // METHODS

  say(message) {
    this.chatClient.say(this.currentChannel, message)
  }

  me(message) {
    this.chatClient.action(this.currentChannel, message)
  }

  whisper(user, message) {
    this.chatClient.whisper(user, message)
  }

  // BITS
  async bitsGetLeaderboard(params) {
    return await this.apiClient.helix.bits.getLeaderboard(params)
  }

  // CLIPS
  async clipsCreateClip() {
    return await this.apiClient.helix.clips.createClip({ channelId: this.currentId })
  }

  async clipsGetClipById(id) {
    return await this.apiClient.helix.clips.getClipById(id)
  }

  async clipsGetClipsForBroadcaster(filter) {
    return await this.apiClient.helix.clips.getClipsForBroadcaster(this.currentId, filter)
  }

  // GAMES
  async gamesGetGameById(id) {
    return await this.apiClient.helix.games.getGameById(id)
  }

  async gamesGetGameByName(name) {
    return await this.apiClient.helix.games.getGameByName(name)
  }

  async gamesGetTopGames(pagination) {
    return await this.apiClient.helix.games.getGamesByNames(pagination)
  }

  // MODERATION
  async moderationCheckUserBan(user) {
    return await this.apiClient.helix.moderation.checkUserBan(this.currentChannel, user)
  }

  async moderationCheckUserMod(user) {
    return await this.apiClient.helix.moderation.checkUserMod(this.currentChannel, user)
  }

  // USERS
  async usersGetFollows(filter) {
    return await this.apiClient.helix.users.getFollows(filter)
  }

  async usersGetMe() {
    return await this.apiClient.helix.users.getMe()
  }

  async usersGetUserByName(user) {
    return await this.apiClient.helix.users.getUserByName(user)
  }

  // pub
  async runCommercial(duration) {
    return await this.chatClient.runCommercial(this.currentChannel, duration)
  }
}

module.exports = TwitchEvntBoard
