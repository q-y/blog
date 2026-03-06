---
title: "附录：SIDD + NAFNet + BasicSR 可执行训练/推理模板"
date: 2026-03-06T13:55:29+08:00
slug: "basicsr-sidd-nafnet-training-inference-template"
draft: false
tags: ["automation", "program"]
categories: ["automation"]
description: "A practical appendix with executable templates for BasicSR-based denoising: environment, YAML config, train/infer commands, and regression gates."
---

## 摘要

这是上一篇修订文的工程附录：给出一套可直接落地的 **SIDD + NAFNet + BasicSR** 训练/推理模板。目标是把“概念讨论”落到可执行层面，覆盖：

- 环境与依赖
- 数据组织
- 训练配置（YAML）
- 启动命令（单机/多卡）
- 推理与评测
- 回归基线与自动化建议

> 说明：NAFNet 官方实现基于 BasicSR，实际参数与路径以当前仓库版本为准。

---

## 1) 环境模板（venv）

```bash
# 1. 创建环境
python3 -m venv .venv
source .venv/bin/activate

# 2. 克隆 NAFNet（其实现依赖 BasicSR）
git clone https://github.com/megvii-research/NAFNet.git
cd NAFNet

# 3. 安装依赖
pip install -r requirements.txt
python setup.py develop --no_cuda_ext

# 可选：若你需要 CUDA 扩展，去掉 --no_cuda_ext 并确保编译链可用
```

建议固定版本（可复现）：
- Python 3.9.x
- PyTorch/CUDA 与驱动严格匹配
- 在实验记录里保存 `pip freeze` 与 `nvidia-smi` 输出

---

## 2) 数据目录模板（SIDD）

建议统一目录（示例）：

```text
datasets/
  SIDD/
    train/
      input/
      gt/
    val/
      input/
      gt/
    test/
      input/
      gt/   # 若有 GT
```

关键原则：
1. 输入噪声图与 GT 文件名一一对应。  
2. 所有路径在 YAML 里显式声明，禁止隐式相对路径。  
3. 数据版本号写入实验名，例如 `sidd_v1_20260306`。

---

## 3) 训练配置模板（YAML 骨架）

下面给一个可改造的 `options/train/SIDD/NAFNet-custom.yml` 骨架（字段名按 BasicSR 常用风格）：

```yaml
name: NAFNet_SIDD_custom
model_type: ImageRestorationModel
scale: 1
num_gpu: auto
manual_seed: 42

datasets:
  train:
    name: SIDD_train
    type: PairedImageDataset
    dataroot_gt: datasets/SIDD/train/gt
    dataroot_lq: datasets/SIDD/train/input
    io_backend:
      type: disk

    gt_size: 256
    use_hflip: true
    use_rot: true

    batch_size_per_gpu: 8
    num_worker_per_gpu: 8

  val:
    name: SIDD_val
    type: PairedImageDataset
    dataroot_gt: datasets/SIDD/val/gt
    dataroot_lq: datasets/SIDD/val/input
    io_backend:
      type: disk

network_g:
  type: NAFNet
  width: 64
  enc_blk_nums: [1, 1, 1, 28]
  middle_blk_num: 1
  dec_blk_nums: [1, 1, 1, 1]

path:
  pretrain_network_g: ~
  strict_load_g: true
  resume_state: ~

train:
  ema_decay: 0.999
  optim_g:
    type: AdamW
    lr: !!float 2e-4
    weight_decay: 0
    betas: [0.9, 0.9]

  scheduler:
    type: CosineAnnealingRestartLR
    periods: [300000]
    restart_weights: [1]
    eta_min: !!float 1e-7

  total_iter: 300000
  warmup_iter: -1

  pixel_opt:
    type: L1Loss
    loss_weight: 1.0
    reduction: mean

val:
  val_freq: !!float 5e3
  save_img: false
  metrics:
    psnr:
      type: calculate_psnr
      crop_border: 0
      test_y_channel: false
    ssim:
      type: calculate_ssim
      crop_border: 0
      test_y_channel: false

logger:
  print_freq: 100
  save_checkpoint_freq: !!float 5e3
  use_tb_logger: true

dist_params:
  backend: nccl
  port: 29500
```

> 注意：不同版本 NAFNet/BasicSR 的字段可能存在细微差异，首次运行请以仓库内现有 `options/train/SIDD/*.yml` 对齐。

---

## 4) 启动命令模板

### 单卡调试

```bash
python basicsr/train.py -opt options/train/SIDD/NAFNet-custom.yml --launcher none
```

### 多卡训练（DDP）

```bash
python -m torch.distributed.launch \
  --nproc_per_node=4 \
  --master_port=4321 \
  basicsr/train.py \
  -opt options/train/SIDD/NAFNet-custom.yml \
  --launcher pytorch
```

### 断点续训

在 YAML 的 `path.resume_state` 指向 `experiments/<exp_name>/training_states/*.state`，然后重启同一训练命令。

---

## 5) 推理与离线评测模板

### 推理

```bash
# 示例：请替换为你仓库中对应的 inference 脚本
python basicsr/test.py -opt options/test/SIDD/NAFNet-width64.yml
```

### 指标计算

如果测试脚本不自动汇总，可用 BasicSR 指标脚本补算：

```bash
python scripts/metrics/calculate_psnr_ssim.py \
  --gt datasets/SIDD/val/gt \
  --restored results/NAFNet_SIDD_custom/visualization \
  --crop_border 0
```

建议同时记录：
- PSNR / SSIM（主指标）
- 单图最差 Top-K（坏例分析）
- 吞吐（img/s）与显存占用

---

## 6) 回归门禁（上线前）

建议硬门槛：

1. 平均 PSNR 不低于基线 - 0.10 dB  
2. 平均 SSIM 不低于基线 - 0.001  
3. 坏例 Top-20 中主观不可接受样本 ≤ 2

CI/自动化建议：
- 每次新 checkpoint 自动跑小验证集；
- 若触发门禁失败，OpenClaw 直接推送报警到聊天渠道；
- 仅通过门禁的模型允许进入部署队列。

---

## 7) 与 Agent 的结合点（最实用）

在 BasicSR 任务里，Agent 最有价值的不是“替你发明网络结构”，而是：

- 自动扫参（lr/patch/batch/aug）
- 自动生成实验报告（指标表 + 对比图）
- 自动回归判定（通过/失败）
- 自动通知与定时重训

如果你在用 OpenClaw，可以把这些动作收敛为固定命令模板，由计划任务触发并把结果回传到 QQ。

---

## 参考资料

1. BasicSR: https://github.com/XPixelGroup/BasicSR  
2. BasicSR HOWTOs: https://github.com/XPixelGroup/BasicSR/blob/master/docs/HOWTOs.md  
3. NAFNet: https://github.com/megvii-research/NAFNet  
4. Real-ESRGAN（说明依赖 BasicSR 训练/推理）：https://github.com/xinntao/Real-ESRGAN  
5. OpenClaw Docs: https://docs.openclaw.ai
