---

title: "Python可迭代对象中的添加和删除(add, append, pop, remove, insert)"
date: 2018-03-11
lastmod: 2018-12-31
slug: "python-iterable-objects"
tags: ["program"]
categories: ["share"]
---

转自：[http://blog.csdn.net/handsome_gay/article/details/52740055][1]

## List ##

```python
classmates = ['Michael', 'Bob', 'Tracy']  
classmates.append('Adam')    //添加在末尾，没有add()方法  
classmates.insert(1, 'Jack') //在指定位置添加  
classmates.pop(1)            //在知道位置删除，参数是索引  
del classmate[1]             //删除第二个元素  
classmates.remove('Bob')     //参数是元素，删除第一个与Bob值匹配的元素，之后又相同元素不会删除  
```

## dict ##

```python
d = {'a': 'A', 'b': 'B'}  
del d['a']  
d.pop('a')    //参数是key，没有remove()方法  
d['c']='C';   //插入直接赋值即可  
```
## set ##
```python
s={1,2,3}       //set对象的创建也可以是s=set(iterable)  
s.add(8)        //添加8到末尾   没有append()方法  
s.remove(8)     //参数是元素，不是索引    删除8     
s.pop()         //删除最后一个元素  
```
## tuple ##

由于tuple一旦初始化就不能修改，所以不能插入和删除

  [1]: http://blog.csdn.net/handsome_gay/article/details/52740055
