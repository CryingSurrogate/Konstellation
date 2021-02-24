const dotenv = require('dotenv')
const Discord = require('discord.js')
const sql = require('sqlite3')
// .env
dotenv.config()
// Init
//   L Database
// const db = new sql.Database(':memory:')
const db = new sql.Database('./db/kons.db', sql.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message)
  }
  console.log('Konnected to the database.')
})
// Create a new table, if it doesn't exist already
const sqltable = `
CREATE TABLE IF NOT EXISTS kon_ideas (
  id INTEGER PRIMARY KEY,
  author TEXT NOT NULL,
  idea TEXT NOT NULL,
  msgid INTEGER NOT NULL
);`

try {
  db.exec(sqltable)
} catch (error) {
  console.error(error.message)
}

function insertIdea (author, idea, msgid) {
  const q = `INSERT INTO kon_ideas (author, idea, msgid) VALUES ("${author}", "${idea}", ${msgid})`
  try {
    db.all(q)
  } catch (error) {
    console.error('Error in insert' + error.message)
  }
}

function getNumIdeas () {
  let ret = ''
  db.each('SELECT MAX(id) FROM kon_ideas;', (err, data) => {
    if (err) {
      console.error('Error in getNum' + err.message)
    }
    console.log(data['MAX(id)'])
    ret += data['MAX(id)']
  })
  console.info('DB size' + ret)
  return ret
}
// TODO: Make this work
function randomIdea (count) {
  const n = (getNumIdeas() > count) ? getNumIdeas() : count
  let r = Math.floor(Math.random() * getNumIdeas())
  if (r < 1) r = 1
  console.log(r)
  // const q = `SELECT (id,author,idea) FROM kon_ideas ORDER BY random() LIMIT ${count};`
  let rets
  db.all('SELECT author, idea FROM kon_ideas ORDER BY random()', [], (err, rows) => {
    if (err) {
      throw err
    }
    const ret = [count]
    rows.forEach((row) => {
      console.log(`\`${row.id}\`: ${row.idea} - by ${row.author}`)
      ret.push([`\`${row.id}\`: ${row.idea} - by ${row.author}`])
    })
    rets = ret.join('')
  })

  return rets
}

//   L Discord
const client = new Discord.Client()

const prefix = process.env.prefix

client.once('ready', () => {
  console.log('Discord initialized')
})
// Handler
client.on('message', msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return

  const args = msg.content.slice(prefix.length).trim().split(' ')
  const command = args.shift().toLowerCase()

  switch (command) {
    case 'kon-help':
      msg.reply('Current command list:\n\n`.idea` - Registers a Kon idea\n`.kon-help` - Shows this message\n`.give-ideas 1` - gives a specified amount of random Kon ideas to work with!\n`.kon-stats - Shows the current amount of ideas in database`')
      break
    case 'idea':
      if (!args.length) {
        msg.reply('No ideas here!')
        break
      } else {
        console.log('New idea by ' + msg.author.tag + ': ' + args.join(' '))
        insertIdea(msg.author.tag, args.join(' '), msg.id)
        db.all('SELECT id, author, idea FROM kon_ideas ORDER BY id', [], (err, rows) => {
          if (err) {
            throw err
          }
          rows.forEach((row) => {
            console.log(`${row.id}  ${row.author}: ${row.idea}`)
          })
        })
        msg.pin()
        msg.reply('Idea saved successfully!')
      }
      break
    case 'give-ideas': // TODO: Make this work
      if (!args.length) {
        msg.reply('No number? Here is one then!\n\n' + randomIdea(1))
      } else {
        msg.reply('Here you go!\n\n' + randomIdea(args[1]))
      }
      break
  }
})

client.login(process.env.TOKEN)
