const { Client, MessageEmbed, CommandInteraction } = require('discord.js');

const resume = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, userId } = req.body;

  if (!(guildId && userId)) {
    return res.status(400).send('Missing required parameters.');
  }

  const guild = await client.guilds.fetch(guildId);
  const user = await client.users.fetch(userId);

  const interaction = {
    guild: guild,
    user: user,
    deferReply: () => Promise.resolve(),
    editReply: (content) => {
      // Send the reply as a response to the HTTP request
      res.json(content);
    },
  };

  await interaction.deferReply({ ephemeral: false });

  const player = client.manager.players.get(interaction.guild.id);
  const song = player.queue.current;

  if (!player.queue.current) {
    let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
    return interaction.editReply({ embeds: [thing] });
  }

  const emojiresume = client.emoji.resume;

  if (!player.paused) {
    let thing = new MessageEmbed()
      .setColor('RED')
      .setDescription(`${emojiresume} The player is already **resumed**.`);
    return interaction.editReply({ embeds: [thing] });
  }

  await player.pause(false);

  let thing = new MessageEmbed()
    .setDescription(`${emojiresume} **Resumed**\n[${song.title}](${song.uri})`)
    .setColor(client.embedColor);
  return interaction.editReply({ embeds: [thing] });
};

module.exports = resume;
