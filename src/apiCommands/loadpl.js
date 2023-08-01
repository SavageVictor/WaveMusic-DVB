const { Client, MessageEmbed, CommandInteraction } = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const db = require("../schema/playlist");

const loadpl = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, channelId, voiceId, userId, name } = req.body;

  if (!(guildId && channelId && voiceId && userId && name)) {
    return res.status(400).send('Missing required parameters.');
  }

  const guild = await client.guilds.fetch(guildId);
  const channelFetched = await client.channels.fetch(channelId);
  const voiceChannel = await client.channels.fetch(voiceId);
  const user = await client.users.fetch(userId);

  

  const interaction = {
    guild: guild,
    channel: channelFetched,
    member: { voice: { channel: voiceChannel } },
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

  // Get all playlist names for the user
  const allPlaylists = await db.find({ UserId: interaction.user.id });
  // Create a fuzzy set with the playlist names
  const fuzzySet = FuzzySet(allPlaylists.map(playlist => playlist.PlaylistName));
  // Get the closest match to the input name
  const fuzzyMatch = fuzzySet.get(Name);
  // If a match was found, use that as the name
  const matchedName = fuzzyMatch ? fuzzyMatch[0][1] : Name;
  // Now find the data using the (possibly) updated name
  const data = await db.findOne({ UserId: interaction.user.id, PlaylistName: matchedName });
  
  // Try to get an existing player for the guild
  let player = client.manager.players.get(interaction.guild.id);

  // If no existing player, create a new one
  if (!player) {
    player = await client.manager.createPlayer({
      guildId: interaction.guild.id,
      voiceId: interaction.member.voice.channel.id,
      textId: interaction.channel.id,
      deaf: true,
    });
  }

  if (!data) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(
            `Playlist not found. Please enter the correct playlist name\n\nDo ${prefix}list To see your Playlist`,
          ),
      ],
    });
  }

  let count = 0;
  const m = await interaction.editReply({
    embeds: [
      new MessageEmbed()
        .setColor(client.embedColor)
        .setDescription(`Adding ${data.Playlist.length} track(s) from your playlist **${Name}** to the queue.`),
    ],
  });
  for (const track of data.Playlist) {
    let s = await player.search(track.uri ? track.uri : track.title, interaction.user);
    if (s.type === 'PLAYLIST' || s.type === 'TRACK' || s.type === 'SEARCH') {
      await player.queue.add(s.tracks[0]);
      if (!player.queue.current) player.play();
      ++count;
    }
  }
  if (player && !player.queue.current) player.destroy(interaction.guild.id);
  if (count <= 0 && m)
    return await m.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Couldn't add any tracks from your playlist **${Name}** to the queue.`),
      ],
    });
  if (m)
    return await m.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Added ${count} track(s) from your playlist **${Name}** to the queue.`),
      ],
    });

    if (!player.playing && !player.paused) player.play();
};

module.exports = loadpl;
