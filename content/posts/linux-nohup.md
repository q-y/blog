---

title: "让Linux进程在后台可靠运行"
date: 2018-04-30
lastmod: 2019-05-21
slug: "linux-nohup"
tags: ["linux"]
categories: ["share"]
---

nohup
-----

nohup 的用途就是让提交的命令忽略 hangup 信号。只需在要处理的命令前加上 nohup 即可，标准输出和标准错误缺省会被重定向到 nohup.out 文件中。一般我们可在结尾加上 `&` 将命令放入后台运行，也可用 `>filename 2>&1` 更改缺省的重定向文件名。
```session
# nohup ping www.ibm.com &
[1] 3059
nohup: appending output to `nohup.out'
# ps -ef |grep 3059
root      3059   984  0 21:06 pts/3    00:00:00 ping www.ibm.com
root      3067   984  0 21:06 pts/3    00:00:00 grep 3059
```

setsid
------
```session
# setsid ping www.ibm.com
# ps -ef |grep www.ibm.com
root     31094     1  0 07:28 ?        00:00:00 ping www.ibm.com
root     31102 29217  0 07:29 pts/4    00:00:00 grep www.ibm.com
```

值得注意的是，上例中我们的进程 ID(PID)为31094，而它的父 ID（PPID）为1（即为 init 进程 ID），并不是当前终端的进程 ID。

screen
------

用screen -dmS session name来建立一个处于断开模式下的会话（并指定其会话名）。
用screen -list 来列出所有会话。
用screen -r session name来重新连接指定会话。
用快捷键CTRL-a d 来暂时断开当前会话。
```session
# screen -dmS Urumchi
# screen -list
There is a screen on:
        12842.Urumchi   (Detached)
1 Socket in /tmp/screens/S-root.
 
# screen -r Urumchi
```
使用了 screen 后新进程的进程树
```session
# screen -r Urumchi
# ping www.ibm.com &
[1] 9488
# pstree -H 9488
init─┬─Xvnc
     ├─acpid
     ├─atd
     ├─screen───bash───ping
     ├─2*[sendmail]
```
此时 bash 是 screen 的子进程，而 screen 是 init（PID为1）的子进程。那么当 ssh 断开连接时，HUP 信号自然不会影响到 screen 下面的子进程了。

转自：[https://www.ibm.com/developerworks/cn/linux/l-cn-nohup/][1]


  [1]: https://www.ibm.com/developerworks/cn/linux/l-cn-nohup/
