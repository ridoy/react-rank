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
    let discordid = reaction.message.author.id;
    let name = reaction.message.author.username;
    let query = `INSERT INTO leader (name, discordid) VALUES ('${name}', '${discordid}') ON CONFLICT (discordid) DO UPDATE SET count = leader.count + 1;`
    console.log(query);
    pgClient.query(query, (err, res) => {
        if (err) throw err;
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
        let query = `SELECT * FROM leader ORDER BY count DESC LIMIT 5;`
        pgClient.query(query, (err, res) => {
            if (err) throw err;
            let i = 1;
            let str = '```\nTHE LEADERBOARD!!!';
            for (let row of res.rows) {
                str += `${i}. ${row['name']} with ${row['count']} reacts\n`;
                i++;
            }
            str += '```';
            message.channel.send(str);
        });
    }
});
