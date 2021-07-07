import process from 'process';
import { EvntComClient, EvntComServer } from "evntboard-communicate";
import {ChatClient} from '@twurple/chat';
import {PubSubClient, PubSubListener} from "@twurple/pubsub";
import {ApiClient, HelixPrivilegedUser} from '@twurple/api';
import {StaticAuthProvider} from '@twurple/auth';

// parse params
const { config: { clientId: CLIENT_ID, token: TOKEN } } = JSON.parse(process.argv[2]);

// create Client and Server COM
const evntComClient = new EvntComClient(
    (cb: any) => process.on('message', cb),
    (data: any) => process.send(data),
    100000
);

const evntComServer = new EvntComServer();

evntComServer.registerOnData((cb: any) => process.on('message', async (data) => {
    const toSend = await cb(data);
    if (toSend) process.send(toSend);
}));

// real starting

let chatClient: ChatClient;
let pubSubClient: PubSubClient;
let currentUser: HelixPrivilegedUser;
let cpListener: PubSubListener<never>;
let bitsListener: PubSubListener<never>;
let apiClient: ApiClient;

evntComServer.expose("init", async () => {
    const authProvider = new StaticAuthProvider(CLIENT_ID, TOKEN);
    apiClient = new ApiClient({authProvider})
    pubSubClient = new PubSubClient()
    await pubSubClient.registerUserListener(authProvider)

    currentUser = await apiClient.helix.users.getMe(false)

    chatClient = new ChatClient(authProvider, { channels: [currentUser.name] });

    chatClient.onConnect(() => {
        evntComClient?.notify("newEvent", ['twitch-open'])
    })

    chatClient.onDisconnect(() => {
        evntComClient?.notify("newEvent", ['twitch-close'])
    })

    // Fires when a user redeems channel points
    cpListener = await pubSubClient.onRedemption(currentUser.id, msg => {
        evntComClient?.notify("newEvent", ['twitch-channel-point-redeem', {
            user: msg.userName,
            title: msg.rewardTitle,
            message: msg.message,
            msg
        }])
    })

    bitsListener = await pubSubClient.onBits(currentUser.id, msg => {
        evntComClient?.notify("newEvent", ['twitch-bits', {
            user: msg.userName,
            ammount: msg.bits,
            message: msg.message,
            msg
        }])
    })

    // Fires when a user sends a message to a channel.
    chatClient.onMessage(async (channel, user, message, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-message', {user, message, msg}])
    })

    // Fires when a user sends an action (/me) to a channel.
    chatClient.onAction(async (channel, user, message, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-action', {user, message, msg}])
    })

    // Fires when a user is permanently banned from a channel.
    chatClient.onBan(async (channel, user) => {
        await evntComClient?.notify("newEvent", ['twitch-ban', {user}])
    })

    // Fires when a user upgrades their bits badge in a channel.
    chatClient.onBitsBadgeUpgrade(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-bits-badge-upgrade', {user, info, msg}])
    })

    // Fires when the chat of a channel is cleared.
    chatClient.onChatClear(async (user) => {
        await evntComClient?.notify("newEvent", ['twitch-chat-clear', {user}])
    })

    // Fires when a user pays forward a subscription that was gifted to them to the community.
    chatClient.onCommunityPayForward(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-community-pay-forward', {user, info, msg}])
    })

    // Fires when a user gifts random subscriptions to the community of a channel.
    chatClient.onCommunitySub(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-community-sub', {user, info, msg}])
    })

    // Fires when emote-only mode is toggled in a channel.
    chatClient.onEmoteOnly(async (channel, enabled) => {
        await evntComClient?.notify("newEvent", ['twitch-emote-only', {enabled}])
    })

    // Fires when followers-only mode is toggled in a channel.
    chatClient.onFollowersOnly(async (channel, enabled, delay) => {
        await evntComClient?.notify("newEvent", ['twitch-follower-only', {enabled, delay}])
    })

    // Fires when a user upgrades their gift subscription to a paid subscription in a channel.
    chatClient.onGiftPaidUpgrade(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-gift-paid-upgrade', {user, info, msg}])
    })

    // Fires when a channel hosts another channel.
    chatClient.onHost(async (channel, target, viewers) => {
        await evntComClient?.notify("newEvent", ['twitch-host', {target, viewers}])
    })

    // Fires when a channel you're logged in as its owner is being hosted by another channel.
    chatClient.onHosted(async (channel, byChannel, auto, viewers) => {
        await evntComClient?.notify("newEvent", ['twitch-hosted', {channel: byChannel, auto, viewers}])
    })

    // Fires when Twitch tells you the number of hosts you have remaining in the next half hour for the channel for which you're logged in as owner after hosting a channel.
    chatClient.onHostsRemaining(async (channel, numberOfHosts) => {
        await evntComClient?.notify("newEvent", ['twitch-hosts-remaining', {numberOfHosts}])
    })

    // Fires when a user joins a channel.
    chatClient.onJoin(async (channel, user) => {
        await evntComClient?.notify("newEvent", ['twitch-join', {user}])
    })

    // Fires when a user sends a message to a channel.
    chatClient.onPart(async (channel, user) => {
        await evntComClient?.notify("newEvent", ['twitch-part', {user}])
    })

    // Fires when a user gifts a Twitch Prime benefit to the channel.
    chatClient.onPrimeCommunityGift(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-prime-community-gift', {user, info, msg}])
    })

    // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
    chatClient.onPrimePaidUpgrade(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-prime-paid-upgrade', {user, info, msg}])
    })

    // Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
    chatClient.onR9k(async (channel, enabled) => {
        await evntComClient?.notify("newEvent", ['twitch-r9k', {enabled}])
    })

    // Fires when a user raids a channel.
    chatClient.onRaid(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-raid', {user, info, msg}])
    })

    // Fires when a user cancels a raid.
    chatClient.onRaidCancel(async (channel, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-raid-cancel', {msg}])
    })

    // Fires when a user resubscribes to a channel.
    chatClient.onResub(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-resub', {user, info, msg}])
    })

    // Fires when a user gifts rewards during a special event.
    chatClient.onRewardGift(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-reward-gift', {user, info, msg}])
    })

    // Fires when a user performs a "ritual" in a channel. WTF ?!
    chatClient.onRitual(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-ritual', {user, info, msg}])
    })

    // Fires when slow mode is toggled in a channel.
    chatClient.onSlow(async (channel, enabled, delay) => {
        await evntComClient?.notify("newEvent", ['twitch-slow', {enabled, delay}])
    })

    // Fires when a user pays forward a subscription that was gifted to them to a specific user.
    chatClient.onStandardPayForward(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-standard-pay-forward', {user, info, msg}])
    })

    // Fires when a user subscribes to a channel.
    chatClient.onSub(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-sub', {user, info, msg}])
    })

    // Fires when a user extends their subscription using a Sub Token.
    chatClient.onSubExtend(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-sub-extend', {user, info, msg}])
    })

    // Fires when a user gifts a subscription to a channel to another user.
    chatClient.onSubGift(async (channel, user, info, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-sub-gift', {user, info, msg}])
    })

    // Fires when sub only mode is toggled in a channel.
    chatClient.onSubsOnly(async (channel, enabled) => {
        await evntComClient?.notify("newEvent", ['twitch-subs-only', {enabled}])
    })

    // Fires when a user is timed out from a channel.
    chatClient.onTimeout(async (channel, user, duration) => {
        await evntComClient?.notify("newEvent", ['twitch-timeout', {user, duration}])
    })

    // Fires when host mode is disabled in a channel.
    chatClient.onUnhost(async (channel) => {
        await evntComClient?.notify("newEvent", ['twitch-unhost', {channel}])
    })

    // Fires when receiving a whisper from another user.
    chatClient.onWhisper(async (user, message, msg) => {
        await evntComClient?.notify("newEvent", ['twitch-whisper', {user, message, msg}])
    })
    
    await chatClient.connect()
});

evntComServer.expose("say", async (message: string) => {
    await chatClient?.say(currentUser.name, message)
})

evntComServer.expose("me", (message: string) => chatClient?.action(currentUser.name, message))

evntComServer.expose("whisper", (user: string, message: string) => chatClient?.whisper(user, message))