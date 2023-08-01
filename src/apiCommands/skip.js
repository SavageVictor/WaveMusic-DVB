const { MessageEmbed, Permissions } = require('discord.js');

const skip = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, channelId, voiceId, userId } = req.body;

  if (!(guildId && channelId && voiceId && userId)) {
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

  const player = await client.manager.players.get(guildId);
  
  if (!player.queue.current) {
    let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
    return interaction.editReply({ embeds: [thing] });
  }

  await player.skip();

  const emojiskip = client.emoji.skip;

  let thing = new MessageEmbed()
    .setDescription(`${emojiskip} **Skipped**\n[${player.queue.current.title}](${player.queue.current.uri})`)
    .setColor(client.embedColor);

  return interaction.editReply({ embeds: [thing] });
};

module.exports = skip;
