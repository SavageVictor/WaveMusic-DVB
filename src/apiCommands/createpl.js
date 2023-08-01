const { Client, MessageEmbed, CommandInteraction } = require('discord.js');
const db = require("../schema/playlist");

const createpl = async (req, res, client) => {
  // Retrieve parameters from the request body
  const { guildId, channelId, userId, name } = req.body;

  if (!(guildId && channelId && userId && name)) {
    return res.status(400).send('Missing required parameters.');
  }

  const guild = await client.guilds.fetch(guildId);
  const channelFetched = await client.channels.fetch(channelId);
  const user = await client.users.fetch(userId);

  const interaction = {
    guild: guild,
    channel: channelFetched,
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
  const data = await db.find({ UserId: interaction.user.id, PlaylistName: Name });

  if (Name.length > 10) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Playlist Name Cant Be Greater Than 10 Characters`),
      ],
    });
  }
  if (data.length > 0) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(
            `This playlist already exists! Delete it using: \`${prefix}\`delete \`${Name}\``,
          ),
      ],
    });
  }
  let userData = await db.find({
    UserId: interaction.user.id,
  });
  if (userData.length >= 10) {
    return interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`You Can Only Create 10 Playlists`),
      ],
    });
  }
  const newData = new db({
    UserName: interaction.user.tag,
    UserId: interaction.user.id,
    PlaylistName: Name,
    CreatedOn: Math.round(Date.now() / 1000),
  });
  await newData.save();
  const embed = new MessageEmbed()
    .setDescription(`Successfully created a playlist for you **${Name}**`)
    .setColor(client.embedColor);
  return interaction.editReply({ embeds: [embed] });
};

module.exports = createpl;
