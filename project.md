# 项目总结

## 项目概览
`oxygen-sales-pricing` 是一个基于 Next.js 16 + React 19 的内部销售报价与定价管理系统，面向 OXYGEN 团队的销售顾问使用。项目同时支持中英文界面、PWA 能力、Supabase 数据读取，以及报价/发票导出与邮件发送等功能。

## 技术栈
- 前端框架：Next.js App Router
- 语言：TypeScript
- UI / 样式：React、Tailwind CSS 4、Lucide Icons、Google Fonts
- 后端/数据：Supabase（含 `@supabase/supabase-js` 与 `@supabase/ssr`）
- 导出能力：`html2canvas`、`jspdf`、打印 HTML 生成
- 其他：PWA Service Worker、`resend` 邮件发送、`three` / `@react-three/*` 相关视觉能力

## 核心业务场景
### 1. 销售报价与价格查询
项目主体是定价查询与销售报价界面，主要服务以下业务分类：
- 会员（`membership`）
- 团课（`group_class`）
- 储值（`stored_value`）
- 周期计划（`cycle_plan`）
- 体测/评估（`assessment`）
- 私教课程（`personal_training`）

这些内容通过 `PricingShell` 组织，结合本地 copy 文案、价格计算逻辑和用户状态进行展示。

### 2. 私教与周期计划计算
项目中包含专门的状态管理与展示模块，用于：
- 私教课报价计算
- 周期计划生成与展示
- 促销文案/套餐推荐
- 价格预览与最终金额计算

### 3. 发票与报价单生成
系统还提供一套发票能力，包括：
- 新建发票页面
- 发票明细管理
- 客户档案读取与创建
- 发票记录查询
- PDF / HTML 导出
- 邮件发送
- 发票模板设置 API

## 页面结构
从 `src/app` 可以看出主要页面包括：
- `/membership`
- `/personal-training`
- `/cycle-plan`
- `/stored-value`
- `/invoice`
- `/new-invoice`

首页 `src/app/page.tsx` 会直接重定向到 `/membership`，说明会员报价页是默认入口。

## 数据模型
Supabase 侧的核心表结构主要围绕以下实体：
- `catalog_items`：商品/课程主表
- `catalog_variants`：价格与规格变体
- `cart_sessions`：购物车/报价会话
- `cart_items`：购物车条目
- `customer_profiles`：客户档案
- `invoices`：发票主表
- `invoice_items`：发票明细

这种设计支持“商品主数据 + 变体价格 + 会话/发票记录”的业务模型，适合报价与销售记录管理。

## 数据初始化
`supabase/seed.sql` 已预置了大量业务数据，包括：
- 会员产品
- 团课产品
- 储值卡档位
- 周期计划
- 评估服务
- 私教课程与不同会员类型/训练模式对应价格

这说明项目可以较快在本地或测试环境中跑出完整报价数据。

## 项目特点
- 中英文双语支持
- 面向内部销售人员的高密度业务界面
- 强依赖状态管理与文案驱动配置
- 集成 Supabase 数据源，便于同步业务数据
- 支持导出、打印、邮件发送等销售交付动作
- 兼顾桌面与移动端体验，并提供 PWA 能力

## 适合的使用者
- 销售顾问
- 门店/健身业务工作人员
- 需要快速生成报价单、发票和套餐说明的运营人员

## 简短结论
这是一个“销售报价 + 私教/课程定价 + 发票生成”的一体化内部工具，重点在于提升销售沟通效率、统一价格口径，并通过 Supabase 和导出能力把报价结果快速转化为可交付文档。
