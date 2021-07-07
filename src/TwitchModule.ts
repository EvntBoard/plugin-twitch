import {ApiClient, CommercialLength, UserIdResolvable, UserNameResolvable} from 'twitch';
import {StaticAuthProvider} from 'twitch-auth';
import {ChatClient} from 'twitch-chat-client';
import {PubSubClient, PubSubListener} from 'twitch-pubsub-client';
import {HelixBitsLeaderboardQuery} from 'twitch/lib/API/Helix/Bits/HelixBitsApi';
import {HelixClipFilter} from 'twitch/lib/API/Helix/Clip/HelixClipApi';
import {HelixFollowFilter} from 'twitch/lib/API/Helix/User/HelixFollow';
import {EvntComClient} from "evntboard-communicate";
import process from "process";

export class TwitchModule {
    private clientId: any;
    private accessToken: any;
    private chatClient: ChatClient;
    private pubSubClient: PubSubClient;
    private currentChannel: string;
    private currentId: string;
    private cpListener: PubSubListener<never>;
    private bitsListener: PubSubListener<never>;
    private apiClient: ApiClient;
    private client: EvntComClient;

    constructor(client: EvntComClient, clientId: string, accessToken: string) {
        this.client = client;
        this.clientId = clientId;
        this.accessToken = accessToken;
        this.apiClient = null
        this.chatClient = null
        this.pubSubClient = null
        this.currentChannel = null
        this.currentId = null
        this.cpListener = null
        this.bitsListener = null
    }

    async load() {
        try {
            const authProvider = new StaticAuthProvider(this.clientId, this.accessToken);
            this.apiClient = new ApiClient({authProvider})
            this.pubSubClient = new PubSubClient()
            await this.pubSubClient.registerUserListener(this.apiClient)

            const {name, id} = await this.apiClient.helix.users.getMe(false)

            this.currentChannel = name
            this.currentId = id

            this.chatClient = new ChatClient(authProvider, {channels: [this.currentChannel]});

            console.log({ twitch: "passe", name, id })

            this.chatClient.connect().then(() => {
                console.log("connect")
                this.client.notify("newEvent", ['twitch-chat-open'])
            }).catch((e) => {
                console.error(e)
            }).finally(() => {
                console.log("aze")
            })

            this.chatClient.onConnect(() => {
                console.log("onConnect")
                this.client.notify("newEvent", ['twitch-open'])
            })

            this.chatClient.onDisconnect(() => {
                this.client.notify("newEvent", ['twitch-close'])
            })

            // Fires when a user redeems channel points
            this.cpListener = await this.pubSubClient.onRedemption(this.currentId, msg => {
                this.client.notify("newEvent", ['twitch-channel-point-redeem', {
                    user: msg.userName,
                    title: msg.rewardName,
                    message: msg.message,
                    msg
                }])
            })

            this.bitsListener = await this.pubSubClient.onBits(this.currentId, msg => {
                this.client.notify("newEvent", ['twitch-bits', {
                    user: msg.userName,
                    ammount: msg.bits,
                    message: msg.message,
                    msg
                }])
            })

            // Fires when a user sends a message to a channel.
            this.chatClient.onMessage(async (channel, user, message, msg) => {
                await this.client.notify("newEvent", ['twitch-message', {user, message, msg}])
            })

            // Fires when a user sends an action (/me) to a channel.
            this.chatClient.onAction(async (channel, user, message, msg) => {
                await this.client.notify("newEvent", ['twitch-action', {user, message, msg}])
            })

            // Fires when a user is permanently banned from a channel.
            this.chatClient.onBan(async (channel, user) => {
                await this.client.notify("newEvent", ['twitch-ban', {user}])
            })

            // Fires when a user upgrades their bits badge in a channel.
            this.chatClient.onBitsBadgeUpgrade(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-bits-badge-upgrade', {user, info, msg}])
            })

            // Fires when the chat of a channel is cleared.
            this.chatClient.onChatClear(async (user) => {
                await this.client.notify("newEvent", ['twitch-chat-clear', {user}])
            })

            // Fires when a user pays forward a subscription that was gifted to them to the community.
            this.chatClient.onCommunityPayForward(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-community-pay-forward', {user, info, msg}])
            })

