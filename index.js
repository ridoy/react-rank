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
const prefix = "!";

pgClient.connect();


client.login(process.env.TOKEN);
console.log('running');

// Listen for reaction adds
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }
    let serverid = reaction.message.guild.id;
    let discordid = reaction.message.author.id;
    let name = reaction.message.author.username;
    let idhash = serverid + discordid + '';
    let query = `INSERT INTO leader (name, discordid, serverid, idhash) VALUES ('${name}', '${discordid}', '${serverid}', '${idhash}') ON CONFLICT (idhash) DO UPDATE SET count = leader.count + 1;`
    console.log(`${name} got a react`);
    pgClient.query(query, (err, res) => {
        if (err) throw err;
    });
});

// Respond to commands
client.on("message", function(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "reactrank") {
        if (args[0]) {
            const user = getUserFromMention(args[0]);
            if (!user) {
                return message.reply(`${args[0]} isn't a real user.`);
            }
            console.log(user);
            let query = `SELECT * FROM leader WHERE name='${user.username}' AND serverid='${message.guild.id}';`
            pgClient.query(query, (err, res) => {
                if (err) throw err;
                if (res.rows.length === 0) { return message.channel.send(`${user.username}has NO REACTS LMAO!!!!!!!!!!`); }
                let result = res.rows[0];
                let str = `well okay ${user.username} only has ${result.count} reacts but that doesn't make them a bad person`;
                return message.channel.send(str);
            });
        } else {
            let query = `SELECT * FROM leader WHERE serverid='${message.guild.id}' ORDER BY count DESC LIMIT 5;`
            pgClient.query(query, (err, res) => {
                if (err) throw err;
                let i = 1;
                let str = '```\nTHE LEADERBOARD!!!\n';
                for (let row of res.rows) {
                    str += `${i}. ${row['name']} with ${row['count']} reacts\n`;
                    i++;
                }
                str += '```';
                return message.channel.send(str);
            });
        }
    }

    if (command === "myrank") {
        let serverid = message.guild.id;
        let discordid = message.author.id;
        let idhash = serverid + discordid + '';
        let query = `SELECT * FROM leader WHERE idhash='${idhash}';`
        pgClient.query(query, (err, res) => {
            if (err) throw err;
            let str;
            if (!res.rows.length) {
                str = `Hi ${message.author.username}, you haven't gotten any reacts yet :'( maybe try being funny?`;
            } else  {
                let result = res.rows[0];
                if (result.count === 0) {
                    str = `Wow you haven't gotten any reacts yet. Incel`;
                } else  {
                    str = `Hi ${result.name}, you have received ${result.count} reacts since this bot started counting.`;
                }

            }
            message.channel.send(str);
        });
    }

    if (command === "clearmyreacts") {
        let serverid = message.guild.id;
        let discordid = message.author.id;
        let idhash = serverid + discordid + '';
        let query = `UPDATE leader SET count = 0 where idhash='${idhash}'`
        pgClient.query(query, (err, res) => {
            if (err) throw err;
            let str = `Why would you do this? Anyway, your react count is 0 now.`;
            message.channel.send(str);
        });
    }
});

function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        console.log(client.users);
        return client.users.cache.get(mention);
    }
}
