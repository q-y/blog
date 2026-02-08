---

title: "HPC计算集群使用"
date: 2019-05-23
lastmod: 2020-06-22
slug: "hpc"
tags: ["linux", "matlab"]
categories: ["share"]
---

HPC高性能计算中心往往由Grid Engine (GE aka SGE)进行用户的统一作业调度和管理。由于GE往往基于Unix系统，对只需要运行Matlab仿真程序的新手用户非常不友好。因此，这里以在GE上采用Matlab完成一项系统仿真来介绍HPC计算集群的使用。

这里假设该系统仿真需大量多次随机实现系统参数，在每种参数下分别求解某个固定结构的优化问题，最终求所实现的多个系统参数下的平均优化性能。

这里基本的编程思路是先采用Matlab编程完成一次系统参数实现并求解该参数下的问题。由于需要多次运行该Matlab程序，为提高计算效率这里将Matlab程序采用MCC编译为Linux上的可执行二进制文件，再讲该二进制文件交给GE进行大量多次并发运行（通过利用HPC多核心来节省运算时间）。每次运行的结果将生成不同的`.mat`文件，最终再通过Matlab遍历读取这些`.mat`文件来完成最终平均性能的统计。这里将Matlab程序编译为Linux上的可执行二进制文件的另外一个原因是：Matlab每次运行都需要License，对于需要多次并发运行的程序需要很多License；而编译成二进制文件再运行就可以避免每次运行时需要Matlab License。这里要注意的是：由于需要对Matlab程序进行编译，我们常用Matlab上的[CVX][1]优化工具包不支持编译，故而在编写Matlab优化程序时应采用与[CVX][2]类似的[YALMIP][3]优化工具包（支持Matlab代码编译为二进制可执行文件）实现优化代码。

## 登录HPC ##
这里可简单认为HPC就是一台普通的Linux电脑，要运行自己程序的第一步就是先从HPC管理员处获取用户登录信息，登录HPC。采用如下bash命令登录，并按照提示输入用户密码即可。
```bash
ssh 用户名@HPC登录节点服务器地址
```


## 编写Matlab仿真程序 ##
由于需要随机生成多次系统参数，并在每种参数下完成某个优化问题求解，这里建议Matlab代码结构如下：
```matlab
function fun_name(rand_seed, output_file)

rng(str2num(rand_seed));
% Generate system parameters using rand functions

% Solve the optimization problem

save(output_file, 'variables_to_save');

end
```
该种结构采用函数形式，在该函数中随机生成一个系统参数，并在该参数下完成优化问题求解。由于需要多次Matlab运行该函数并且每次都生成不同的随机数，故而在最开始采用`rng(str2num(rand_seed))`更改初始的随机数发生器种子值（从0开始的整数）。这里采用`str2num`函数是因为将来需要将该Matlab程序编译为二进制代码，以便在HPC的Linux环境下运行，而从Linux命令中馈入的参数为字符串类型，故而需要采用转数字函数传入所要求的随机数发生器种子。

## 配置Matlab环境 ##
首先，我们需要先在HPC自己的工作目录上下载[YALMIP][4]和[Sedumi][5]等优化工具包，采用如下bash命令即可：
```bash
wget https://github.com/yalmip/YALMIP/archive/master.zip
unzip master.zip
```
接着，在HPC登录节点运行`qrsh`获取一个可以支持编译操作的交互式shell；然后，在交互式shell下，进入自己用户的工作目录通过`module load MATLAB/r2018a`命令加载Matlab程序；最后，输入`matlab`命令即可在当前shell中打开Matlab交互式运行会话，通过`addpath(genpath(yalmip_root_directory))`Matlab命令加入下载的YALMIP以及Sedumi等solver到Matlab搜索路径，并利用`savepath`保存当前更新后的Matlab搜索路径（如果因权限问题不能保存至默认位置，可以`savepath pathdef.m`保存到当前工作文件夹）。最终，可以在Matlab中检查自己编写的Matlab程序是否运行正确。

## 编译Matlab程序为可执行二进制文件 ##
这里采用Matlab自带的MCC工具集编译采用[YALMIP][6]实现的优化程序。在支持编译等复杂运算的交互式shell下采用如下代码编译Matlab程序：
```shell
cd 工作目录  # 进入相关工作目录（YALMIP等已配置好）
module load MATLAB/r2018a  # 加载Matlab程序模块（必须先加载才能使用Matlab）
mcc -m 待编译Matlab程序.m -a ./YALMIP-master/solvers/callsedumi.m -a ./sedumi-master/sedumi.m -a ./sedumi-master/ada_pcg.m -a ./sedumi-master/install_sedumi.m  #执行MCC编译操作
```
上述程序中通过采用`-a ./YALMIP-master/...`等使得代码在被编译时可以加入Sedumi这个solver来解决最终输出的二进制文件在运行时的依赖关系。上述代码编译时间会较长，可能到5-8分钟。

输出的二进制文件就可以直接运行，如果运行报MCR错误，一般是因为临时目录权限问题，可以通过`export MCR_CACHE_ROOT=/tmp_path`设置MCR展开目录为自己具有全权限的目录。

## 提交二进制文件进行多次运行 ##
这里可以将上一步输出的二进制文件移动到另一文件夹，以专门用来提交运行作业给GE和保存运行后的输出结果。在该文件夹下采用`nano hello-hpc.sh`命令通nano文本编辑程序建立或编辑已有的GE作业提交脚本`hello-hpc.sh`，其具体内容如下：
```shell
#!/bin/bash
#$ -N 作业名
#$ -q free*,pub64等运行计算集群名
#$ -t 1-运行总次数
#$ -ckpt restart

module load MATLAB/r2018a

./编译好的二进制程序文件名 $SGE_TASK_ID /结果输出地址/out_$SGE_TASK_ID
```
其中`$SGE_TASK_ID`从`1-运行总次数`自动遍历，从而使得不同运行次数之间具有不同的随机数种子，同时也让每次运行的输出结果具有不同的输出文件名`out_$SGE_TASK_ID`。

`hello-hpc.sh`确认无误后，可使用`qsub hello-hpc.sh`提交该作业任务给GE，GE会自动完成作业的并发调度和执行。可以通过`qstat -u $USER`查看自己当前运行的作业情况。当运行出错时，也可以采用`qdel <Job ID>`删除作业并重新提交作业再运行。

## 获取运行结果 ##
通过在本机采用SCP远程获取HPC上程序的输出结果文件，格式如下
```bash
scp 用户名@HPC登录节点服务器地址:/结果输出地址/out_* 本机待保存结果目录
```
最后通过编写Matlab程序遍历`本机待保存结果目录`中的输出文件，获得最终的仿真平均性能。遍历的Matlab代码如下
```matlab
PATH = 本机待保存结果目录;
all_mat = dir([PATH,'*.mat']);
for i = 1:length(all_mat)
    d = load([PATH, all_mat(i).name], 'variables_to_save');
    
    % Deal with d.variables_to_save
end
```


  [1]: http://cvxr.com/cvx/
  [2]: http://cvxr.com/cvx/
  [3]: https://yalmip.github.io/
  [4]: https://yalmip.github.io/
  [5]: https://yalmip.github.io/solver/sedumi/
  [6]: https://yalmip.github.io/
