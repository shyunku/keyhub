
module.exports = {
    generateUniqueTopic: function(label = 'unknown'){
        return `topic-${label}-${new Date().getTime()}-${parseInt(Math.random() * 10000)}`;
    }
}