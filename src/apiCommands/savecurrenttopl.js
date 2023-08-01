const { Client, MessageEmbed, CommandInteraction } = require('discord.js');
const db = require("../schema/playlist");

const savecurrenttopl = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, userId, name } = req.body;

  if (!(guildId && userId && name)) {
    return res.status(400).send('Missing required parameters.');
  }

  const guild = await client.guilds.fetch(guildId);
  const user = await client.users.fetch(userId);

  const interaction = {
    guild: guild,
    user: user,
    options: { getString: () => name },
    deferReply: () => Promise.resolve(),
    editReply: (content) => {
      // Send the reply as a response to the HTTP request
      res.json(content);
    },
  };

  await interaction.deferReply({ ephemeral: false });

  const Name = interaction.options.getString('name');
  const data = await db.findOne({ UserId: interaction.user.id, PlaylistName: Name });

  const player = client.manager.players.get(interaction.guild.id);
  if (!player.queue.current) {
    let thing = new MessageEmbed().setColor('RED').setDescription('No music is currently playing.');
    return interaction.editReply({ embeds: [thing] });
  }
  if (!data) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`You don't have a playlist with the name **${Name}**`),
      ],
    });
  }
  if (data.length == 0) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`You don't have a playlist with the name **${Name}**`),
      ],
    });
  }
  const song = player.queue.current;
  let oldSong = data.Playlist;
  if (!Array.isArray(oldSong)) oldSong = [];
  oldSong.push({
    title: song.title,
    uri: song.uri,
    author: song.author,
    duration: song.length,
  });
  await db.updateOne(
    {
      UserId: interaction.user.id,
      PlaylistName: Name,
    },
    {
      $push: {
        Playlist: {
          title: song.title,
          uri: song.uri,
          author: song.author,
          duration: song.length,
        },
      },
    },
  );
  const embed = new MessageEmbed()
    .setColor(client.embedColor)
    .setDescription(`Added [${song.title.substr(0, 256)}](${song.uri}) to the playlist \`${Name}\``);
  return interaction.editReply({ embeds: [embed] });
};

module.exports = savecurrenttopl;
