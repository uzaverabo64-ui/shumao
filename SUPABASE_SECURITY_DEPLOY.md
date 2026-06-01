# Supabase 安全部署步骤

## 1. 更新数据库表和权限

在 Supabase 后台打开 SQL Editor，执行：

```sql
-- 复制并执行 supabase-orders.sql 的全部内容
```

这个脚本会：

- 增加 `base_amount`、`tx_hash`、`payment_verified_at`
- 把 `amount` 改为 6 位小数
- 创建 `delivery_inventory` 发货库存表
- 初始化 500 条 `手机号 - 密码 - 短信验证码接收链接 - 登录教程` 格式的发货资料
- 支付成功后按订单 `quantity` 锁定并发放同等数量的库存资料
- 删除匿名用户直接读写订单的策略
- 禁止前端直接更新订单、发货资料和支付状态

## 2. 部署 Edge Function

安装并登录 Supabase CLI 后，在项目目录执行：

```bash
supabase login
supabase link --project-ref zurlvrsrbfowquqsbbnh
supabase functions deploy orders --no-verify-jwt
```

`orders` 是公开前端调用的函数，鉴权和表权限由 Edge Function 内部的服务端逻辑与 RLS 控制；部署时需要关闭 Edge Function 自带 JWT 校验，否则 `sb_publishable_...` 前端 key 会收到 401。

## 3. 设置服务端密钥

在 Supabase 后台进入：

```text
Project Settings -> Edge Functions -> Secrets
```

确认存在：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` 只能放在 Edge Function 的 Secrets 里，不能放到 GitHub Pages、前端 JS 或公开仓库。

## 4. 验证

部署后，浏览器前端会调用：

```text
https://zurlvrsrbfowquqsbbnh.supabase.co/functions/v1/orders
```

订单创建、邮箱/订单号查询、到账检测、生成发货资料都会通过这个函数完成。
