const { Client, MessageEmbed, CommandInteraction } = require('discord.js');
const db = require("../schema/playlist");

const savequeuetopl = async (req, res, client) => {
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
    let thing = new MessageEmbed().setColor('RED').setDescription(`There is no music playing.`);
    return interaction.editReply({ embeds: [thing] });
  }

  if (!data) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Playlist not found. Please enter the correct playlist name`),
      ],
    });
  }
  if (data.length == 0) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Playlist not found. Please enter the correct playlist name`),
      ],
    });
  }

  const song = player.queue.current;
  const tracks = player.queue;

  let oldSong = data.Playlist;
  if (!Array.isArray(oldSong)) oldSong = [];
  const newSong = [];
  if (player.queue.current) {
    newSong.push({
      title: song.title,
      uri: song.uri,
      author: song.author,
      duration: song.length,
    });
  }
  for (const track of tracks)
    newSong.push({
      title: track.title,
      uri: track.uri,
      author: track.author,
      duration: track.length,
    });
  const playlist = oldSong.concat(newSong);
  await db.updateOne(
    {
      UserId: interaction.user.id,
      PlaylistName: Name,
    },
    {
      $set: {
        Playlist: playlist,
      },
    },
  );
  const embed = new MessageEmbed()
    .setDescription(`**Added** \`${playlist.length - oldSong.length}\` song(s) to the playlist \`${Name}\``)
    .setColor(client.embedColor);
  return interaction.editReply({ embeds: [embed] });
};

module.exports = savequeuetopl;
