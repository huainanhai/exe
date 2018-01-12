var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var url = require('url');
var cnodeUrl = 'https://cnodejs.org';
var ep = new eventproxy();
var fs = require('fs');
var path = require('path');

function GetJSON(params) {
    this.init();
    this.completeEvent = params.callbacks.completeEvent;
}

GetJSON.prototype.init = function () {
    var me = this;
    superagent.get(cnodeUrl).end((err, res) => {
        if (err) {
            return console.error(err);
        }
        var info_data = [];
        var topic_urls = [];
        var $ = cheerio.load(res.text);
        $('#topic_list .cell').each(function (i, n) {
            // if (i > 10) return;
            var $n = $(n);
            var href = cnodeUrl + $n.find('.topic_title').attr('href');
            topic_urls.push(href);
        });

        ep.after('topic_event', topic_urls.length, topic => {
            info_data = topic.map(n => {
                var href = n[0],
                    _htmlTemplate = n[1];
                var $ = cheerio.load(_htmlTemplate);
                return ({
                    title: $('.topic_full_title').text(),
                    href: href,
                    commit1: $('.reply_item').eq(0).find('.markdown-text').text() || '暂无评论'
                });
            });
            console.log(info_data.length)
            fs.writeFile(path.join(__dirname, '../doc', 'csdn.json'), '', () => {
            });
            fs.writeFile(path.join(__dirname, '../doc', 'csdn.json'), JSON.stringify(info_data), () => {
                me.completeEvent();
            });
        });

        topic_urls.forEach(url => {
            superagent.get(url).end((err, cres) => {
                ep.emit('topic_event', [url, cres.text]);
            });
        });


    });

};

module.exports = function (params) {
    return new GetJSON(params);
};