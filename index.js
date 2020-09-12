'use strict';
const Discord = require("discord.js");
require('dotenv').config()

const client = new Discord.Client();
const leaderboard = {}
const pg = require('pg');
const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pgClient.connect();


client.login(process.env.TOKEN);
console.log('running');

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }
    console.log(reaction.message);
    let discordid = reaction.message.author.id;
    let name = reaction.message.author.username;
    let query = 'INSERT INTO leader (name, discordid, count) VALUES (' + name + ', ' + discordid + ', 1) ON CONFLICT DO UPDATE SET count = count + 1;'
    console.log(query);
    pgClient.query(query, (err, res) => {
        if (err) throw err;
        console.log(JSON.stringify(res));
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }
        pgClient.end();
    });
});

const prefix = "!";
client.on("message", function(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "reactrank") {
        let query = `SELECT * FROM leader ORDER BY count LIMIT 3;`
        console.log(query);
        pgClient.query(query, (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                console.log(JSON.stringify(row));
            }
            pgClient.end();
            let botReply = 'no';
            message.reply(botReply);
        });
    }
    if (command === "poop") {
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
