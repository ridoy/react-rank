'use strict';
const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client();
const leaderboard = {}

client.login(config.BOT_TOKEN);
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }
    let author = reaction.message.author.username;
    if (leaderboard[author]) {
        leaderboard[author] += 1;
    } else {
        leaderboard[author] = 1;
    }
    console.log(leaderboard);
});

const prefix = "!";
client.on("message", function(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "reactrank") {
        let arr = [];
        for (let key in leaderboard) {
            arr.push([leaderboard[key], key]);
        }
        console.log(arr);
        arr.sort((a,b) => { return b[0] - a[0] });
        console.log(arr);

        let botReply = "";
        let ranks = ""
        if (arr.length < 3) {
            let i = 1;
            for (let item of arr)  {
                ranks += `${i}. ${item[1]} with ${item[0]} reacts\n`
                i++;
            }
        } else {
            let first = arr[0]
            let second = arr[1]
            let third = arr[2]
            ranks += `1. ${first[1]} with ${first[0]} reacts\n`
            ranks += `2. ${second[1]} with ${second[0]} reacts\n`
            ranks += `3. ${third[1]} with ${third[0]} reacts`
        }
        botReply = `The leaders of this server are:\n ${ranks}`
        message.reply(botReply);
    }
});