            // Fires when a user gifts random subscriptions to the community of a channel.
            this.chatClient.onCommunitySub(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-community-sub', {user, info, msg}])
            })

            // Fires when emote-only mode is toggled in a channel.
            this.chatClient.onEmoteOnly(async (channel, enabled) => {
                await this.client.notify("newEvent", ['twitch-emote-only', {enabled}])
            })

            // Fires when followers-only mode is toggled in a channel.
            this.chatClient.onFollowersOnly(async (channel, enabled, delay) => {
                await this.client.notify("newEvent", ['twitch-follower-only', {enabled, delay}])
            })

            // Fires when a user upgrades their gift subscription to a paid subscription in a channel.
            this.chatClient.onGiftPaidUpgrade(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-gift-paid-upgrade', {user, info, msg}])
            })

            // Fires when a channel hosts another channel.
            this.chatClient.onHost(async (channel, target, viewers) => {
                await this.client.notify("newEvent", ['twitch-host', {target, viewers}])
            })

            // Fires when a channel you're logged in as its owner is being hosted by another channel.
            this.chatClient.onHosted(async (channel, byChannel, auto, viewers) => {
                await this.client.notify("newEvent", ['twitch-hosted', {channel: byChannel, auto, viewers}])
            })

            // Fires when Twitch tells you the number of hosts you have remaining in the next half hour for the channel for which you're logged in as owner after hosting a channel.
            this.chatClient.onHostsRemaining(async (channel, numberOfHosts) => {
                await this.client.notify("newEvent", ['twitch-hosts-remaining', {numberOfHosts}])
            })

            // Fires when a user joins a channel.
            this.chatClient.onJoin(async (channel, user) => {
                await this.client.notify("newEvent", ['twitch-join', {user}])
            })

            // Fires when a user sends a message to a channel.
            this.chatClient.onPart(async (channel, user) => {
                await this.client.notify("newEvent", ['twitch-part', {user}])
            })

            // Fires when a user gifts a Twitch Prime benefit to the channel.
            this.chatClient.onPrimeCommunityGift(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-prime-community-gift', {user, info, msg}])
            })

            // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
            this.chatClient.onPrimePaidUpgrade(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-prime-paid-upgrade', {user, info, msg}])
            })

            // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
            this.chatClient.onR9k(async (channel, enabled) => {
                await this.client.notify("newEvent", ['twitch-r9k', {enabled}])
            })

            // Fires when a user raids a channel.
            this.chatClient.onRaid(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-raid', {user, info, msg}])
            })

            // Fires when a user cancels a raid.
            this.chatClient.onRaidCancel(async (channel, msg) => {
                await this.client.notify("newEvent", ['twitch-raid-cancel', {msg}])
            })

            // Fires when a user resubscribes to a channel.
            this.chatClient.onResub(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-resub', {user, info, msg}])
            })

            // Fires when a user gifts rewards during a special event.
            this.chatClient.onRewardGift(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-reward-gift', {user, info, msg}])
            })

            // Fires when a user performs a "ritual" in a channel. WTF ?!
            this.chatClient.onRitual(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-ritual', {user, info, msg}])
            })

            // Fires when slow mode is toggled in a channel.
            this.chatClient.onSlow(async (channel, enabled, delay) => {
                await this.client.notify("newEvent", ['twitch-slow', {enabled, delay}])
            })

            // Fires when a user pays forward a subscription that was gifted to them to a specific user.
            this.chatClient.onStandardPayForward(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-standard-pay-forward', {user, info, msg}])
            })

            // Fires when a user subscribes to a channel.
            this.chatClient.onSub(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-sub', {user, info, msg}])
            })

            // Fires when a user extends their subscription using a Sub Token.
            this.chatClient.onSubExtend(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-sub-extend', {user, info, msg}])
            })

            // Fires when a user gifts a subscription to a channel to another user.
            this.chatClient.onSubGift(async (channel, user, info, msg) => {
                await this.client.notify("newEvent", ['twitch-sub-gift', {user, info, msg}])
            })

            // Fires when sub only mode is toggled in a channel.
            this.chatClient.onSubsOnly(async (channel, enabled) => {
                await this.client.notify("newEvent", ['twitch-subs-only', {enabled}])
            })

            // Fires when a user is timed out from a channel.
            this.chatClient.onTimeout(async (channel, user, duration) => {
                await this.client.notify("newEvent", ['twitch-timeout', {user, duration}])
            })

            // Fires when host mode is disabled in a channel.
            this.chatClient.onUnhost(async (channel) => {
                await this.client.notify("newEvent", ['twitch-unhost', {channel}])
            })

            // Fires when receiving a whisper from another user.
            this.chatClient.onWhisper(async (user, message, msg) => {
                await this.client.notify("newEvent", ['twitch-whisper', {user, message, msg}])
            })
        } catch (e) {
            await this.client.notify("newEvent", ['twitch-error'])
            process.stdout.write(e.message)
        }
    }

    async unload() {
        if (this.chatClient) {
            this.chatClient?.quit();
        }

        if (this.cpListener) {
            this.cpListener?.remove()
        }

        if (this.bitsListener) {
            this.bitsListener?.remove()
        }

        this.apiClient = null
        this.chatClient = null
        this.currentChannel = null
        this.currentId = null
        this.pubSubClient = null
        this.cpListener = null
        this.bitsListener = null
        await this.client.notify("newEvent", ['twitch-unload']);
    }

    async reload() {
        await this.unload();
        await this.load();
    }

    // METHODS

    say(message: string) {
        this.chatClient.say(this.currentChannel, message)
    }

    me(message: string) {
        this.chatClient.action(this.currentChannel, message)
    }

    whisper(user: string, message: string) {
        this.chatClient.whisper(user, message)
    }

    // BITS
    async bitsGetLeaderboard(params: HelixBitsLeaderboardQuery) {
        return await this.apiClient.helix.bits.getLeaderboard(params)
    }

    // CLIPS
    async clipsCreateClip() {
        return await this.apiClient.helix.clips.createClip({channelId: this.currentId})
    }

    async clipsGetClipById(id: string) {
        return await this.apiClient.helix.clips.getClipById(id)
    }

    async clipsGetClipsForBroadcaster(filter: HelixClipFilter) {
        return await this.apiClient.helix.clips.getClipsForBroadcaster(this.currentId, filter)
    }

    // GAMES
    async gamesGetGameById(id: string) {
        return await this.apiClient.helix.games.getGameById(id)
    }

    async gamesGetGameByName(name: string) {
        return await this.apiClient.helix.games.getGameByName(name)
    }

    async gamesGetTopGames(pagination: string[]) {
        return await this.apiClient.helix.games.getGamesByNames(pagination)
    }

    // MODERATION
    async moderationCheckUserBan(user: UserIdResolvable) {
        return await this.apiClient.helix.moderation.checkUserBan(this.currentChannel, user)
    }

    async moderationCheckUserMod(user: UserIdResolvable) {
        return await this.apiClient.helix.moderation.checkUserMod(this.currentChannel, user)
    }

    // USERS
    async usersGetFollows(filter: HelixFollowFilter) {
        return await this.apiClient.helix.users.getFollows(filter)
    }

    async usersGetMe() {
        return await this.apiClient.helix.users.getMe()
    }

    async usersGetUserByName(user: UserNameResolvable) {
        return await this.apiClient.helix.users.getUserByName(user)
    }

    // pub
    async runCommercial(duration: CommercialLength) {
        return await this.chatClient.runCommercial(this.currentChannel, duration)
    }
}