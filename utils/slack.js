const { WebClient } = require('@slack/web-api');
const { slackBot } = require('../config');

exports.sendMessageToSlackErrorChannel = async errorMessage => {
    try {
        const client = new WebClient(slackBot.botToken);
        const result = await client.chat.postMessage({
            channel: slackBot.channelName,
            text: errorMessage,
        });
        if (result.ok) {
            console.log('Message sent successfully to Slack');
        } else {
            console.log('Failed to send message to Slack');
        }
    } catch (error) {
        console.error('Error sending message to Slack:', error);
    }
};
