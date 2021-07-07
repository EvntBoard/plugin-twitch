import { EvntComClient, EvntComServer } from "evntboard-communicate";
import process from 'process';
import {TwitchModule} from "./TwitchModule";

const { config: { clientId: CLIENT_ID, token: TOKEN } } = JSON.parse(process.argv[2]);

const evntComClient = new EvntComClient(
    (cb: any) => process.on('message', cb),
    (data: any) => process.send(data),
);

const evntComServer = new EvntComServer();

evntComServer.registerOnData((cb: any) => process.on('message', async (data) => {
    const toSend = await cb(data);
    if (toSend) process.send(toSend);
}));

let twitchModule: TwitchModule;

evntComServer.expose("init", async () => {
    twitchModule = new TwitchModule(evntComClient, CLIENT_ID, TOKEN);
    await twitchModule.load();
})

evntComServer.expose("say", twitchModule && twitchModule.say)