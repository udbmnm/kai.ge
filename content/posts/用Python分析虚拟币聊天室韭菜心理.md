---
title: "用Python分析虚拟币聊天室韭菜心理"
date: 2017-08-19T09:24:12+08:00
tags: ["BTC","python"]
---

前几天闲的没事，去sosobtc的聊天室看了看，我发现那些人一天到晚乐此不疲的发些没用的消息。不是说哪个涨了多少跌了多少，就是问某某还能不能进，某某该不该卖了，买什么赚了多少倍，骂李笑来大骗子种种。。基本上可以看出韭菜们的贪婪恐惧和无知，和各种股票群里的对话差不多。

我突发奇想，想分析下那些虚拟币交易的韭菜们到底一天到晚再聊些什么。于是写了个程序抓取聊天室的聊天记录，然后保存到mysql，然后用Python做了下词云分析。

下面是词云的效果：

![694a5846gy1fip5lctjrcj211y0iogr4.jpg](https://cdn.steemitimages.com/DQmeKdV8S6cKX7KNX9E2fTXwNg64TS3UFYyjq5X8P1xehBQ/694a5846gy1fip5lctjrcj211y0iogr4.jpg)


![694a5846gy1fip5leznsnj210z0g5n2k.jpg](https://cdn.steemitimages.com/DQmNR3FAFUuydS4vjk3CLoGuBfcrFFikNxx28g9hcv6WRvB/694a5846gy1fip5leznsnj210z0g5n2k.jpg)



应该是当天蚂蚁大涨，所以频率比较高，可以看出韭菜们对消息和市场的反应。。。

准备工作：

首先准备好几个准备抓取得聊天室的地址，我准备的几个地址如下：

http://io.sosobtc.com/?chnl=okcoin&theme=light&nested=true&app=true

https://io.sosobtc.com/?chnl=yunbi&theme=light&nested=false&app=true

https://io.sosobtc.com/?chnl=biter&theme=light&nested=true&app=true

https://io.sosobtc.com/?chnl=jubi&theme=light&nested=true&app=true

可以很清楚的看到chnl就是不同的交易所，sosobtc支持很多个交易所，感兴趣的可以自己改参数试试

由于sosobtc的聊天室是基于websocket的，所以只需要在接收信息的地方拦截消息然后发送到本地后端保存就行了

这里我们使用Fiddle代理http://io.sosobtc.com/public/javascripts/app.js 这个js文件

然后找到

```
client.on('data', function onReply(data) {
    receive(data);
});
```

  

可以看到这里调用receive方法来处理数据，于是在receive里面动动手脚就行啦。

![694a5846gy1fip5y6jmfbj20u30ekmza.jpg](https://cdn.steemitimages.com/DQmRJTrWk3gQPXAmgcuANBkzAfm79jGYtJzEqctvBHryu8Q/694a5846gy1fip5y6jmfbj20u30ekmza.jpg)


可以看到我这里每次就是到消息就发送一个POST到本地http://localhost/msg，这样抓取数据就写好了

localhost里面的代码就很简单了，保存post到mysql，最后是Python的词云分析。

这一步也很简单，才几行代码，哈哈哈。。。

![694a5846gy1fip5y6ztxbj20uv0ar0tm.jpg](https://cdn.steemitimages.com/DQmPfnVch25bbMrfCnBBnokfho2jxu7HfaCWpL2ex3WdaKb/694a5846gy1fip5y6ztxbj20uv0ar0tm.jpg)


这里需要注意如果你的文本是中文需要引入支持中文的字体，我这里引入的微软自带的字体

就酱吧，有兴趣的可以研究研究，PY可以干很多好玩的事。

PS:

这里是我搜集的2w多条数据，可以下载自己跑的试试

https://www.dropbox.com/s/gebl89uopm0103l/msg2.txt?dl=0

链接: https://pan.baidu.com/s/1ejGkcVEW8IiZGwgsE2u5Bg 提取码: 5rr8 