const CryptoJS = require('crypto-js');
const aes = require('crypto-js').AES;

module.exports = {
    generateUniqueTopic: function(label = 'unknown'){
        return `topic-${label}-${new Date().getTime()}-${parseInt(Math.random() * 10000)}`;
    },
    relativeTime: function(timestamp){
        // Timestamp should be calculated as 'ms' unit
        let now = new Date().getTime();
        let diff = Math.floor(now - timestamp);

        if(diff < 0){return "미래";}
        if(diff < 1000){return "방금 전";} diff = Math.floor(diff/1000);
        if(diff < 60){return diff + "초 전";} diff = Math.floor(diff/60);
        if(diff < 60){return diff + "분 전";} diff = Math.floor(diff/60);
        if(diff < 24){return diff + "시간 전";} diff = Math.floor(diff/24);
        if(diff < 30){return diff + "일 전";}
        if(diff < 365){return Math.floor(diff/30) + "달 전";} diff = Math.floor(diff/365);
        if(diff < 10){return diff + "년 전";}
        return "아주 오래 전";
    },
    aes: {
        encrypt: function(cipher, key){
            return aes.encrypt(cipher, key).toString();
        },
        decrypt: function(encrypted, key){
            return aes.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
        }
    }
}