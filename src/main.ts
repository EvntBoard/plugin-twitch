import { EvntComClient, EvntComServer } from "evntboard-communicate";
import process from 'process';

const { name, entrypoint } = JSON.parse(process.argv[2]);

process.stdout.write(JSON.stringify({ name, entrypoint }))

const evntComClient = new EvntComClient(
    (cb: any) => process.on('message', cb),
    (data: any) => process.send(data),
);

const evntComServer = new EvntComServer();

evntComServer.registerOnData((cb: any) => process.on('message', async (data) => {
    const toSend = await cb(data);
    if (toSend) process.send(toSend);
}));

evntComServer.expose("init", async () => {
    await evntComClient.notify("newEvent", ['twitch-load']);
    process.stdout.write("INIT")
    await evntComClient.notify("newEvent", ['twitch-loaded']);
})