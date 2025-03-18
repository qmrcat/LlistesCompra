const { Vote } = require('../models');

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const websocketService = require('../services/websocketService');
const { getListById } = require('./listController');
const { getItemById } = require('./itemController');
const e = require('cors');

//sendVeteItem

const sendVoteItem = async (req, res) => {
    const { userId, itemId, voteType } = req.body;

    try {
        // Comprova si l'usuari ja ha votat aquest ítem
        const existingVote = await Vote.findOne({ where: { userId, itemId } });

        if (existingVote){
            if ( existingVote.voteType === voteType) {
                return res.status(400).json({ message: 'Ja has votat aquest ítem.' });
            }
        }

        let listId = null

        if (itemId) {
            const data = await getItemById(itemId)
            if (!data || !data.success) {
              return res.status(404).json({
                success: false,
                message: 'Item no trobat'
              });
            }
            listId = data.item.listId
        }

        if (existingVote){ 
            if (existingVote.voteType !== voteType) {
                await Vote.update({ voteType }, { where: { userId, itemId } });

                const voteCounts = await getVoteCounts(itemId);

                websocketService.notifyNewVoting(listId, { userId, itemId, voteType, countUp:voteCounts.upVotes, countDown:voteCounts.downVotes });

                return res.status(200).json({ message: 'Has canviat el vot i ha sigut registrat amb èxit.' });
            }
        }

        // Crea un nou vot
        await Vote.create({ userId, itemId, voteType });

        const voteCounts = await getVoteCounts(itemId);

        websocketService.notifyNewVoting(listId, { userId, itemId, voteType, countUp:voteCounts.upVotes, countDown:voteCounts.downVotes });

        // Emet un esdeveniment per actualitzar els clients en temps real
        // req.io.emit('voteUpdated', { itemId, voteType });

        res.status(200).json({ message: 'Vot registrat amb èxit.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al votar l\'ítem.', error });
    }

}

const getVoteCounts = async (itemId) => {
    try {
      // Compta els vots "up" i "down" per a l'ítem especificat
      const upVotes = await Vote.count({ where: { itemId, voteType: 'up' } });
      const downVotes = await Vote.count({ where: { itemId, voteType: 'down' } });
  
    //   return { upVotes, downVotes };
        return { upVotes: upVotes || 0, downVotes: downVotes || 0 };
    } catch (error) {
      throw new Error('Error al comptar els vots.');
    }
  };

module.exports = {
    sendVoteItem,
    getVoteCounts
  };