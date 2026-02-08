---

title: "发布IEEE通信类期刊论文查找工具IEEE Xplore Walker"
date: 2018-01-26
lastmod: 2018-07-05
slug: "ieeexplore-walker"
tags: ["program", "work"]
categories: ["work"]
---

IEEE Xplore在查找通信类期刊会议论文时，总是会出现其他不希望出现的期刊或者会议，严重影响工作效率。

为此，借助JavaScript、Jquery以及bootstrap开发了`IEEE Xplore Walker`，便于大家查找文献。
网址：[http://t.qqy.pw][1]

其中，搜索文本支持表达式检索：

    SEARCH EXPRESSION EXAMPLES 
    "Abstract":ofdm 
    "Author":"Suzuki, T" 
    (java OR XML) AND "software engineering" 
    security NEAR/5 "cloud computing" 
    "Fast" ONEAR/5 "Statistic" AND "Document Title":"Fast" 
    "Abstract":java AND "Document Title":rfid 

第一次使用Jquery和bootstrap。


  [1]: http://t.qqy.pw
