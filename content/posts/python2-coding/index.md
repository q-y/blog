---

title: "令人讨厌的python2编码问题"
date: 2017-01-12
lastmod: 2020-06-22
slug: "python2-coding"
tags: ["program"]
categories: ["share"]
---

一般在py文件开头写
----------
```python
# coding:utf-8
```
指明py文件以utf-8编码储存中文字符，然后加
```python
import sys
default_encoding = 'utf-8'
if sys.getdefaultencoding() != default_encoding:
    reload(sys)
    sys.setdefaultencoding(default_encoding)
````
这样在文件输入输出时就默认采用所选格式编解码

----------
另外要注意看文件与编码格式的对应性，一般ANSI格式采用GBK可解（cmd输出正确），UTF8格式采用UTF8可解（cmd输出乱码）


----------


print ‘中文’像上面那样直接输入的字符串是按照代码文件的编码来处理的，如果用unicode编码，有以下2种方式：
```python
s1 = u’中文’ #u表示用unicode编码方式储存信息
s2 = unicode(‘中文’,’gbk’)
```
unicode是一个内置函数，第二个参数指示源字符串的编码格式。decode是任何字符串具有的方法，将字符串转换成unicode格式，参数指示源字符串的编码格式。encode也是任何字符串具有的方法，将unicode格式字符串转换成参数指定的格式。str的编码是与系统环境相关的，一般就是sys.getfilesystemencoding()得到的值。

安全的方法：
```python
s.decode('gbk','ignore').encode('utf-8′) #以gbk编码读取（当然是读取gbk编码格式的文字了）并忽略错误的编码，转换成utf-8编码输出
```
因为decode的函数原型是decode([encoding], [errors='strict'])，可以用第二个参数控制错误处理的策略，默认的参数就是strict，代表遇到非法字符时抛出异常；如果设置为ignore，则会忽略非法字符；如果设置为replace，则会用?取代非法字符；


在正则表达式中的中文问题
------------

如果使用的utf-8编码，'[\(（]'被解释成了'[\(\xef\xbc\x88]'。在进行字符串匹配时'[\(（]'的意思是：出现英文括号或者\xef或者\xbc或者\x88。显然，这样对源字符串进行匹配时，就无法获取到想到的信息，应该采用(?:\(|（)处理。而采用unicode时，仅为一个字符，可以用[]处理。

两种解决方案：

1.pattern加u
```python
fw = open("res", "w")
s = "飞利浦(PHILIPS）"
ptn = re.compile(ur"(.*?)[\(（](.∗?)[\)）]")
res = ptn.search(s.decode("UTF-8"))
fw.write("%s|%s\n" %(res.group(1).encode("UTF-8"), res.group(2).encode("UTF-8")))
fw.close()
```
2.改为(?:\(|（)按照utf8处理
```python
fw = open("res", "w")
s = "飞利浦(PHILIPS）"
ptn = re.compile(r"(.*?)(\(|（)(.*?)(）|\))")
res = ptn.search(s)
fw.write("%s|%s\n" %(res.group(1), res.group(3)))
fw.close()
```

用python匹配中文，unicode中中文的编码为/u4e00-/u9fa5
---------------------------------------
```python
import re  
source = "s2f程序员杂志一2d3程序员杂志二2d3程序员杂志三2d3程序员杂志四2d3"  
temp = source.decode('utf8')  
xx=u"([/u4e00-/u9fa5]+)"  
pattern = re.compile(xx)  
results =  pattern.findall(temp)  
for result in results :  
    print result
```

----------
![][1]


正则表达式见[这里][2]，一般采用
```python
# encoding: UTF-8
import re
 
# 将正则表达式编译成Pattern对象
pattern = re.compile(r'hello')
 
# 使用Pattern匹配文本，获得匹配结果，无法匹配时将返回None
match = pattern.match('hello world!')
 
if match:
    # 使用Match获得分组信息
    print match.group()
 
### 输出 ###
# hello
```
采用`groups([default])`表示以元组形式返回全部分组截获的字符串。相当于调用`group(1,2,…last)`。`default`表示没有截获字符串的组以这个值替代，默认为`None`。

采用`findall(string[, pos[, endpos]]) | re.findall(pattern, string[, flags])`来搜索`string`，以列表形式返回全部能匹配的子串。 
```python
import re
     
p = re.compile(r'\d+')
print p.findall('one1two2three3four4')
     
### output ###
# ['1', '2', '3', '4']
```

  [1]: 2666507905.png
  [2]: https://www.cnblogs.com/huxi/archive/2010/07/04/1771073.html
