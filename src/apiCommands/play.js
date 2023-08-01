const { Client, MessageEmbed, Permissions } = require('discord.js');

const play = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, channelId, voiceId, query, userId } = req.body;

  if (!(guildId && channelId && voiceId && query && userId)) {
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
    options: { getString: () => query },
    deferReply: () => Promise.resolve(),
    editReply: (content) => {
      // Send the reply as a response to the HTTP request
      res.json(content);
    },
  };


  await interaction.deferReply({ ephemeral: false });

  // Check bot permissions
  if (!interaction.guild.members.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK]))
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(
            `I don't have enough permissions to execute this command! please give me permission \`CONNECT\` or \`SPEAK\`.`,
          ),
      ],
    });

  const { channel } = interaction.member.voice;

  if (!interaction.guild.members.me.permissionsIn(channel).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK]))
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(
            `I don't have enough permissions connect your vc please give me permission \`CONNECT\` or \`SPEAK\`.`,
          ),
      ],
    });

    const emojiaddsong = client.emoji.addsong;
    const emojiplaylist = client.emoji.playlist;

    const player = await client.manager.createPlayer({
      guildId: interaction.guild.id,
      voiceId: interaction.member.voice.channel.id,
      textId: interaction.channel.id,
      deaf: true,
    });

    const result = await player.search(query, { requester: interaction.user });

    if (!result.tracks.length) return interaction.editReply({ content: 'No result was found' });
    const tracks = result.tracks;

    if (result.type === "PLAYLIST") for (let track of result.tracks) player.queue.add(track);
    else player.queue.add(result.tracks[0]);


    if (!player.playing && !player.paused) player.play();

    return interaction.editReply(
      result.type === 'PLAYLIST' ? {
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(
                `${emojiplaylist} Queued ${tracks.length} from ${result.playlistName}`,
              ),
          ],
        }
        : {
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(`${emojiaddsong} Queued [${tracks[0].title}](${tracks[0].uri})`),
          ],
        },
    );

};

module.exports = play;